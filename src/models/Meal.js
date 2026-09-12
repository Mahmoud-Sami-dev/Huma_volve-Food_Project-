const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Meal name is required'],
      trim: true,
      minlength: [2, 'Meal name must be at least 2 characters'],
      maxlength: [120, 'Meal name cannot exceed 120 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Meal description cannot exceed 1000 characters']
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0.01, 'Price must be greater than zero']
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: [true, 'Restaurant ID is required'],
      index: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Meal', mealSchema);
