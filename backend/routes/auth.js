import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Admin from '../models/Admin.js';
import AuditLog from '../models/AuditLog.js';
import { sendVerificationOtp } from '../utils/emailService.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'culturespace_secret_key', {
    expiresIn: '30d'
  });
};

// @desc    Register a new student user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  const { name, email, password, rollNumber, department, clubName, contactNumber } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Validate college email domain
    const emailDomain = email.split('@')[1]?.toLowerCase();
    const allowedDomains = process.env.COLLEGE_DOMAINS
      ? process.env.COLLEGE_DOMAINS.split(',').map(d => d.trim().toLowerCase())
      : ['college.edu', 'student.college.edu', 'gmail.com']; // default to college domains and gmail for local testing ease

    if (!allowedDomains.includes(emailDomain)) {
      return res.status(400).json({
        message: `Invalid email. Registration is restricted to college domains: ${allowedDomains.join(', ')}`
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await User.create({
      name,
      email,
      password, // hashed in User pre-save hook
      rollNumber,
      department,
      clubName,
      contactNumber,
      verificationOtp: otp,
      otpExpires,
      isVerified: false
    });

    // Send email with OTP (runs in background, logs to console if SMTP not configured)
    await sendVerificationOtp(email, otp);

    // Audit Log
    await AuditLog.create({
      action: 'USER_REGISTER_INIT',
      actor: email,
      actorRole: 'student',
      details: `Student registration initiated for ${name} (${rollNumber})`,
      ipAddress: req.ip
    });

    res.status(201).json({
      message: 'Registration initiated. OTP sent to your email address.',
      email: user.email
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @desc    Verify OTP for student account activation
// @route   POST /api/auth/verify-otp
// @access  Public
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Account is already verified' });
    }

    if (user.verificationOtp !== otp || new Date() > user.otpExpires) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.isVerified = true;
    user.verificationOtp = null;
    user.otpExpires = null;
    await user.save();

    // Audit Log
    await AuditLog.create({
      action: 'USER_REGISTER_CONFIRM',
      actor: email,
      actorRole: 'student',
      details: `Student account verified and activated.`,
      ipAddress: req.ip
    });

    res.status(200).json({
      message: 'Account verified successfully. You can now log in.',
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        rollNumber: user.rollNumber,
        department: user.department,
        clubName: user.clubName,
        contactNumber: user.contactNumber,
        role: 'student'
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during verification' });
  }
});

// @desc    Student login
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isVerified) {
      // Re-trigger OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.verificationOtp = otp;
      user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();
      await sendVerificationOtp(email, otp);

      return res.status(403).json({
        message: 'Account not verified. A new OTP has been sent to your email.',
        unverified: true
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Audit Log
    await AuditLog.create({
      action: 'USER_LOGIN',
      actor: email,
      actorRole: 'student',
      details: 'Student logged in successfully.',
      ipAddress: req.ip
    });

    res.json({
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        rollNumber: user.rollNumber,
        department: user.department,
        clubName: user.clubName,
        contactNumber: user.contactNumber,
        role: 'student'
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @desc    Admin / Owner registration (Development purpose)
// @route   POST /api/auth/register-admin
// @access  Public
router.post('/register-admin', async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const adminExists = await Admin.findOne({ email });
    if (adminExists) {
      return res.status(400).json({ message: 'Admin with this email already exists' });
    }

    const admin = await Admin.create({
      name,
      email,
      password,
      role: role || 'admin'
    });

    res.status(201).json({
      message: 'Admin account created successfully.',
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Admin / Owner login
// @route   POST /api/auth/login-admin
// @access  Public
router.post('/login-admin', async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    // Audit Log
    await AuditLog.create({
      action: 'ADMIN_LOGIN',
      actor: email,
      actorRole: admin.role,
      details: `Admin/Owner logged in successfully.`,
      ipAddress: req.ip
    });

    res.json({
      token: generateToken(admin._id),
      user: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during admin login' });
  }
});

// @desc    Get user/admin profile
// @route   GET /api/auth/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  res.json({
    user: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.role,
      rollNumber: req.user.rollNumber || null,
      department: req.user.department || null,
      clubName: req.user.clubName || null,
      contactNumber: req.user.contactNumber || null
    }
  });
});

export default router;
