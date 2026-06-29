import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true // e.g. 'USER_REGISTER', 'BOOKING_CREATE', 'BOOKING_APPROVE', 'ROOM_MAINTENANCE'
  },
  actor: {
    type: String,
    required: true // Email of student or admin who triggered the action
  },
  actorRole: {
    type: String,
    enum: ['student', 'admin', 'owner', 'system'],
    required: true
  },
  details: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
