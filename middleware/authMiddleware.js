const jwt = require('jsonwebtoken');

const getTokenFromHeader = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
};

const protect = (req, res, next) => {
  const token = getTokenFromHeader(req);

  if (!token) {
    return res.status(401).json({
      status: 'fail',
      message: 'Not authorized. Please log in and send a token.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id || decoded._id || decoded.userId;

    if (!userId || !decoded.role) {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid token payload.',
      });
    }

    req.user = { id: String(userId), role: decoded.role };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'fail',
        message: 'Token expired. Please log in again.',
      });
    }

    return res.status(401).json({
      status: 'fail',
      message: 'Invalid token.',
    });
  }
};

const restrictTo = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      status: 'fail',
      message: 'You do not have permission to perform this action.',
    });
  }
  next();
};

module.exports = { protect, restrictTo };
