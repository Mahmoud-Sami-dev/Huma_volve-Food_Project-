const express = require('express');

const router = express.Router();

const {
  createOrder,
  getMyOrders,
  getMyOrderById,
  cancelOrder,
  getRestaurantOrders,
  updateOrderStatus
} = require('../controllers/OrdersController');

const {
  protect,
  authorize
} = require('../middleware/auth');


/*
=====================================================
CUSTOMER ROUTES
=====================================================
*/

// Create order
router.post(
  '/',
  protect,
  authorize('customer'),
  createOrder
);


// View customer's orders
router.get(
  '/my-orders',
  protect,
  authorize('customer'),
  getMyOrders
);


// View specific customer's order
router.get(
  '/:id',
  protect,
  authorize('customer'),
  getMyOrderById
);


// Cancel order
router.post(
  '/:id/cancel',
  protect,
  authorize('customer'),
  cancelOrder
);


/*
=====================================================
RESTAURANT OWNER ROUTES
=====================================================
*/

// View orders for owner's restaurant
router.get(
  '/restaurant',
  protect,
  authorize('owner'),
  getRestaurantOrders
);


// Update order status
router.patch(
  '/:id/status',
  protect,
  authorize('owner'),
  updateOrderStatus
);


module.exports = router;