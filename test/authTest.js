/**
 * Comprehensive Automated Test Suite for Authentication & Authorization Module
 */
const assert = require('assert');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key_1234567890';
process.env.JWT_EXPIRE = '1h';

const generateToken = require('../src/utils/generateToken');
const { protect, authorize } = require('../src/middleware/auth');
const User = require('../src/models/User');

async function runTests() {
  console.log('--- Starting Authentication & Authorization Tests ---\n');

  // Test 1: JWT generation & verification
  console.log('Test 1: JWT Token Generation & Verification');
  const testUserId = '65df00000000000000000001';
  const testRole = 'customer';
  const token = generateToken(testUserId, testRole);
  assert(typeof token === 'string', 'Token must be a string');
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  assert.strictEqual(decoded.id, testUserId, 'Decoded ID should match');
  assert.strictEqual(decoded.role, testRole, 'Decoded role should match');
  console.log('✔ PASS: JWT generation and decoding\n');

  // Test 2: Role Authorization Middleware
  console.log('Test 2: Role Authorization Middleware');
  const ownerAuth = authorize('owner', 'admin');
  let allowed = false;
  const mockReqCustomer = { user: { role: 'customer' } };
  const mockRes = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };

  // Customer should be rejected from owner route (403)
  ownerAuth(mockReqCustomer, mockRes, () => {
    allowed = true;
  });
  assert.strictEqual(allowed, false, 'Customer should NOT be allowed');
  assert.strictEqual(mockRes.statusCode, 403, 'Should return 403 Forbidden');
  assert.strictEqual(mockRes.body.success, false, 'Success should be false');
  console.log('✔ PASS: Customer rejected with 403 Forbidden on owner route');

  // Owner should be allowed
  let ownerAllowed = false;
  const mockReqOwner = { user: { role: 'owner' } };
  ownerAuth(mockReqOwner, mockRes, () => {
    ownerAllowed = true;
  });
  assert.strictEqual(ownerAllowed, true, 'Owner should be allowed');
  console.log('✔ PASS: Owner successfully authorized\n');

  // Test 3: Protect Middleware - Missing Token
  console.log('Test 3: Protect Middleware - Missing Token');
  const mockReqNoToken = { headers: {} };
  const mockResNoToken = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
  let nextCalledNoToken = false;
  await protect(mockReqNoToken, mockResNoToken, () => { nextCalledNoToken = true; });
  assert.strictEqual(nextCalledNoToken, false, 'Next should not be called');
  assert.strictEqual(mockResNoToken.statusCode, 401, 'Should return 401');
  assert(mockResNoToken.body.message.includes('no token provided'), 'Message should indicate missing token');
  console.log('✔ PASS: Missing token caught with 401\n');

  // Test 4: Protect Middleware - Invalid Token
  console.log('Test 4: Protect Middleware - Invalid Token');
  const mockReqInvalidToken = { headers: { authorization: 'Bearer thisisaninvalidtoken' } };
  const mockResInvalidToken = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
  let nextCalledInvalid = false;
  await protect(mockReqInvalidToken, mockResInvalidToken, () => { nextCalledInvalid = true; });
  assert.strictEqual(nextCalledInvalid, false, 'Next should not be called');
  assert.strictEqual(mockResInvalidToken.statusCode, 401, 'Should return 401');
  assert(mockResInvalidToken.body.message.includes('Invalid token'), 'Message should indicate invalid token');
  console.log('✔ PASS: Invalid token caught with 401\n');

  // Test 5: Protect Middleware - Expired Token
  console.log('Test 5: Protect Middleware - Expired Token');
  const expiredToken = jwt.sign({ id: testUserId, role: 'customer' }, process.env.JWT_SECRET, { expiresIn: '0s' });
  // Small delay to ensure expiration
  await new Promise((r) => setTimeout(r, 100));
  const mockReqExpiredToken = { headers: { authorization: `Bearer ${expiredToken}` } };
  const mockResExpiredToken = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
  let nextCalledExpired = false;
  await protect(mockReqExpiredToken, mockResExpiredToken, () => { nextCalledExpired = true; });
  assert.strictEqual(nextCalledExpired, false, 'Next should not be called');
  assert.strictEqual(mockResExpiredToken.statusCode, 401, 'Should return 401');
  assert(mockResExpiredToken.body.message.includes('expired'), 'Message should indicate expired token');
  console.log('✔ PASS: Expired token caught with 401\n');

  // Test 6: Registration & Login Controller logic unit tests
  console.log('Test 6: Controller Unit Validation');
  const { register, login, logout, getMe } = require('../src/controllers/authController');

  // 6a: Register missing fields
  const mockResRegisterMissing = {
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
  await register({ body: { name: 'Test' } }, mockResRegisterMissing, () => {});
  assert.strictEqual(mockResRegisterMissing.statusCode, 400, 'Should return 400 for missing fields');
  console.log('✔ PASS: Register missing fields returns 400');

  // 6b: Register admin attempt
  const mockResAdmin = {
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
  await register({ body: { name: 'Admin Attempt', email: 'admin@test.com', password: 'password123', role: 'admin' } }, mockResAdmin, () => {});
  assert.strictEqual(mockResAdmin.statusCode, 400, 'Should return 400 for admin registration');
  assert(mockResAdmin.body.message.includes('Cannot register as admin'), 'Should prevent admin registration');
  console.log('✔ PASS: Register admin role blocked with 400');

  // 6c: Register invalid role
  const mockResInvalidRole = {
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
  await register({ body: { name: 'Invalid', email: 'invalid@test.com', password: 'password123', role: 'superadmin' } }, mockResInvalidRole, () => {});
  assert.strictEqual(mockResInvalidRole.statusCode, 400, 'Should return 400 for invalid role');
  console.log('✔ PASS: Register invalid role returns 400');

  // 6d: Register short password
  const mockResShortPass = {
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
  await register({ body: { name: 'Short', email: 'short@test.com', password: '123' } }, mockResShortPass, () => {});
  assert.strictEqual(mockResShortPass.statusCode, 400, 'Should return 400 for short password');
  console.log('✔ PASS: Register short password returns 400');

  // 6e: Login missing fields
  const mockResLoginMissing = {
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
  await login({ body: { email: 'test@test.com' } }, mockResLoginMissing, () => {});
  assert.strictEqual(mockResLoginMissing.statusCode, 400, 'Should return 400 for missing login password');
  console.log('✔ PASS: Login missing password returns 400');

  // 6f: Logout endpoint
  const mockResLogout = {
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
  await logout({}, mockResLogout);
  assert.strictEqual(mockResLogout.statusCode, 200, 'Should return 200 for logout');
  assert.strictEqual(mockResLogout.body.success, true, 'Should return success true');
  console.log('✔ PASS: Logout returns 200 OK');

  // 6g: GetMe endpoint
  const mockResMe = {
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
  await getMe({ user: { _id: testUserId, name: 'John', email: 'john@example.com', role: 'customer' } }, mockResMe, () => {});
  assert.strictEqual(mockResMe.statusCode, 200, 'Should return 200 for getMe');
  assert.strictEqual(mockResMe.body.data.email, 'john@example.com', 'Should return user profile');
  assert.strictEqual(mockResMe.body.data.password, undefined, 'Password should never be returned');
  console.log('✔ PASS: GetMe returns safe user profile without password\n');

  console.log('=============================================');
  console.log('ALL AUTHENTICATION & AUTHORIZATION TESTS PASSED');
  console.log('=============================================');
}

runTests().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
