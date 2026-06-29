import express from 'express';
import Feedback from '../models/Feedback.js';
import Booking from '../models/Booking.js';
import AuditLog from '../models/AuditLog.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Submit feedback for a completed booking session
// @route   POST /api/feedback
// @access  Private (Student)
router.post('/', protect, restrictTo('student'), async (req, res) => {
  const { bookingId, rating, comments, damageReported, damageDescription, damagePhoto } = req.body;

  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to submit feedback for this booking' });
    }

    // Check if feedback already submitted for this booking
    const feedbackExists = await Feedback.findOne({ booking: bookingId });
    if (feedbackExists) {
      return res.status(400).json({ message: 'Feedback already submitted for this booking session.' });
    }

    // Check if the booking is finished (or status is Completed or Approved and in the past)
    const bookingDate = new Date(booking.date);
    const dateStr = bookingDate.toISOString().split('T')[0];
    const endDateTime = new Date(`${dateStr}T${booking.endTime}`);
    
    if (endDateTime > new Date() && booking.status !== 'Completed') {
      return res.status(400).json({ message: 'Cannot submit feedback before the booking session concludes.' });
    }

    const feedback = await Feedback.create({
      booking: bookingId,
      student: req.user._id,
      room: booking.room,
      rating,
      comments: comments || '',
      damageReported: damageReported || false,
      damageDescription: damageReported ? (damageDescription || '') : '',
      damagePhoto: damageReported ? (damagePhoto || '') : '',
      fineAmount: 0,
      fineStatus: damageReported ? 'Pending' : 'None'
    });

    // Create Audit Log
    await AuditLog.create({
      action: 'FEEDBACK_SUBMIT',
      actor: req.user.email,
      actorRole: 'student',
      details: `Submitted room feedback for booking ${bookingId} (Rating: ${rating}, Damage Reported: ${damageReported})`,
      ipAddress: req.ip
    });

    res.status(201).json({
      message: 'Feedback submitted successfully! Thank you for your review.',
      feedback
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error submitting feedback' });
  }
});

// @desc    Get reviews for a room
// @route   GET /api/feedback/room/:roomId
// @access  Public
router.get('/room/:roomId', async (req, res) => {
  try {
    const feedback = await Feedback.find({ room: req.params.roomId })
      .populate('student', 'name')
      .sort({ createdAt: -1 });
    res.json(feedback);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving feedback' });
  }
});

// @desc    Get all reviews & damage reports
// @route   GET /api/feedback
// @access  Private (Admin/Owner)
router.get('/', protect, restrictTo('admin', 'owner'), async (req, res) => {
  try {
    let query = {};
    if (req.role === 'owner') {
      query.room = { $in: req.user.managedRooms };
    }

    const feedback = await Feedback.find(query)
      .populate('student', 'name email rollNumber department contactNumber')
      .populate('room', 'name')
      .populate('booking', 'date startTime endTime purpose')
      .sort({ createdAt: -1 });

    res.json(feedback);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving feedback lists' });
  }
});

// @desc    Manage fine for damage
// @route   PUT /api/feedback/:id/fine
// @access  Private (Admin/Owner)
router.put('/:id/fine', protect, restrictTo('admin', 'owner'), async (req, res) => {
  const { fineAmount, fineStatus } = req.body;

  try {
    const feedback = await Feedback.findById(req.params.id).populate('room');
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    // Owner checks
    if (req.role === 'owner' && !req.user.managedRooms.includes(feedback.room._id)) {
      return res.status(403).json({ message: 'Not authorized to manage fines for this room' });
    }

    feedback.fineAmount = fineAmount !== undefined ? fineAmount : feedback.fineAmount;
    feedback.fineStatus = fineStatus !== undefined ? fineStatus : feedback.fineStatus;

    if (feedback.fineAmount === 0) {
      feedback.fineStatus = 'None';
    }

    await feedback.save();

    // Audit Log
    await AuditLog.create({
      action: 'FEEDBACK_FINE_UPDATE',
      actor: req.user.email,
      actorRole: req.role,
      details: `Updated fine details for feedback ID ${feedback._id} (Fine: ${feedback.fineAmount}, Status: ${feedback.fineStatus})`,
      ipAddress: req.ip
    });

    res.json({ message: 'Fine details updated successfully', feedback });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating fine details' });
  }
});

export default router;
