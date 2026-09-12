require('dotenv').config();

const assert = require('assert');
const jwt = require('jsonwebtoken');
const User = require('../src/models/User');
const { protect, authorize } = require('../src/middleware/auth');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-for-middleware';

const mockRes = () => ({
  statusCode: 200,
  body: null,
  status(code) { this.statusCode = code; return this; },
  json(payload) { this.body = payload; return this; }
});

const run = async () => {
  let passed = 0;
  let failed = 0;

  const check = (condition, title) => {
    if (condition) {
      passed += 1;
      console.log(` PASS: ${title}`);
    } else {
      failed += 1;
      console.log(` FAIL: ${title}`);
    }
  };

  console.log('--- Restaurant Auth Guard Tests ---\n');

  const missingReq = { headers: {} };
  const missingRes = mockRes();
  await protect(missingReq, missingRes, () => {});
  check(missingRes.statusCode === 401, 'Missing token returns 401');

  const invalidReq = { headers: { authorization: 'Bearer not-a-real-token' } };
  const invalidRes = mockRes();
  await protect(invalidReq, invalidRes, () => {});
  check(invalidRes.statusCode === 401, 'Invalid token returns 401');

  const expired = jwt.sign({ id: '507f1f77bcf86cd799439011', role: 'owner' }, process.env.JWT_SECRET, { expiresIn: -1 });
  const expiredRes = mockRes();
  await protect({ headers: { authorization: `Bearer ${expired}` } }, expiredRes, () => {});
  check(expiredRes.statusCode === 401 && expiredRes.body.message.includes('expired'), 'Expired token returns 401');

  const originalFindById = User.findById;
  User.findById = async () => ({
    _id: '507f1f77bcf86cd799439011',
    name: 'Owner',
    email: 'owner@test.com',
    role: 'owner'
  });

  try {
    const token = jwt.sign({ id: '507f1f77bcf86cd799439011', role: 'owner' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    let nextCalled = false;
    await protect(req, res, () => { nextCalled = true; });
    check(nextCalled && req.user.role === 'owner', 'Valid token loads the current user');
  } finally {
    User.findById = originalFindById;
  }

  const customerReq = { user: { role: 'customer' } };
  const customerRes = mockRes();
  let customerNext = false;
  authorize('owner', 'admin')(customerReq, customerRes, () => { customerNext = true; });
  check(customerRes.statusCode === 403 && !customerNext, 'Customer is rejected from owner route');

  const ownerReq = { user: { role: 'owner' } };
  const ownerRes = mockRes();
  let ownerNext = false;
  authorize('owner', 'admin')(ownerReq, ownerRes, () => { ownerNext = true; });
  check(ownerNext, 'Owner is allowed on owner route');

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
