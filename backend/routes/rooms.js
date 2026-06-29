import express from 'express';
import Room from '../models/Room.js';
import AuditLog from '../models/AuditLog.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Get all rooms
// @route   GET /api/rooms
// @access  Public (or Private)
router.get('/', async (req, res) => {
  try {
    const rooms = await Room.find({});
    res.json(rooms);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving rooms' });
  }
});

// @desc    Get single room
// @route   GET /api/rooms/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.json(room);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving room details' });
  }
});

// @desc    Create a room
// @route   POST /api/rooms
// @access  Private (Admin/Owner)
router.post('/', protect, restrictTo('admin', 'owner'), async (req, res) => {
  const { name, description, capacity, facilities, image, timings, maintenanceDays, maxDuration } = req.body;

  try {
    const roomExists = await Room.findOne({ name });
    if (roomExists) {
      return res.status(400).json({ message: 'Room with this name already exists' });
    }

    const room = await Room.create({
      name,
      description,
      capacity,
      facilities: facilities || [],
      image: image || '',
      timings: timings || { open: '08:00', close: '21:00' },
      maintenanceDays: maintenanceDays || [],
      maxDuration: maxDuration || 3
    });

    // Audit Log
    await AuditLog.create({
      action: 'ROOM_CREATE',
      actor: req.user.email,
      actorRole: req.role,
      details: `Created new room: ${name} (Capacity: ${capacity})`,
      ipAddress: req.ip
    });

    res.status(201).json(room);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating room' });
  }
});

// @desc    Update room details
// @route   PUT /api/rooms/:id
// @access  Private (Admin/Owner)
router.put('/:id', protect, restrictTo('admin', 'owner'), async (req, res) => {
  const { name, description, capacity, facilities, image, timings, maintenanceDays, unavailableDates, maxDuration, isActive } = req.body;

  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    room.name = name !== undefined ? name : room.name;
    room.description = description !== undefined ? description : room.description;
    room.capacity = capacity !== undefined ? capacity : room.capacity;
    room.facilities = facilities !== undefined ? facilities : room.facilities;
    room.image = image !== undefined ? image : room.image;
    room.timings = timings !== undefined ? timings : room.timings;
    room.maintenanceDays = maintenanceDays !== undefined ? maintenanceDays : room.maintenanceDays;
    room.unavailableDates = unavailableDates !== undefined ? unavailableDates : room.unavailableDates;
    room.maxDuration = maxDuration !== undefined ? maxDuration : room.maxDuration;
    room.isActive = isActive !== undefined ? isActive : room.isActive;

    const updatedRoom = await room.save();

    // Audit Log
    await AuditLog.create({
      action: 'ROOM_UPDATE',
      actor: req.user.email,
      actorRole: req.role,
      details: `Updated room configuration: ${room.name}`,
      ipAddress: req.ip
    });

    res.json(updatedRoom);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating room details' });
  }
});

// @desc    Delete a room
// @route   DELETE /api/rooms/:id
// @access  Private (Admin)
router.delete('/:id', protect, restrictTo('admin'), async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const roomName = room.name;
    await Room.findByIdAndDelete(req.params.id);

    // Audit Log
    await AuditLog.create({
      action: 'ROOM_DELETE',
      actor: req.user.email,
      actorRole: req.role,
      details: `Deleted room: ${roomName}`,
      ipAddress: req.ip
    });

    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting room' });
  }
});

export default router;
