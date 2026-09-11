require('dotenv').config();
const http = require('http');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const app = require('../app');
const Restaurant = require('../models/Restaurant');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';
const TEST_DB =
  process.env.MONGO_URI_TEST ||
  'mongodb://127.0.0.1:27017/food_ordering_restaurants_test';

let passed = 0;
let failed = 0;
let server;
let baseUrl;
const ownerId = new mongoose.Types.ObjectId();
const otherOwnerId = new mongoose.Types.ObjectId();
const customerId = new mongoose.Types.ObjectId();

const ownerToken = jwt.sign({ id: ownerId, role: 'owner' }, JWT_SECRET, { expiresIn: '1h' });
const otherOwnerToken = jwt.sign({ id: otherOwnerId, role: 'owner' }, JWT_SECRET, {
  expiresIn: '1h',
});
const customerToken = jwt.sign({ id: customerId, role: 'customer' }, JWT_SECRET, {
  expiresIn: '1h',
});

const request = (method, path, { token, body } = {}) =>
  new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const payload = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (payload) headers['Content-Length'] = Buffer.byteLength(payload);

    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method,
        headers,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          let json = null;
          try {
            json = data ? JSON.parse(data) : null;
          } catch (error) {
            json = { raw: data };
          }
          resolve({ status: res.statusCode, body: json });
        });
      }
    );

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });

const assert = (condition, title) => {
  if (condition) {
    passed += 1;
    console.log(` PASS: ${title}`);
  } else {
    failed += 1;
    console.log(` FAIL: ${title}`);
  }
};

const start = async () => {
  console.log('--- Starting Restaurant Management Tests ---\n');

  await mongoose.connect(TEST_DB);
  await Restaurant.deleteMany({});

  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;

  try {
    console.log('Test 1: Create restaurant requires login');
    const noToken = await request('POST', '/api/restaurants', {
      body: { name: 'Cairo Kitchen', description: 'Home food', address: 'Cairo' },
    });
    assert(noToken.status === 401, 'Missing token caught with 401');

    console.log('\nTest 2: Customer cannot create a restaurant');
    const customerCreate = await request('POST', '/api/restaurants', {
      token: customerToken,
      body: { name: 'Cairo Kitchen', description: 'Home food', address: 'Cairo' },
    });
    assert(customerCreate.status === 403, 'Customer rejected with 403 Forbidden');

    console.log('\nTest 3: Owner can create a restaurant');
    const create = await request('POST', '/api/restaurants', {
      token: ownerToken,
      body: {
        name: 'Cairo Kitchen',
        description: 'Egyptian home cooking',
        address: 'Nasr City, Cairo',
        isOpen: true,
      },
    });
    assert(create.status === 201, 'Owner created restaurant with 201');
    assert(create.body?.data?.restaurant?.name === 'Cairo Kitchen', 'Saved restaurant name matches');
    assert(String(create.body?.data?.restaurant?.owner) === String(ownerId), 'Owner id is linked');
    const restaurantId = create.body?.data?.restaurant?._id;

    console.log('\nTest 4: Create restaurant rejects missing fields');
    const missing = await request('POST', '/api/restaurants', {
      token: ownerToken,
      body: { name: 'No Address' },
    });
    assert(missing.status === 400, 'Missing fields caught with 400');

    console.log('\nTest 5: List restaurants');
    const list = await request('GET', '/api/restaurants');
    assert(list.status === 200, 'List restaurants returns 200');
    assert(list.body?.results >= 1, 'At least one restaurant is listed');

    console.log('\nTest 6: Get a specific restaurant');
    const one = await request('GET', `/api/restaurants/${restaurantId}`);
    assert(one.status === 200, 'Get restaurant by id returns 200');
    assert(one.body?.data?.restaurant?._id === restaurantId, 'Returned restaurant id matches');

    console.log('\nTest 7: Invalid restaurant id');
    const badId = await request('GET', '/api/restaurants/not-a-real-id');
    assert(badId.status === 404, 'Invalid ID returns 404');

    const missingId = await request('GET', `/api/restaurants/${new mongoose.Types.ObjectId()}`);
    assert(missingId.status === 404, 'Unknown restaurant returns 404');

    console.log('\nTest 8: Owner can update their own restaurant');
    const updateOwn = await request('PATCH', `/api/restaurants/${restaurantId}`, {
      token: ownerToken,
      body: { isOpen: false, name: 'Cairo Kitchen Closed' },
    });
    assert(updateOwn.status === 200, 'Owner update returns 200');
    assert(updateOwn.body?.data?.restaurant?.isOpen === false, 'isOpen updated to false');
    assert(updateOwn.body?.data?.restaurant?.name === 'Cairo Kitchen Closed', 'Name updated');

    console.log('\nTest 9: Other owner cannot modify this restaurant');
    const updateOther = await request('PATCH', `/api/restaurants/${restaurantId}`, {
      token: otherOwnerToken,
      body: { name: 'Stolen Name' },
    });
    assert(updateOther.status === 403, 'Other owner rejected on update with 403');

    const deleteOther = await request('DELETE', `/api/restaurants/${restaurantId}`, {
      token: otherOwnerToken,
    });
    assert(deleteOther.status === 403, 'Other owner rejected on delete with 403');

    console.log('\nTest 10: Owner can delete their restaurant');
    const remove = await request('DELETE', `/api/restaurants/${restaurantId}`, {
      token: ownerToken,
    });
    assert(remove.status === 200, 'Owner delete returns 200');

    const afterDelete = await request('GET', `/api/restaurants/${restaurantId}`);
    assert(afterDelete.status === 404, 'Deleted restaurant is gone');
  } finally {
    await Restaurant.deleteMany({});
    await mongoose.disconnect();
    await new Promise((resolve) => server.close(resolve));
  }

  console.log('\n----------------------------------------');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
};

start().catch((error) => {
  console.error('Test run failed:', error.message);
  process.exit(1);
});
