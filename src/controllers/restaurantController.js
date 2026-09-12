const mongoose = require('mongoose');
const Restaurant = require('../models/Restaurant');

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const findRestaurant = async (id) => {
  if (!isValidId(id)) return null;
  return Restaurant.findById(id);
};

const canManage = (restaurant, user) =>
  user.role === 'admin' || String(restaurant.owner) === String(user._id);

exports.createRestaurant = asyncHandler(async (req, res) => {
  const { name, description, address, isOpen } = req.body || {};

  if (typeof name !== 'string' || !name.trim() ||
      typeof description !== 'string' || !description.trim() ||
      typeof address !== 'string' || !address.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Please provide name, description, and address.'
    });
  }

  if (isOpen !== undefined && typeof isOpen !== 'boolean') {
    return res.status(400).json({ success: false, message: 'isOpen must be a boolean.' });
  }

  const restaurant = await Restaurant.create({
    name: name.trim(),
    description: description.trim(),
    address: address.trim(),
    owner: req.user._id,
    isOpen: isOpen ?? true
  });

  return res.status(201).json({ success: true, data: { restaurant } });
});

exports.getRestaurants = asyncHandler(async (req, res) => {
  const restaurants = await Restaurant.find().sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    results: restaurants.length,
    data: { restaurants }
  });
});

exports.getRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await findRestaurant(req.params.id);

  if (!restaurant) {
    return res.status(404).json({ success: false, message: 'Restaurant not found.' });
  }

  return res.status(200).json({ success: true, data: { restaurant } });
});

exports.updateRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await findRestaurant(req.params.id);

  if (!restaurant) {
    return res.status(404).json({ success: false, message: 'Restaurant not found.' });
  }

  if (!canManage(restaurant, req.user)) {
    return res.status(403).json({
      success: false,
      message: 'You can only update a restaurant that you own.'
    });
  }

  const allowedFields = ['name', 'description', 'address', 'isOpen'];
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) restaurant[field] = req.body[field];
  }

  await restaurant.save();

  return res.status(200).json({ success: true, data: { restaurant } });
});

exports.deleteRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await findRestaurant(req.params.id);

  if (!restaurant) {
    return res.status(404).json({ success: false, message: 'Restaurant not found.' });
  }

  if (!canManage(restaurant, req.user)) {
    return res.status(403).json({
      success: false,
      message: 'You can only delete a restaurant that you own.'
    });
  }

  await restaurant.deleteOne();

  return res.status(200).json({
    success: true,
    message: 'Restaurant deleted successfully.',
    data: null
  });
});
