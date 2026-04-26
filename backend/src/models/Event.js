const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true
  },
  count: {
    type: Number,
    required: true,
    min: 1
  },
  payRate: {
    type: Number,
    required: true
  },
  filled: {
    type: Number,
    default: 0
  }
});

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  clientName: {
    type: String
  },
  clientEmail: {
    type: String,
    lowercase: true,
    trim: true
  },
  clientContacts: [{
    name: String,
    email: {
      type: String,
      lowercase: true,
      trim: true
    },
    role: String,
    phone: String
  }],
  description: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  shifts: [shiftSchema],
  status: {
    type: String,
    enum: ['draft', 'published', 'completed', 'cancelled'],
    default: 'published'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Event', eventSchema);
