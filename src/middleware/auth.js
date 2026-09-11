const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to protect routes and verify JWT Bearer token
 */
const protect = async (req, res, next) => {
  let token;

  // 1. Check for token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Format is "Bearer <token>"
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2) {
      token = parts[1];
    }
  }

  // Missing token
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route, no token provided'
    });
  }

  try {
    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Find user belonging to token
    const currentUser = await User.findById(decoded.id);

    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists'
      });
    }

    // 4. Attach user to request
    req.user = currentUser;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired, please log in again'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid token, authorization denied'
    });
  }
};

/**
 * Middleware to restrict access to specified roles
 * @param  {...string} roles - Allowed roles (e.g. 'admin', 'owner', 'customer')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }

    next();
  };
};

module.exports = {
  protect,
  authorize
};
