const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const restaurantRoutes = require('./routes/restaurantRoutes');
const mealRoutes = require('./routes/mealRoutes');
const errorHandler = require('./middleware/errorHandler');
const geminiRoutes = require('./routes/gemini.route');
const orderRoutes = require('./routes/ordersRoutes');

const app = express();

app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Food Ordering API is running'
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api', mealRoutes);
app.use('/api/ai', geminiRoutes);
app.use('/api/orders', orderRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

app.use(errorHandler);

module.exports = app;
