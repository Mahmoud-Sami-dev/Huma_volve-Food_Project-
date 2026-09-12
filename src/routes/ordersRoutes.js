const express = require('express');

const router = express.Router();

const {
  updateOrderStatus
} = require('../controllers/OrdersController');

const {
  protect,
  authorize
} = require('../middleware/auth');

// Update order status
router.patch(
  '/:id/status',
  protect,
  authorize('owner'),
  updateOrderStatus
);

module.exports = router;