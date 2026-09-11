const jwt = require('jsonwebtoken');

/**
 * Generate a signed JWT token with user id and role
 * @param {string} id - User ID
 * @param {string} role - User role
 * @returns {string} Signed JWT token
 */
const generateToken = (id, role) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

module.exports = generateToken;
