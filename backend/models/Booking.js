import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  rollNumber: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  clubName: {
    type: String,
    default: ''
  },
  contactNumber: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  purpose: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String, // HH:MM
    required: true
  },
  endTime: {
    type: String, // HH:MM
    required: true
  },
  participantsCount: {
    type: Number,
    required: true
  },
  equipment: [{
    equipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Equipment',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      default: 1
    }
  }],
  additionalNotes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Cancelled', 'Completed'],
    default: 'Pending'
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  qrCode: {
    type: String, // Base64 data URL
    default: ''
  },
  checkedIn: {
    type: Boolean,
    default: false
  },
  checkedInAt: {
    type: Date,
    default: null
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
