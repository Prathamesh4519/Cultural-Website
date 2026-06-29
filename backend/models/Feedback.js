import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
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
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comments: {
    type: String,
    default: ''
  },
  damageReported: {
    type: Boolean,
    default: false
  },
  damageDescription: {
    type: String,
    default: ''
  },
  damagePhoto: {
    type: String, // Base64 data URL
    default: ''
  },
  fineAmount: {
    type: Number,
    default: 0
  },
  fineStatus: {
    type: String,
    enum: ['None', 'Pending', 'Paid'],
    default: 'None'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Feedback = mongoose.model('Feedback', feedbackSchema);
export default Feedback;
