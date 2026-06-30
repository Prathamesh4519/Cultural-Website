import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

// Models for Seeding
import Admin from './models/Admin.js';
import Room from './models/Room.js';
import Equipment from './models/Equipment.js';
import Booking from './models/Booking.js';
import AuditLog from './models/AuditLog.js';

// Route Imports
import authRoutes from './routes/auth.js';
import roomRoutes from './routes/rooms.js';
import bookingRoutes from './routes/bookings.js';
import equipmentRoutes from './routes/equipment.js';
import feedbackRoutes from './routes/feedback.js';
import analyticsRoutes from './routes/analytics.js';
import auditLogRoutes from './routes/auditLogs.js';
import notificationRoutes from './routes/notifications.js';

// Email Utils
import { sendBookingReminderEmail } from './utils/emailService.js';

dotenv.config();

// Connect to Database
connectDB();

const app = express();
const server = http.createServer(app);

// Configure Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

app.set('io', io);

// Socket.io Connection
io.on('connection', (socket) => {
  console.log(`Socket client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`Socket client disconnected: ${socket.id}`);
  });
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Support base64 image uploads

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/notifications', notificationRoutes);

// Root Route
app.get('/', (req, res) => {
  res.send('CultureSpace API is running...');
});

// Database Seeding Logic
const seedDatabase = async () => {
  try {
    // 1. Seed Admin Account
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      console.log('Seeding default administrator account...');
      await Admin.create({
        name: 'System Admin',
        email: 'admin@culturespace.edu',
        password: 'adminpassword', // Will be automatically hashed by Admin schema pre-save hook
        role: 'admin'
      });
      console.log('Default Admin Seeded: admin@culturespace.edu / adminpassword');
    }

    // 2. Seed Equipment
    const equipmentCount = await Equipment.countDocuments();
    if (equipmentCount === 0) {
      console.log('Seeding default equipment inventory...');
      const defaultEquip = [
        { name: 'Guitar', description: 'Acoustic-Electric Guitar with cable', totalQuantity: 3 },
        { name: 'Keyboard', description: '61-key MIDI Keyboard with stand', totalQuantity: 2 },
        { name: 'Drum Set', description: '5-piece Acoustic Drum Set with cymbals', totalQuantity: 1 },
        { name: 'Microphone', description: 'Shure SM58 Vocal Microphone with stand', totalQuantity: 6 },
        { name: 'Speakers', description: 'Active PA Speakers 1000W', totalQuantity: 4 },
        { name: 'Projector', description: 'Full HD Projector with HDMI input', totalQuantity: 2 }
      ];
      await Equipment.insertMany(defaultEquip);
      console.log('Default Equipment Seeded.');
    }

    // 3. Seed Rooms
    const roomCount = await Room.countDocuments();
    if (roomCount === 0) {
      console.log('Seeding default cultural room...');
      const defaultRooms = [
        {
          name: 'Cultural Room',
          description: 'College Cultural Room shared by Crescendo, Estoria, and D-Taraxia clubs for rehearsals, script readings, jam sessions, and performances.',
          capacity: 30,
          facilities: ['Soundproof Panels', 'Stage Platform', 'Spotlights', 'Full-Length Mirrors', 'Instrument Amplifiers', 'Surround Sound', 'AC'],
          timings: { open: '08:00', close: '21:00' },
          maintenanceDays: ['Sunday'],
          maxDuration: 3
        }
      ];
      await Room.insertMany(defaultRooms);
      console.log('Default Cultural Room Seeded.');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

seedDatabase();

// Background Schedulers for Booking Completions & Reminder Dispatches
const runBackgroundJobs = async () => {
  try {
    const now = new Date();
    
    // 1. Mark past bookings as "Completed"
    const activeBookings = await Booking.find({ status: 'Approved' }).populate('room');
    for (const booking of activeBookings) {
      const bookingDate = new Date(booking.date);
      const dateStr = bookingDate.toISOString().split('T')[0];
      const endDateTime = new Date(`${dateStr}T${booking.endTime}`);

      if (endDateTime < now) {
        booking.status = 'Completed';
        await booking.save();
        
        await AuditLog.create({
          action: 'BOOKING_AUTO_COMPLETE',
          actor: 'system',
          actorRole: 'system',
          details: `Automatically marked booking ID ${booking._id} for ${booking.room?.name || 'Room'} as Completed.`,
          ipAddress: '127.0.0.1'
        });
        console.log(`[JOBS] Auto-completed booking: ${booking._id}`);
      }
    }

    // 2. Send 24-hour reminder email
    const targetReminderTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const bookingsToRemind = await Booking.find({
      status: 'Approved',
      reminderSent: false,
      date: { $lte: targetReminderTime }
    }).populate('room');

    for (const booking of bookingsToRemind) {
      const bookingDate = new Date(booking.date);
      const dateStr = bookingDate.toISOString().split('T')[0];
      const startDateTime = new Date(`${dateStr}T${booking.startTime}`);

      const diffMs = startDateTime.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      // If booking starts in less than 24 hours (but is in the future)
      if (diffHours > 0 && diffHours <= 24) {
        await sendBookingReminderEmail(booking, booking.room?.name || 'Cultural Room');
        booking.reminderSent = true;
        await booking.save();

        await AuditLog.create({
          action: 'BOOKING_REMINDER_SEND',
          actor: 'system',
          actorRole: 'system',
          details: `Sent 24-hour reminder notification to ${booking.email} for booking ${booking._id}`,
          ipAddress: '127.0.0.1'
        });
        console.log(`[JOBS] Sent 24h reminder for booking: ${booking._id}`);
      }
    }
  } catch (error) {
    console.error('[JOBS] Error running background jobs:', error);
  }
};

// Run background jobs on start and then every 5 minutes
runBackgroundJobs();
setInterval(runBackgroundJobs, 5 * 60 * 1000);

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running in mode on port ${PORT}`);
});
