const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  meal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meal',
    required: [true, 'Meal ID is required']
  },

  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be greater than zero']
  },

  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  }
});


const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer ID is required']
    },

    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: [true, 'Restaurant ID is required']
    },

    items: {
      type: [orderItemSchema],

      required: true,

      validate: {
        validator: function (items) {
          return items.length > 0;
        },

        message: 'Order must contain at least one item'
      }
    },

    totalPrice: {
      type: Number,
      required: [true, 'Total price is required'],
      min: [0, 'Total price cannot be negative']
    },

    status: {
      type: String,

      enum: [
        'Pending',
        'Confirmed',
        'Preparing',
        'OutForDelivery',
        'Delivered',
        'Cancelled'
      ],

      default: 'Pending'
    }
  },

  {
    timestamps: true
  }
);


module.exports = mongoose.model('Orders', orderSchema);