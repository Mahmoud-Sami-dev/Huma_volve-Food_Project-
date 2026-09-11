require('dotenv').config();
const jwt = require('jsonwebtoken');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';
let passed = 0;
let failed = 0;

const assert = (condition, title) => {
  if (condition) {
    passed += 1;
    console.log(` PASS: ${title}`);
  } else {
    failed += 1;
    console.log(` FAIL: ${title}`);
  }
};

const mockRes = () => {
  const res = {};
  res.statusCode = 200;
  res.body = null;
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (payload) => {
    res.body = payload;
    return res;
  };
  return res;
};

const runProtect = (req) => {
  const res = mockRes();
  let nextCalled = false;
  protect(req, res, () => {
    nextCalled = true;
  });
  return { res, nextCalled };
};

console.log('--- Starting Restaurant Auth Guard Tests (no database needed) ---\n');

console.log('Test 1: Missing token');
{
  const { res, nextCalled } = runProtect({ headers: {} });
  assert(res.statusCode === 401 && !nextCalled, 'Missing token caught with 401');
}

console.log('\nTest 2: Invalid token');
{
  const { res, nextCalled } = runProtect({
    headers: { authorization: 'Bearer not-a-real-token' },
  });
  assert(res.statusCode === 401 && !nextCalled, 'Invalid token caught with 401');
}

console.log('\nTest 3: Expired token');
{
  const expired = jwt.sign({ id: 'user1', role: 'owner' }, JWT_SECRET, { expiresIn: -1 });
  const { res, nextCalled } = runProtect({
    headers: { authorization: `Bearer ${expired}` },
  });
  assert(res.statusCode === 401 && !nextCalled, 'Expired token caught with 401');
}

console.log('\nTest 4: Valid owner token');
{
  const token = jwt.sign({ id: 'owner1', role: 'owner' }, JWT_SECRET, { expiresIn: '1h' });
  const req = { headers: { authorization: `Bearer ${token}` } };
  const { res, nextCalled } = runProtect(req);
  assert(nextCalled && res.statusCode === 200, 'Valid owner token is accepted');
  assert(req.user.role === 'owner' && req.user.id === 'owner1', 'req.user is set from token');
}

console.log('\nTest 5: Customer cannot use owner-only route');
{
  const req = { user: { id: 'c1', role: 'customer' } };
  const res = mockRes();
  let nextCalled = false;
  restrictTo('owner', 'admin')(req, res, () => {
    nextCalled = true;
  });
  assert(res.statusCode === 403 && !nextCalled, 'Customer rejected with 403 Forbidden on owner route');
}

console.log('\nTest 6: Owner is allowed on owner-only route');
{
  const req = { user: { id: 'o1', role: 'owner' } };
  const res = mockRes();
  let nextCalled = false;
  restrictTo('owner', 'admin')(req, res, () => {
    nextCalled = true;
  });
  assert(nextCalled, 'Owner successfully authorized');
}

console.log('\n----------------------------------------');
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
