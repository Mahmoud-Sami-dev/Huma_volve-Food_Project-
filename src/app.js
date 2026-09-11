const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const mealRoutes = require('./routes/mealRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Enable CORS
app.use(cors());

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Food Ordering API is running'
  });
});

// Mount module routes
app.use('/api/auth', authRoutes);
app.use('/api', mealRoutes);

// Catch-all 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handling middleware
app.use(errorHandler);

module.exports = app;
