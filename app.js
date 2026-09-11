const express = require('express');
const cors = require('cors');
const restaurantRoutes = require('./routes/restaurantRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Food Ordering API is running. Restaurant routes live at /api/restaurants',
  });
});

app.use('/api/restaurants', restaurantRoutes);

app.use((req, res) => {
  res.status(404).json({
    status: 'fail',
    message: `Route ${req.originalUrl} not found.`,
  });
});

app.use(errorHandler);

module.exports = app;
