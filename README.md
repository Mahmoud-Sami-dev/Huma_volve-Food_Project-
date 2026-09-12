Team 3 — Food Ordering API
Backend RESTful API for a Food Ordering system using Node.js, Express.js, MongoDB/Mongoose, JWT authentication and optional Gemini AI meal summaries.

1. Project structure
src/
├── config/
├── controllers/
├── middleware/
├── models/
├── routes/
├── services/
├── utils/
├── app.js
└── server.js
src/server.js is the real application entry point. The root server.js is only a backward-compatible wrapper.

2. Setup
Requirements:

Node.js 18+
MongoDB Atlas or local MongoDB
Install packages:

npm install
Create .env in the project root from .env.example:

PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/food_ordering_db
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRE=7d
GEMINI_API=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.5-flash
Do not commit .env or real API keys to GitHub.

3. Run
Development:

npm run dev
Production-style:

npm start
Health check:

GET http://localhost:5000/health
4. Authentication
Register
POST /api/auth/register

{
  "name": "John Customer",
  "email": "customer@example.com",
  "password": "password123",
  "role": "customer"
}
Public registration supports customer and owner. admin registration is intentionally blocked.

Login
POST /api/auth/login

Current user
GET /api/auth/me

Header:

Authorization: Bearer <JWT>
Logout
POST /api/auth/logout

Logout is stateless because JWTs are used. The client should discard its token.

5. Restaurants
Method	Endpoint	Access
POST	/api/restaurants	owner/admin
GET	/api/restaurants	public
GET	/api/restaurants/:id	public
PATCH	/api/restaurants/:id	owner of restaurant/admin
DELETE	/api/restaurants/:id	owner of restaurant/admin
6. Meals
Method	Endpoint	Access
POST	/api/restaurants/:restaurantId/meals	owner of restaurant/admin
GET	/api/restaurants/:restaurantId/meals	public
GET	/api/meals/:id	public
PATCH	/api/meals/:id	owner of restaurant/admin
DELETE	/api/meals/:id	owner of restaurant/admin
Meal create/update/delete now verify the restaurant ownership instead of trusting only the role.

7. Orders
Method	Endpoint	Access
POST	/api/orders	customer
GET	/api/orders/my-orders	customer
GET	/api/orders/:id	owner customer only
POST	/api/orders/:id/cancel	owner customer only
GET	/api/orders/restaurant	owner
PATCH	/api/orders/:id/status	owner of restaurant
Order creation verifies that the restaurant exists and is open, every meal belongs to that restaurant, every meal is available, and every quantity is valid. The item price is stored as a snapshot in the order.

8. AI meal summary
POST /api/ai/summarize-meal

{
  "mealName": "Grilled Chicken",
  "mealDescription": "Grilled chicken served with rice and vegetables."
}
The Gemini model can be changed through GEMINI_MODEL. The default is gemini-3.5-flash.

9. Tests
Authentication unit tests:

npm run test:auth
Restaurant integration tests (requires MongoDB):

npm run test:restaurants
Middleware tests:

npm run test:middleware
Vitest AI tests:

npm test

10. Postman
Import these collections:

postman/Food_Ordering_Auth.postman_collection.json
postman/Restaurants.postman_collection.json
postman/Food_Ordering_Meals.postman_collection.json
Recommended order:

Authentication: register customer and owner, then login if needed.
Restaurants: put the owner/customer/second-owner JWTs in the collection variables.
Meals: put ownerToken and the real restaurantId in the collection variables. The Create Meal request saves the new mealId automatically.
Orders: use the real restaurant and meal IDs created during testing.
11. Important fixes in this version
Removed the duplicated/conflicting root server implementation by turning root app.js/server.js into wrappers.
Added startup validation for MONGODB_URI and JWT_SECRET.
Added /health endpoint and safer request body limits.
Hardened authentication input validation.
Protected meal create/update/delete routes with JWT + role authorization.
Added restaurant ownership checks to meal management.
Improved MongoDB error handling and graceful server shutdown.
Added stronger Mongoose validation and useful indexes.
Fixed owner order listing so owners can see orders from all of their restaurants.
Fixed Gemini controller error handling and made the model configurable.
Removed real credentials from .env.example.
Fixed the stale restaurant middleware test so it matches the current src/middleware/auth.js implementation.
Updated Postman meal/restaurant requests to use collection variables and authorization headers.
