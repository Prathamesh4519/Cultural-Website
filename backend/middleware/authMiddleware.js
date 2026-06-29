import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Admin from '../models/Admin.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Decode token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'culturespace_secret_key');

      // Check User model first (Students)
      let user = await User.findById(decoded.id).select('-password');
      
      if (user) {
        req.user = user;
        req.role = 'student';
        return next();
      }

      // Check Admin model (Admins/Owners)
      let admin = await Admin.findById(decoded.id).select('-password');
      if (admin) {
        req.user = admin;
        req.role = admin.role; // 'admin' or 'owner'
        return next();
      }

      return res.status(401).json({ message: 'Not authorized, token failed' });
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.role || !roles.includes(req.role)) {
      return res.status(403).json({
        message: `Forbidden: Access restricted to roles: [${roles.join(', ')}] (Your role: ${req.role})`
      });
    }
    next();
  };
};
