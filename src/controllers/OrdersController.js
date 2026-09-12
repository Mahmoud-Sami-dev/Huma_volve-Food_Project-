
const Order = require('../models/Orders');
const Restaurant = require('../models/Restaurant');

/**
 * @desc    Update order status
 * @route   PATCH /api/orders/:id/status
 * @access  Private - Restaurant Owner
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // 1. Find the order
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // 2. Find the restaurant
    const restaurant = await Restaurant.findById(order.restaurant);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // 3. Check that the logged-in user owns the restaurant
    if (restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update orders for this restaurant'
      });
    }

    // 4. Validate status
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

    // 5. Define allowed status transitions
    // Cancellation is handled by the separate cancel endpoint.
    const allowedTransitions = {
      Pending: ['Confirmed'],
      Confirmed: ['Preparing'],
      Preparing: ['OutForDelivery'],
      OutForDelivery: ['Delivered'],
      Delivered: [],
      Cancelled: []
    };

    // 6. Check if the status transition is allowed
    if (!allowedTransitions[order.status].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change order status from ${order.status} to ${status}`
      });
    }

    // 7. Update order status
    order.status = status;

    // 8. Save the updated order
    await order.save();

    // 9. Return the updated order
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
  updateOrderStatus
};
