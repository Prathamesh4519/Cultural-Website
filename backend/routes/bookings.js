import express from 'express';
import Booking from '../models/Booking.js';
import Room from '../models/Room.js';
import Equipment from '../models/Equipment.js';
import AuditLog from '../models/AuditLog.js';
import Notification from '../models/Notification.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { generateQR } from '../utils/qrGenerator.js';
import {
  sendBookingRequestEmail,
  sendBookingApprovalEmail,
  sendBookingRejectionEmail
} from '../utils/emailService.js';
import Admin from '../models/Admin.js';

const router = express.Router();

// Helper: Convert time string 'HH:MM' to minutes since midnight
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Helper: Check if two time slots overlap on the same date
const checkOverlap = (start1, end1, start2, end2) => {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  return s1 < e2 && s2 < e1;
};

// @desc    Get all bookings (For FullCalendar visual layout - returns minimal details for privacy)
// @route   GET /api/bookings/calendar
// @access  Public
router.get('/calendar', async (req, res) => {
  try {
    const bookings = await Booking.find({
      status: { $in: ['Approved', 'Pending', 'Rejected'] }
    }).populate('room', 'name');

    // Also get all rooms to add maintenance days as grey events if desired, 
    // or just return the bookings. We will return bookings formatted for FullCalendar.
    const events = bookings.map(b => {
      let color = '#eab308'; // Pending (Yellow)
      if (b.status === 'Approved') color = '#22c55e'; // Approved (Green)
      if (b.status === 'Rejected') color = '#ef4444'; // Rejected (Red)

      // Format start and end date strings for FullCalendar
      const dateStr = new Date(b.date).toISOString().split('T')[0];
      return {
        id: b._id,
        title: `${b.room?.name || 'Room'} - ${b.clubName || b.studentName} (${b.status})`,
        start: `${dateStr}T${b.startTime}`,
        end: `${dateStr}T${b.endTime}`,
        backgroundColor: color,
        borderColor: color,
        extendedProps: {
          roomName: b.room?.name,
          studentName: b.studentName,
          rollNumber: b.rollNumber,
          clubName: b.clubName,
          purpose: b.purpose,
          status: b.status,
          participantsCount: b.participantsCount,
          date: dateStr,
          startTime: b.startTime,
          endTime: b.endTime
        }
      };
    });

    // We can also retrieve maintenance blocks from Room documents and send them as grey events
    const rooms = await Room.find({ isActive: true });
    rooms.forEach(room => {
      // Add standard maintenance days (repeat for next 3 months)
      room.maintenanceDays.forEach(day => {
        // Find matching days in next 90 days and add as grey blocks
        const start = new Date();
        for (let i = 0; i < 90; i++) {
          const checkDate = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
          const dayName = checkDate.toLocaleDateString('en-US', { weekday: 'long' });
          if (dayName === day) {
            const dateStr = checkDate.toISOString().split('T')[0];
            events.push({
              title: `${room.name} - Maintenance Day`,
              start: `${dateStr}T${room.timings.open}`,
              end: `${dateStr}T${room.timings.close}`,
              backgroundColor: '#6b7280', // Grey
              borderColor: '#6b7280',
              allDay: false,
              extendedProps: {
                status: 'Maintenance',
                roomName: room.name,
                purpose: 'Scheduled Maintenance'
              }
            });
          }
        }
      });

      // Add specific unavailable dates
      room.unavailableDates.forEach(date => {
        const dateStr = new Date(date).toISOString().split('T')[0];
        events.push({
          title: `${room.name} - Unavailable`,
          start: `${dateStr}T${room.timings.open}`,
          end: `${dateStr}T${room.timings.close}`,
          backgroundColor: '#4b5563', // Darker Grey
          borderColor: '#4b5563',
          extendedProps: {
            status: 'Maintenance',
            roomName: room.name,
            purpose: 'Admin Maintenance Block'
          }
        });
      });
    });

    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving calendar' });
  }
});

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private (Student)
router.post('/', protect, restrictTo('student'), async (req, res) => {
  const {
    roomId,
    purpose,
    date,
    startTime,
    endTime,
    participantsCount,
    equipment, // array of { equipmentId, quantity }
    additionalNotes
  } = req.body;

  try {
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (!room.isActive) {
      return res.status(400).json({ message: 'This room is currently unavailable' });
    }

    // 1. Validation: Booking times vs Working hours
    const bookStart = timeToMinutes(startTime);
    const bookEnd = timeToMinutes(endTime);
    const openTime = timeToMinutes(room.timings.open);
    const closeTime = timeToMinutes(room.timings.close);

    if (bookStart < openTime || bookEnd > closeTime || bookStart >= bookEnd) {
      return res.status(400).json({
        message: `Booking must be within room opening hours: ${room.timings.open} - ${room.timings.close}`
      });
    }

    // 2. Validation: Booking duration limit
    const durationHours = (bookEnd - bookStart) / 60;
    if (durationHours > room.maxDuration) {
      return res.status(400).json({
        message: `Booking duration exceeds maximum limit of ${room.maxDuration} hours for this room.`
      });
    }

    // 3. Validation: Maintenance days check (e.g. Sunday)
    const bookingDate = new Date(date);
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const bookingDayOfWeek = daysOfWeek[bookingDate.getDay()];
    
    if (room.maintenanceDays.includes(bookingDayOfWeek)) {
      return res.status(400).json({
        message: `Cannot book: ${room.name} is closed for maintenance on ${bookingDayOfWeek}s`
      });
    }

    // 4. Validation: Check specific unavailable dates
    const isUnavailable = room.unavailableDates.some(ud => 
      new Date(ud).toDateString() === bookingDate.toDateString()
    );
    if (isUnavailable) {
      return res.status(400).json({
        message: `Cannot book: ${room.name} has a scheduled maintenance block on this date.`
      });
    }

    // 5. Validation: Prevent duplicate bookings by the SAME user at the SAME time slot
    const duplicateUserBooking = await Booking.findOne({
      student: req.user._id,
      date: {
        $gte: new Date(bookingDate.setHours(0,0,0,0)),
        $lt: new Date(bookingDate.setHours(23,59,59,999))
      },
      status: { $in: ['Pending', 'Approved'] }
    });

    if (duplicateUserBooking) {
      // Check if times overlap
      if (checkOverlap(startTime, endTime, duplicateUserBooking.startTime, duplicateUserBooking.endTime)) {
        return res.status(400).json({
          message: 'You already have another active booking request overlapping with this time slot.'
        });
      }
    }

    // Reset date object
    const finalBookingDate = new Date(date);

    // 6. Validation: Prevent overlapping APPROVED bookings
    const overlappingBookings = await Booking.find({
      room: roomId,
      date: {
        $gte: new Date(finalBookingDate.setHours(0,0,0,0)),
        $lt: new Date(finalBookingDate.setHours(23,59,59,999))
      },
      status: 'Approved'
    });

    for (const ob of overlappingBookings) {
      if (checkOverlap(startTime, endTime, ob.startTime, ob.endTime)) {
        return res.status(400).json({
          message: 'This slot is already booked and approved. Please choose another time.'
        });
      }
    }

    // 7. Validation: Equipment double booking check
    // Look up approved bookings for the same day and time block to see if equipment inventory is exhausted
    if (equipment && equipment.length > 0) {
      for (const eqItem of equipment) {
        const item = await Equipment.findById(eqItem.equipmentId);
        if (!item) {
          return res.status(404).json({ message: `Equipment not found: ${eqItem.equipmentId}` });
        }

        // Count how many are already reserved in overlapping APPROVED bookings
        const siblingBookings = await Booking.find({
          date: {
            $gte: new Date(finalBookingDate.setHours(0,0,0,0)),
            $lt: new Date(finalBookingDate.setHours(23,59,59,999))
          },
          status: 'Approved'
        });

        let reservedQty = 0;
        siblingBookings.forEach(sib => {
          if (checkOverlap(startTime, endTime, sib.startTime, sib.endTime)) {
            const match = sib.equipment.find(e => e.equipmentId.toString() === eqItem.equipmentId.toString());
            if (match) reservedQty += match.quantity;
          }
        });

        const availableNow = item.totalQuantity - reservedQty;
        if (eqItem.quantity > availableNow) {
          return res.status(400).json({
            message: `Only ${availableNow} unit(s) of ${item.name} are available during this slot. Requested: ${eqItem.quantity}`
          });
        }
      }
    }

    // Create the booking (Auto-approved under FCFS rule)
    const booking = new Booking({
      student: req.user._id,
      room: roomId,
      studentName: req.user.name,
      rollNumber: req.user.rollNumber,
      department: req.user.department,
      clubName: req.user.clubName || '',
      contactNumber: req.user.contactNumber,
      email: req.user.email,
      purpose,
      date: finalBookingDate,
      startTime,
      endTime,
      participantsCount,
      equipment: equipment || [],
      additionalNotes: additionalNotes || '',
      status: 'Approved' // FCFS auto-approve
    });

    // Generate QR Code immediately
    const qrCodeDataUrl = await generateQR(booking._id.toString());
    booking.qrCode = qrCodeDataUrl;
    await booking.save();

    // Create system notification for Student
    await Notification.create({
      recipient: req.user._id,
      recipientModel: 'User',
      title: 'Booking Confirmed!',
      message: `Your booking for ${room.name} on ${finalBookingDate.toLocaleDateString()} has been auto-approved (First Come First Serve).`
    });

    // Audit Log
    await AuditLog.create({
      action: 'BOOKING_CREATE_AUTO_APPROVE',
      actor: req.user.email,
      actorRole: 'student',
      details: `Auto-approved FCFS booking for ${room.name} on ${finalBookingDate.toLocaleDateString()} (${startTime}-${endTime})`,
      ipAddress: req.ip
    });

    // Send confirmation email with QR code directly to the student
    await sendBookingApprovalEmail(booking, room.name);

    // Notify connected websockets (real-time updates)
    if (req.app.get('io')) {
      req.app.get('io').emit('bookingUpdated', { bookingId: booking._id, status: 'Approved' });
    }

    res.status(201).json({
      message: 'Booking confirmed and approved automatically (First Come First Serve)!',
      booking
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating booking request' });
  }
});

// @desc    Get bookings for logged-in student
// @route   GET /api/bookings/my-bookings
// @access  Private (Student)
router.get('/my-bookings', protect, restrictTo('student'), async (req, res) => {
  try {
    const bookings = await Booking.find({ student: req.user._id })
      .populate('room', 'name image capacity')
      .populate('equipment.equipmentId', 'name')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving bookings' });
  }
});

// @desc    Get all bookings (Admin/Owner view)
// @route   GET /api/bookings
// @access  Private (Admin/Owner)
router.get('/', protect, restrictTo('admin', 'owner'), async (req, res) => {
  try {
    let query = {};
    
    // Room Owners can only view bookings of rooms they manage
    if (req.role === 'owner') {
      query.room = { $in: req.user.managedRooms };
    }

    const bookings = await Booking.find(query)
      .populate('room', 'name capacity')
      .populate('equipment.equipmentId', 'name')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving all bookings' });
  }
});

// @desc    Cancel booking before approved
// @route   PUT /api/bookings/:id/cancel
// @access  Private (Student)
router.put('/:id/cancel', protect, restrictTo('student'), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }

    if (booking.status !== 'Pending') {
      return res.status(400).json({ message: `Cannot cancel booking when status is already ${booking.status}` });
    }

    booking.status = 'Cancelled';
    await booking.save();

    // Audit Log
    await AuditLog.create({
      action: 'BOOKING_CANCEL',
      actor: req.user.email,
      actorRole: 'student',
      details: `Student cancelled booking for booking ID: ${booking._id}`,
      ipAddress: req.ip
    });

    if (req.app.get('io')) {
      req.app.get('io').emit('bookingUpdated', { bookingId: booking._id, status: 'Cancelled' });
    }

    res.json({ message: 'Booking cancelled successfully', booking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error cancelling booking' });
  }
});

// @desc    Approve booking request
// @route   PUT /api/bookings/:id/approve
// @access  Private (Admin/Owner)
router.put('/:id/approve', protect, restrictTo('admin', 'owner'), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('room');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Owner checks
    if (req.role === 'owner' && !req.user.managedRooms.includes(booking.room._id)) {
      return res.status(403).json({ message: 'Not authorized to approve bookings for this room' });
    }

    if (booking.status !== 'Pending') {
      return res.status(400).json({ message: `Booking is already ${booking.status}` });
    }

    // Double check conflict before approving (in case another booking got approved in the meantime)
    const bookingDate = new Date(booking.date);
    const conflicts = await Booking.find({
      room: booking.room._id,
      date: {
        $gte: new Date(bookingDate.setHours(0,0,0,0)),
        $lt: new Date(bookingDate.setHours(23,59,59,999))
      },
      status: 'Approved',
      _id: { $ne: booking._id }
    });

    for (const conf of conflicts) {
      if (checkOverlap(booking.startTime, booking.endTime, conf.startTime, conf.endTime)) {
        return res.status(400).json({
          message: `Cannot approve: Overlaps with an already approved booking (${conf.startTime}-${conf.endTime})`
        });
      }
    }

    // Generate QR Code containing booking ID
    const qrCodeDataUrl = await generateQR(booking._id.toString());

    booking.status = 'Approved';
    booking.qrCode = qrCodeDataUrl;
    await booking.save();

    // Create student notification
    await Notification.create({
      recipient: booking.student,
      recipientModel: 'User',
      title: 'Booking Approved!',
      message: `Your request for ${booking.room.name} on ${new Date(booking.date).toLocaleDateString()} is approved.`
    });

    // Audit Log
    await AuditLog.create({
      action: 'BOOKING_APPROVE',
      actor: req.user.email,
      actorRole: req.role,
      details: `Approved booking request ID: ${booking._id} for ${booking.room.name}`,
      ipAddress: req.ip
    });

    // Send confirmation email with QR Code
    await sendBookingApprovalEmail(booking, booking.room.name);

    if (req.app.get('io')) {
      req.app.get('io').emit('bookingUpdated', { bookingId: booking._id, status: 'Approved' });
    }

    res.json({ message: 'Booking approved successfully', booking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error approving booking' });
  }
});

// @desc    Reject booking request
// @route   PUT /api/bookings/:id/reject
// @access  Private (Admin/Owner)
router.put('/:id/reject', protect, restrictTo('admin', 'owner'), async (req, res) => {
  const { reason } = req.body;

  if (!reason) {
    return res.status(400).json({ message: 'Please provide a reason for rejection' });
  }

  try {
    const booking = await Booking.findById(req.params.id).populate('room');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Owner checks
    if (req.role === 'owner' && !req.user.managedRooms.includes(booking.room._id)) {
      return res.status(403).json({ message: 'Not authorized to reject bookings for this room' });
    }

    if (booking.status !== 'Pending') {
      return res.status(400).json({ message: `Booking is already ${booking.status}` });
    }

    booking.status = 'Rejected';
    booking.rejectionReason = reason;
    await booking.save();

    // Create student notification
    await Notification.create({
      recipient: booking.student,
      recipientModel: 'User',
      title: 'Booking Rejected',
      message: `Your request for ${booking.room.name} on ${new Date(booking.date).toLocaleDateString()} was rejected: ${reason}`
    });

    // Audit Log
    await AuditLog.create({
      action: 'BOOKING_REJECT',
      actor: req.user.email,
      actorRole: req.role,
      details: `Rejected booking request ID: ${booking._id} (Reason: ${reason})`,
      ipAddress: req.ip
    });

    // Send rejection email
    await sendBookingRejectionEmail(booking, booking.room.name, reason);

    if (req.app.get('io')) {
      req.app.get('io').emit('bookingUpdated', { bookingId: booking._id, status: 'Rejected' });
    }

    res.json({ message: 'Booking rejected successfully', booking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error rejecting booking' });
  }
});

// @desc    Scan QR Code to Check In
// @route   POST /api/bookings/scan-checkin
// @access  Private (Admin/Owner)
router.post('/scan-checkin', protect, restrictTo('admin', 'owner'), async (req, res) => {
  const { bookingId } = req.body;

  if (!bookingId) {
    return res.status(400).json({ message: 'Booking ID is required' });
  }

  try {
    const booking = await Booking.findById(bookingId).populate('room');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Owner checks
    if (req.role === 'owner' && !req.user.managedRooms.includes(booking.room._id)) {
      return res.status(403).json({ message: 'Not authorized for check-ins in this room' });
    }

    if (booking.status !== 'Approved') {
      return res.status(400).json({ message: `Cannot check in. Booking status is ${booking.status}` });
    }

    if (booking.checkedIn) {
      return res.status(400).json({ message: 'Student is already checked in for this session.' });
    }

    booking.checkedIn = true;
    booking.checkedInAt = new Date();
    await booking.save();

    // Create system log
    await AuditLog.create({
      action: 'BOOKING_CHECKIN',
      actor: req.user.email,
      actorRole: req.role,
      details: `Checked-in student ${booking.studentName} for booking ID: ${booking._id}`,
      ipAddress: req.ip
    });

    if (req.app.get('io')) {
      req.app.get('io').emit('bookingUpdated', { bookingId: booking._id, status: 'Approved', checkedIn: true });
    }

    res.json({
      message: `Check-in successful! Welcome, ${booking.studentName}.`,
      booking
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error processing check-in' });
  }
});

// @desc    Get single booking details
// @route   GET /api/bookings/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('room')
      .populate('equipment.equipmentId');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify authorized user
    if (req.role === 'student' && booking.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this booking' });
    }

    if (req.role === 'owner' && !req.user.managedRooms.includes(booking.room._id)) {
      return res.status(403).json({ message: 'Not authorized to view bookings for this room' });
    }

    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving booking details' });
  }
});

export default router;
