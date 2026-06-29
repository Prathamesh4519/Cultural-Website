import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  capacity: {
    type: Number,
    required: true
  },
  facilities: [{
    type: String,
    trim: true
  }],
  image: {
    type: String, // Base64 representation of image
    default: ''
  },
  timings: {
    open: {
      type: String,
      default: '08:00' // Format HH:MM
    },
    close: {
      type: String,
      default: '21:00' // Format HH:MM
    }
  },
  maintenanceDays: [{
    type: String // e.g. ["Sunday", "Saturday"]
  }],
  unavailableDates: [{
    type: Date // specific dates marked as unavailable
  }],
  maxDuration: {
    type: Number, // in hours, default 3
    default: 3
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Room = mongoose.model('Room', roomSchema);
export default Room;
