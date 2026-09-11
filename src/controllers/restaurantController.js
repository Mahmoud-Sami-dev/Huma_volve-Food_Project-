const mongoose = require('mongoose');
const Restaurant = require('../models/Restaurant');

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const findRestaurantOrFail = async (id, res) => {
  if (!isValidId(id)) {
    res.status(404).json({
      success: false,
      message: 'Restaurant not found. Invalid restaurant ID.'
    });
    return null;
  }

  const restaurant = await Restaurant.findById(id);
  if (!restaurant) {
    res.status(404).json({
      success: false,
      message: 'Restaurant not found.'
    });
    return null;
  }

  return restaurant;
};

const isRestaurantOwner = (restaurant, user) => {
  return String(restaurant.owner) === String(user._id) || user.role === 'admin';
};

exports.createRestaurant = asyncHandler(async (req, res) => {
  const { name, description, address, isOpen } = req.body;

  if (!name || !description || !address) {
    return res.status(400).json({
      success: false,
      message: 'Please provide name, description, and address.'
    });
  }

  const restaurant = await Restaurant.create({
    name,
    description,
    address,
    owner: req.user._id,
    isOpen: typeof isOpen === 'boolean' ? isOpen : true
  });

  res.status(201).json({
    success: true,
    data: { restaurant }
  });
});

exports.getRestaurants = asyncHandler(async (req, res) => {
  const restaurants = await Restaurant.find();

  res.status(200).json({
    success: true,
    results: restaurants.length,
    data: { restaurants }
  });
});

exports.getRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await findRestaurantOrFail(req.params.id, res);
  if (!restaurant) return;

  res.status(200).json({
    success: true,
    data: { restaurant }
  });
});

exports.updateRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await findRestaurantOrFail(req.params.id, res);
  if (!restaurant) return;

  if (!isRestaurantOwner(restaurant, req.user)) {
    return res.status(403).json({
      success: false,
      message: 'You can only update a restaurant that you own.'
    });
  }

  const allowedFields = ['name', 'description', 'address', 'isOpen'];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      restaurant[field] = req.body[field];
    }
  });

  await restaurant.save();

  res.status(200).json({
    success: true,
    data: { restaurant }
  });
});

exports.deleteRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await findRestaurantOrFail(req.params.id, res);
  if (!restaurant) return;

  if (!isRestaurantOwner(restaurant, req.user)) {
    return res.status(403).json({
      success: false,
      message: 'You can only delete a restaurant that you own.'
    });
  }

  await restaurant.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Restaurant deleted successfully.',
    data: null
  });
});
