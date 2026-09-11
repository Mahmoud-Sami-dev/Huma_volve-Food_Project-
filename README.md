# Huma_volve-Food_Project-
Food Ordering API

## Restaurant Management (Mostafa Barakat)

This module lets restaurant owners create, read, update, and delete their restaurants. Each restaurant is linked to the logged-in owner. The Orders module can later check `isOpen` and refuse orders when a restaurant is closed.

### Endpoints

| Method | Endpoint | Who can use it | Description |
| ------ | -------- | -------------- | ----------- |
| POST | `/api/restaurants` | Owner (or admin) | Create a restaurant |
| GET | `/api/restaurants` | Anyone | List restaurants |
| GET | `/api/restaurants/:id` | Anyone | Get one restaurant |
| PATCH | `/api/restaurants/:id` | Owner of that restaurant | Update a restaurant |
| DELETE | `/api/restaurants/:id` | Owner of that restaurant | Delete a restaurant |

### Restaurant data

- `name` (text, required)
- `description` (text, required)
- `address` (text, required)
- `owner` (the User id from the login token)
- `isOpen` (true/false, default `true`)

### Errors this module handles

- Missing token on create/update/delete → `401`
- Customer trying to create/update/delete → `403`
- Owner trying to change a restaurant that is not theirs → `403`
- Invalid id or restaurant not found → `404`
- Missing name, description, or address → `400`

### How to run (this module only)

1. Install [Node.js](https://nodejs.org/) and [MongoDB](https://www.mongodb.com/try/download/community).
2. Copy `.env.example` to `.env` if needed. Keep `JWT_SECRET` the same value the auth teammate uses when you later connect login.
3. Install packages and start the API:

```bash
npm install
npm start
```

4. MongoDB must be running on `mongodb://127.0.0.1:27017`. If you use Docker:

```bash
docker run -d --name food-mongo -p 27017:27017 mongo:7
```

5. Run tests:

```bash
node test/restaurantMiddlewareTest.js
node test/restaurantTest.js
```

The first file checks login/permission guards and does not need MongoDB. The second file checks full create/read/update/delete and needs MongoDB.

5. Import `postman/Restaurants.postman_collection.json` into Postman. Paste a real owner JWT into `ownerToken` after login exists, or generate a test token (see below).

### Generate a test owner token

Until the auth module is merged, you can create a token in Node:

```js
const jwt = require('jsonwebtoken');
console.log(jwt.sign({ id: 'PUT_A_MONGO_OBJECT_ID', role: 'owner' }, process.env.JWT_SECRET, { expiresIn: '1d' }));
```

Then send it as: `Authorization: Bearer <token>`

