require('dotenv').config();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const role = process.argv[2] || 'owner';
const id = process.argv[3] || new mongoose.Types.ObjectId().toString();
const secret = process.env.JWT_SECRET;

if (!secret) {
  console.error('JWT_SECRET is missing. Check your .env file.');
  process.exit(1);
}

const token = jwt.sign({ id, role }, secret, { expiresIn: '1d' });
console.log('Role:', role);
console.log('User id:', id);
console.log('Token:\n');
console.log(token);
