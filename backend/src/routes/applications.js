const express = require('express');
const { body, validationResult } = require('express-validator');
const Application = require('../models/Application');
const Event = require('../models/Event');
const User = require('../models/User');
const { auth, requireAdmin, requireContractor } = require('../middleware/auth');

const router = express.Router();

// Get all applications (Admin: all, Contractor: own)
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'contractor') {
      query.contractor = req.userId;
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.eventId) {
      query.event = req.query.eventId;
    }

    const applications = await Application.find(query)
      .populate('event', 'title date startTime endTime location')
      .populate('contractor', 'firstName lastName email')
      .populate('reviewedBy', 'firstName lastName')
      .sort({ appliedAt: -1 });

    res.json(applications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Apply for a shift (Contractor only)
router.post('/', [auth, requireContractor], [
  body('eventId').notEmpty(),
  body('role').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { eventId, role } = req.body;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if shift exists for this role
    const shift = event.shifts.find(s => s.role === role);
    if (!shift) {
      return res.status(400).json({ message: 'Role not available for this event' });
    }

    // Check if contractor has this role
    if (!req.user.availableRoles.includes(role)) {
      return res.status(400).json({ message: 'You are not qualified for this role' });
    }

    // Check if already applied
    const existingApplication = await Application.findOne({
      event: eventId,
      contractor: req.userId,
      role
    });

    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied for this role' });
    }

    // Create application
    const application = new Application({
      event: eventId,
      contractor: req.userId,
      role
    });

    await application.save();
    await application.populate('event', 'title date startTime endTime location');

    res.status(201).json(application);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Review application (Admin only)
router.patch('/:id/review', [auth, requireAdmin], [
  body('status').isIn(['approved', 'rejected']),
  body('notes').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, notes } = req.body;

    const application = await Application.findById(req.params.id)
      .populate('event');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({ message: 'Application has already been reviewed' });
    }

    // Update application
    application.status = status;
    application.reviewedBy = req.userId;
    application.reviewedAt = new Date();
    if (notes) application.notes = notes;

    await application.save();

    // Update event shift filled count if approved
    if (status === 'approved') {
      const event = await Event.findById(application.event._id);
      const shift = event.shifts.find(s => s.role === application.role);
      if (shift) {
        shift.filled += 1;
        await event.save();
      }
    }

    await application.populate('contractor', 'firstName lastName email');
    await application.populate('reviewedBy', 'firstName lastName');

    res.json(application);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel application (Contractor only)
router.delete('/:id', [auth, requireContractor], async (req, res) => {
  try {
    const application = await Application.findOne({
      _id: req.params.id,
      contractor: req.userId
    });

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot cancel reviewed application' });
    }

    await Application.findByIdAndDelete(req.params.id);
    res.json({ message: 'Application cancelled successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Direct assign contractor to shift (bypass application)
router.post('/assign', [auth, requireAdmin], [
  body('eventId').notEmpty(),
  body('contractorId').notEmpty(),
  body('role').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { eventId, contractorId, role } = req.body;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if contractor exists
    const contractor = await User.findById(contractorId);
    if (!contractor || contractor.role !== 'contractor') {
      return res.status(404).json({ message: 'Contractor not found' });
    }

    // Check if shift exists for this role
    const shift = event.shifts.find(s => s.role === role);
    if (!shift) {
      return res.status(400).json({ message: 'Role not available for this event' });
    }

    // Check if already assigned or applied
    const existing = await Application.findOne({
      event: eventId,
      contractor: contractorId,
      role
    });

    if (existing) {
      if (existing.status === 'approved') {
        return res.status(400).json({ message: 'Contractor already assigned to this role' });
      }
      // If pending/rejected, update to approved with admin assignment note
      existing.status = 'approved';
      existing.reviewedBy = req.userId;
      existing.reviewedAt = Date.now();
      existing.notes = 'Direct assignment by admin';
      await existing.save();
      await existing.populate('event', 'title date startTime endTime location');
      await existing.populate('contractor', 'firstName lastName email');
      return res.json(existing);
    }

    // Create new approved application
    const assignment = new Application({
      event: eventId,
      contractor: contractorId,
      role,
      status: 'approved',
      reviewedBy: req.userId,
      reviewedAt: Date.now(),
      notes: 'Direct assignment by admin'
    });

    await assignment.save();
    await assignment.populate('event', 'title date startTime endTime location');
    await assignment.populate('contractor', 'firstName lastName email');

    // Update shift filled count
    shift.filled += 1;
    await event.save();

    res.status(201).json(assignment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
