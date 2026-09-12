const mongoose = require('mongoose');

const Order = require('../models/Orders');
const Restaurant = require('../models/Restaurant');
const Meal = require('../models/Meal');

/*
=====================================================
CREATE ORDER
Customer creates a new order
POST /api/orders
=====================================================
*/
const createOrder = async (req, res, next) => {
  try {
    const { restaurant, items } = req.body;

    // Validate restaurant ID
    if (!mongoose.Types.ObjectId.isValid(restaurant)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid restaurant ID'
      });
    }

    // Check restaurant exists
    const restaurantExists = await Restaurant.findById(restaurant);

    if (!restaurantExists) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Check restaurant is open
    if (!restaurantExists.isOpen) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant is currently closed'
      });
    }

    // Validate items
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item'
      });
    }

    const orderItems = [];
    let totalPrice = 0;

    // Validate every meal
    for (const item of items) {
      if (!mongoose.Types.ObjectId.isValid(item.meal)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid meal ID'
        });
      }

      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        return res.status(400).json({
          success: false,
          message: 'Quantity must be at least 1'
        });
      }

      const meal = await Meal.findById(item.meal);

      if (!meal) {
        return res.status(404).json({
          success: false,
          message: `Meal ${item.meal} not found`
        });
      }

      // Make sure meal belongs to selected restaurant
      if (meal.restaurant.toString() !== restaurant.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Meal does not belong to this restaurant'
        });
      }

      // Make sure meal is available
      if (!meal.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `Meal "${meal.name}" is currently unavailable`
        });
      }

      const itemTotal = meal.price * item.quantity;

      totalPrice += itemTotal;

      orderItems.push({
        meal: meal._id,
        quantity: item.quantity,
        price: meal.price
      });
    }

    // Create order
    const order = await Order.create({
      customer: req.user._id,
      restaurant,
      items: orderItems,
      totalPrice,
      status: 'Pending'
    });

    const createdOrder = await Order.findById(order._id)
      .populate('customer', 'name email')
      .populate('restaurant', 'name address')
      .populate('items.meal', 'name price');

    return res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: createdOrder
    });

  } catch (error) {
    next(error);
  }
};


/*
=====================================================
GET CUSTOMER ORDERS
GET /api/orders/my-orders
=====================================================
*/
const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({
      customer: req.user._id
    })
      .populate('restaurant', 'name address')
      .populate('items.meal', 'name price')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });

  } catch (error) {
    next(error);
  }
};


/*
=====================================================
GET SPECIFIC CUSTOMER ORDER
GET /api/orders/:id
=====================================================
*/
const getMyOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID'
      });
    }

    const order = await Order.findById(id)
      .populate('restaurant', 'name address owner')
      .populate('items.meal', 'name price');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Customer can only view his own order
    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this order'
      });
    }

    return res.status(200).json({
      success: true,
      data: order
    });

  } catch (error) {
    next(error);
  }
};


/*
=====================================================
CUSTOMER CANCEL ORDER
POST /api/orders/:id/cancel
=====================================================
*/
const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID'
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Customer can cancel only his own order
    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel this order'
      });
    }

    // Only Pending and Confirmed orders can be cancelled
    const cancellableStatuses = [
      'Pending',
      'Confirmed'
    ];

    if (!cancellableStatuses.includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled when status is ${order.status}`
      });
    }

    order.status = 'Cancelled';

    await order.save();

    return res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });

  } catch (error) {
    next(error);
  }
};


/*
=====================================================
OWNER VIEW RESTAURANT ORDERS
GET /api/orders/restaurant
=====================================================
*/
const getRestaurantOrders = async (req, res, next) => {
  try {
    // Find restaurant owned by logged-in owner
    const restaurant = await Restaurant.findOne({
      owner: req.user._id
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found for this owner'
      });
    }

    const orders = await Order.find({
      restaurant: restaurant._id
    })
      .populate('customer', 'name email')
      .populate('items.meal', 'name price')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });

  } catch (error) {
    next(error);
  }
};


/*
=====================================================
UPDATE ORDER STATUS
PATCH /api/orders/:id/status
=====================================================
*/
const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID'
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const restaurant = await Restaurant.findById(order.restaurant);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Owner authorization
    if (restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update orders for this restaurant'
      });
    }

    const validStatuses = [
      'Pending',
      'Confirmed',
      'Preparing',
      'OutForDelivery',
      'Delivered',
      'Cancelled'
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status'
      });
    }

    /*
      Allowed transitions

      Pending -> Confirmed
      Confirmed -> Preparing
      Preparing -> OutForDelivery
      OutForDelivery -> Delivered

      Cancellation is handled separately
      through POST /:id/cancel
    */
    const allowedTransitions = {
      Pending: ['Confirmed'],
      Confirmed: ['Preparing'],
      Preparing: ['OutForDelivery'],
      OutForDelivery: ['Delivered'],
      Delivered: [],
      Cancelled: []
    };

    if (!allowedTransitions[order.status].includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          `Cannot change order status from ${order.status} to ${status}`
      });
    }

    order.status = status;

    await order.save();

    return res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });

  } catch (error) {
    next(error);
  }
};


module.exports = {
  createOrder,
  getMyOrders,
  getMyOrderById,
  cancelOrder,
  getRestaurantOrders,
  updateOrderStatus
};