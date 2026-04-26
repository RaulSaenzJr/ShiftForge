const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const Event = require('../models/Event');
const Application = require('../models/Application');
const User = require('../models/User');
const { auth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Basic email notification stub
const sendClientNotification = ({ to, subject, message }) => {
  // In production integrate with real email provider (SendGrid, SES, etc.)
  console.log('--- CLIENT EMAIL NOTIFICATION ---');
  console.log('To:', to);
  console.log('Subject:', subject);
  console.log('Message:', message);
  console.log('---------------------------------');
};

// Get all events
router.get('/', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = { status: { $ne: 'cancelled' } };

    // Clients can only see their own events
    if (req.userRole === 'client') {
      query.client = req.userId;
    }

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const events = await Event.find(query)
      .populate('createdBy', 'firstName lastName')
      .populate('client', 'firstName lastName email')
      .sort({ date: 1 });

    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single event
router.get('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'firstName lastName')
      .populate('client', 'firstName lastName email');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Clients may only access their own event
    if (req.userRole === 'client' && event.client?.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create event (Admin only)
router.post('/', [auth, requireAdmin], [
  body('title').notEmpty(),
  body('clientName').notEmpty(),
  body('clientEmail').isEmail(),
  body('description').notEmpty(),
  body('date').isISO8601(),
  body('startTime').notEmpty(),
  body('endTime').notEmpty(),
  body('location').notEmpty(),
  body('shifts').isArray({ min: 1 }),
  body('clientContacts').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { clientName, clientEmail } = req.body;

    // Find or create client user
    let clientUser = await User.findOne({ email: clientEmail.toLowerCase() });

    if (clientUser && clientUser.role !== 'client') {
      return res.status(400).json({ message: 'Email is already used by another user type' });
    }

    let isNewClient = false;

    let tempPassword;
    if (!clientUser) {
      tempPassword = crypto.randomBytes(12).toString('base64url');
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      const [firstName, ...rest] = clientName.trim().split(' ');
      const lastName = rest.join(' ');

      clientUser = new User({
        email: clientEmail.toLowerCase(),
        password: hashedPassword,
        firstName: firstName || 'Client',
        lastName: lastName || '',
        role: 'client'
      });

      await clientUser.save();
      isNewClient = true;
    }

    const event = new Event({
      ...req.body,
      client: clientUser._id,
      clientName,
      clientEmail: clientEmail.toLowerCase(),
      clientContacts: req.body.clientContacts || [],
      createdBy: req.userId
    });

    await event.save();

    // Notify client via stub
    if (isNewClient) {
      sendClientNotification({
        to: clientEmail,
        subject: 'Your event was created',
        message: `Hello ${clientName},\n\nAn event has been created for you.\nLogin with email: ${clientEmail}\nTemporary password: ${tempPassword}\n\nPlease log in and view your event details.`
      });
    } else {
      sendClientNotification({
        to: clientEmail,
        subject: 'Event scheduled',
        message: `Hello ${clientName},\n\nYour event has been created and will be staffed ASAP.\nYou can log in with your existing credentials to view details.`
      });
    }

    res.status(201).json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get events for logged-in client
router.get('/mine/list', [auth], async (req, res) => {
  try {
    if (req.userRole !== 'client') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const events = await Event.find({ client: req.userId, status: { $ne: 'cancelled' } })
      .populate('createdBy', 'firstName lastName')
      .sort({ date: 1 });

    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update event (Admin only)
router.put('/:id', [auth, requireAdmin], async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Handle client update if provided
    if (req.body.clientEmail || req.body.clientName) {
      const clientName = req.body.clientName || event.clientName;
      const clientEmail = (req.body.clientEmail || event.clientEmail || '').toLowerCase();

      if (clientEmail) {
        let clientUser = await User.findOne({ email: clientEmail });

        if (clientUser && clientUser.role !== 'client') {
          return res.status(400).json({ message: 'Email is already used by another user type' });
        }

        if (!clientUser) {
          const tempPassword = crypto.randomBytes(12).toString('base64url');
          const hashedPassword = await bcrypt.hash(tempPassword, 10);

          const [firstName, ...rest] = clientName.trim().split(' ');
          const lastName = rest.join(' ');

          clientUser = new User({
            email: clientEmail,
            password: hashedPassword,
            firstName: firstName || 'Client',
            lastName: lastName || '',
            role: 'client'
          });

          await clientUser.save();
        }

        event.client = clientUser._id;
      }

      event.clientName = clientName;
      if (clientEmail) event.clientEmail = clientEmail;
    }

    // Update core fields if provided
    const updatableFields = ['title', 'description', 'date', 'startTime', 'endTime', 'location', 'status', 'clientContacts'];
    updatableFields.forEach(field => {
      if (typeof req.body[field] !== 'undefined') {
        event[field] = req.body[field];
      }
    });

    // Merge shifts if provided
    if (Array.isArray(req.body.shifts)) {
      const incoming = req.body.shifts;
      const existing = event.shifts || [];
      const merged = incoming.map(shift => {
        const prior = existing.find(s => s.role === shift.role);
        const priorFilled = prior ? prior.filled : 0;
        const filled = Math.min(priorFilled, shift.count ?? prior?.count ?? 0);
        return {
          role: shift.role,
          count: shift.count,
          payRate: shift.payRate,
          filled
        };
      });
      event.shifts = merged;
    }

    await event.save();

    const populated = await Event.findById(event._id)
      .populate('createdBy', 'firstName lastName')
      .populate('client', 'firstName lastName email');

    res.json(populated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete event (Admin only)
router.delete('/:id', [auth, requireAdmin], async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({ message: 'Event cancelled successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
