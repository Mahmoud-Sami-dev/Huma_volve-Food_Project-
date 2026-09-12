const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Restaurant name is required'],
      trim: true,
      minlength: [2, 'Restaurant name must be at least 2 characters'],
      maxlength: [120, 'Restaurant name cannot exceed 120 characters']
    },
    description: {
      type: String,
      required: [true, 'Restaurant description is required'],
      trim: true,
      minlength: [2, 'Restaurant description must be at least 2 characters'],
      maxlength: [1000, 'Restaurant description cannot exceed 1000 characters']
    },
    address: {
      type: String,
      required: [true, 'Restaurant address is required'],
      trim: true,
      minlength: [2, 'Restaurant address must be at least 2 characters'],
      maxlength: [300, 'Restaurant address cannot exceed 300 characters']
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Restaurant owner is required'],
      index: true
    },
    isOpen: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Restaurant', restaurantSchema);
