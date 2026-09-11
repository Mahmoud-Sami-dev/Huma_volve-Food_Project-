# Team 3 — Food Ordering API

Backend RESTful API for the Food Ordering system built with **Node.js**, **Express.js**, and **MongoDB (Mongoose)**.

---

## Authentication & Authorization Module

**Assigned Engineer:** Mohamed Mostafa  
**Scope:** User Data Model, Password Hashing, User Registration, Login, Stateless Logout, Get Current User, JWT Token Generation/Verification, and Shared Authentication & Role Authorization Middlewares.

---

### Table of Contents
1. [Environment Variables](#environment-variables)
2. [Installation & Running](#installation--running)
3. [User Data Model](#user-data-model)
4. [API Endpoints Summary](#api-endpoints-summary)
5. [Endpoints Specification](#endpoints-specification)
   - [1. Register a User](#1-register-a-user)
   - [2. Login](#2-login)
   - [3. Get Current User](#3-get-current-user)
   - [4. Logout](#4-logout)
6. [Shared Middlewares (For Team Members)](#shared-middlewares-for-team-members)
   - [How to Protect Routes (`protect`)](#how-to-protect-routes-protect)
   - [How to Authorize Roles (`authorize`)](#how-to-authorize-roles-authorize)
7. [Edge Cases Handled](#edge-cases-handled)
8. [Postman Collection](#postman-collection)

---

### Environment Variables

Create a `.env` file in the root directory based on `.env.example`:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/food_ordering_db
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
```

| Variable | Description | Default |
|---|---|---|
| `PORT` | The port the Express server listens on | `5000` |
| `NODE_ENV` | Environment mode (`development`, `production`) | `development` |
| `MONGO_URI` | MongoDB connection URI | `mongodb://localhost:27017/food_ordering_db` |
| `JWT_SECRET` | Secret key used to sign and verify JSON Web Tokens | Required (Do not commit to Git) |
| `JWT_EXPIRE` | Expiration time for generated JWTs | `7d` |

---

### Installation & Running

```bash
# 1. Install dependencies
npm install

# 2. Start development server with nodemon
npm run dev

# 3. Start in production mode
npm start
```

---

### User Data Model

The User model is defined in `src/models/User.js`:

| Field | Type | Description | Rules / Constraints |
|---|---|---|---|
| `name` | String | User's full name | Required, trimmed, min 2 chars, max 100 chars |
| `email` | String | User's email | Required, unique, trimmed, lowercase, valid email format |
| `password` | String | Hashed password | Required, min 6 chars, `select: false` (never exposed) |
| `role` | String | Role assigned | Enum: `['admin', 'owner', 'customer']`, default: `'customer'` |
| `createdAt` | Date | Timestamp | Automatic |
| `updatedAt` | Date | Timestamp | Automatic |

* Passwords are automatically hashed with `bcryptjs` using a salt work factor of 10 prior to database insertion.
* Passwords are never returned in normal query or API responses.

---

### API Endpoints Summary

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register a new customer or owner |
| `POST` | `/api/auth/login` | Public | Authenticate user & receive JWT |
| `POST` | `/api/auth/logout` | Public | Log out / clear authentication session |
| `GET` | `/api/auth/me` | Private (Bearer JWT) | Retrieve currently authenticated user profile |

---

### Endpoints Specification

#### 1. Register a User
- **Method:** `POST`
- **Path:** `/api/auth/register`
- **Access:** Public
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "name": "John Customer",
    "email": "customer@example.com",
    "password": "password123",
    "role": "customer"
  }
  ```
  *(Note: `role` is optional and defaults to `"customer"`. Allowed public roles are `"customer"` and `"owner"`. Public registration as `"admin"` is rejected with `400 Bad Request`).*
- **Success Response (`201 Created`):**
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "token": "eyJhbGciOi...",
    "data": {
      "_id": "65df1234567890abcdef1234",
      "name": "John Customer",
      "email": "customer@example.com",
      "role": "customer",
      "createdAt": "2026-09-11T00:00:00.000Z"
    }
  }
  ```

#### 2. Login
- **Method:** `POST`
- **Path:** `/api/auth/login`
- **Access:** Public
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "email": "customer@example.com",
    "password": "password123"
  }
  ```
- **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Login successful",
    "token": "eyJhbGciOi...",
    "data": {
      "_id": "65df1234567890abcdef1234",
      "name": "John Customer",
      "email": "customer@example.com",
      "role": "customer"
    }
  }
  ```

#### 3. Get Current User
- **Method:** `GET`
- **Path:** `/api/auth/me`
- **Access:** Private (Protected)
- **Headers:**
  ```http
  Authorization: Bearer <your_jwt_token>
  ```
- **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "_id": "65df1234567890abcdef1234",
      "name": "John Customer",
      "email": "customer@example.com",
      "role": "customer",
      "createdAt": "2026-09-11T00:00:00.000Z",
      "updatedAt": "2026-09-11T00:00:00.000Z"
    }
  }
  ```

#### 4. Logout
- **Method:** `POST`
- **Path:** `/api/auth/logout`
- **Access:** Public
- **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

---

### Shared Middlewares (For Team Members)

All engineers working on **Restaurant Management**, **Meal Management**, and **Order Management** should import the shared authentication and authorization middlewares from `src/middleware/auth.js`.

```javascript
const { protect, authorize } = require('../middleware/auth');
```

#### How to Protect Routes (`protect`)
The `protect` middleware ensures:
1. An `Authorization: Bearer <token>` header is present.
2. The JWT is valid and unexpired.
3. The user exists in the database.
4. Attaches the authenticated user to `req.user` (`req.user._id`, `req.user.role`, `req.user.name`, `req.user.email`).

**Usage in your routes:**
```javascript
// Example: in orderRoutes.js or restaurantRoutes.js
router.get('/my', protect, getMyOrders);
```

#### How to Authorize Roles (`authorize`)
The `authorize(...roles)` middleware checks whether the authenticated user has one of the allowed roles. If not, it automatically responds with `403 Forbidden`.

**Usage in your routes:**
```javascript
// Only restaurant owners can create or manage restaurants:
router.post('/restaurants', protect, authorize('owner'), createRestaurant);

// Only owners and admins can update meals:
router.patch('/meals/:id', protect, authorize('owner', 'admin'), updateMeal);

// Only customers can place orders:
router.post('/orders', protect, authorize('customer'), createOrder);

// Admin-only route:
router.get('/admin/users', protect, authorize('admin'), getAllUsers);
```

---

### Edge Cases Handled

| Edge Case | Condition | HTTP Status | Response Message |
|---|---|---|---|
| Duplicate Email | Registering with an existing email | `400 Bad Request` | `"Email already registered"` |
| Missing Registration Fields | Missing name, email, or password | `400 Bad Request` | `"Please provide name, email, and password"` |
| Weak/Short Password | Password < 6 characters | `400 Bad Request` | `"Password must be at least 6 characters"` |
| Public Admin Registration | Attempting `role: "admin"` in public registration | `400 Bad Request` | `"Cannot register as admin. Admin accounts cannot be created publicly"` |
| Invalid Role Input | Role is not customer or owner | `400 Bad Request` | `"Invalid role. Allowed registration roles are: customer, owner"` |
| Missing Login Credentials | Missing email or password | `400 Bad Request` | `"Please provide email and password"` |
| User Not Found (Login) | Email does not exist | `401 Unauthorized` | `"Invalid credentials"` |
| Incorrect Password (Login) | Password hash does not match | `401 Unauthorized` | `"Invalid credentials"` |
| Missing JWT | No Authorization Bearer header provided | `401 Unauthorized` | `"Not authorized to access this route, no token provided"` |
| Invalid JWT | Tampered or malformed token string | `401 Unauthorized` | `"Invalid token, authorization denied"` |
| Expired JWT | Token has surpassed expiration | `401 Unauthorized` | `"Token has expired, please log in again"` |
| Token User Deleted | User associated with valid token was deleted | `401 Unauthorized` | `"The user belonging to this token no longer exists"` |
| Unauthorized Role | Authenticated user lacks required role | `403 Forbidden` | `"User role '<role>' is not authorized to access this route"` |

---

### Postman Collection

The Postman collection is located in:
`postman/Food_Ordering_Auth.postman_collection.json`

Import this file directly into Postman to test all 4 endpoints, all authentication failure states, and role-based authorization tests.
