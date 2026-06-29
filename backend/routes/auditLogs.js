import express from 'express';
import AuditLog from '../models/AuditLog.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Get all audit logs
// @route   GET /api/audit-logs
// @access  Private (Admin)
router.get('/', protect, restrictTo('admin'), async (req, res) => {
  try {
    const logs = await AuditLog.find({})
      .sort({ timestamp: -1 })
      .limit(100); // return last 100 entries
    res.json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving audit logs' });
  }
});

export default router;
