const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Restaurant name is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Restaurant description is required'],
      trim: true
    },
    address: {
      type: String,
      required: [true, 'Restaurant address is required'],
      trim: true
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Restaurant owner is required']
    },
    isOpen: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Restaurant', restaurantSchema);
