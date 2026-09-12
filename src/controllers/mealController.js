const mongoose = require('mongoose');
const mealService = require('../services/mealService');
const Restaurant = require('../models/Restaurant');

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const getRestaurantOr404 = async (restaurantId) => {
  if (!mongoose.Types.ObjectId.isValid(restaurantId)) return null;
  return Restaurant.findById(restaurantId);
};

const canManageRestaurant = (restaurant, user) =>
  user.role === 'admin' || String(restaurant.owner) === String(user._id);

exports.createMeal = asyncHandler(async (req, res) => {
  const { restaurantId } = req.params;
  const { name, description, price, isAvailable } = req.body || {};

  if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
    return res.status(400).json({ success: false, message: 'Invalid restaurant ID' });
  }

  const restaurant = await getRestaurantOr404(restaurantId);
  if (!restaurant) {
    return res.status(404).json({ success: false, message: 'Restaurant not found' });
  }

  if (!canManageRestaurant(restaurant, req.user)) {
    return res.status(403).json({ success: false, message: 'You are not authorized to manage this restaurant' });
  }

  if (typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Meal name is required' });
  }

  if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) {
    return res.status(400).json({ success: false, message: 'Price must be greater than zero' });
  }

  if (isAvailable !== undefined && typeof isAvailable !== 'boolean') {
    return res.status(400).json({ success: false, message: 'isAvailable must be a boolean' });
  }

  const meal = await mealService.createMeal({
    name: name.trim(),
    description: typeof description === 'string' ? description.trim() : description,
    price,
    isAvailable: isAvailable ?? true,
    restaurant: restaurant._id
  });

  return res.status(201).json({ success: true, data: meal });
});

exports.getRestaurantMeals = asyncHandler(async (req, res) => {
  const { restaurantId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
    return res.status(400).json({ success: false, message: 'Invalid restaurant ID' });
  }

  const restaurant = await getRestaurantOr404(restaurantId);
  if (!restaurant) {
    return res.status(404).json({ success: false, message: 'Restaurant not found' });
  }

  const meals = await mealService.getMealsByRestaurant(restaurantId);
  return res.status(200).json({ success: true, count: meals.length, data: meals });
});

exports.getMealById = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid meal ID' });
  }

  const meal = await mealService.getMealById(req.params.id);
  if (!meal) {
    return res.status(404).json({ success: false, message: 'Meal not found' });
  }

  return res.status(200).json({ success: true, data: meal });
});

exports.updateMeal = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid meal ID' });
  }

  const meal = await mealService.getMealById(req.params.id);
  if (!meal) {
    return res.status(404).json({ success: false, message: 'Meal not found' });
  }

  const restaurant = await Restaurant.findById(meal.restaurant);
  if (!restaurant) {
    return res.status(404).json({ success: false, message: 'Restaurant not found' });
  }

  if (!canManageRestaurant(restaurant, req.user)) {
    return res.status(403).json({ success: false, message: 'You are not authorized to manage this meal' });
  }

  const updates = {};
  for (const field of ['name', 'description', 'price', 'isAvailable']) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  if (updates.name !== undefined && (typeof updates.name !== 'string' || !updates.name.trim())) {
    return res.status(400).json({ success: false, message: 'Meal name cannot be empty' });
  }
  if (updates.price !== undefined && (typeof updates.price !== 'number' || !Number.isFinite(updates.price) || updates.price <= 0)) {
    return res.status(400).json({ success: false, message: 'Price must be greater than zero' });
  }
  if (updates.isAvailable !== undefined && typeof updates.isAvailable !== 'boolean') {
    return res.status(400).json({ success: false, message: 'isAvailable must be a boolean' });
  }
  if (updates.name !== undefined) updates.name = updates.name.trim();
  if (updates.description !== undefined && typeof updates.description === 'string') updates.description = updates.description.trim();

  const updatedMeal = await mealService.updateMeal(req.params.id, updates);
  return res.status(200).json({ success: true, data: updatedMeal });
});

exports.deleteMeal = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid meal ID' });
  }

  const meal = await mealService.getMealById(req.params.id);
  if (!meal) {
    return res.status(404).json({ success: false, message: 'Meal not found' });
  }

  const restaurant = await Restaurant.findById(meal.restaurant);
  if (!restaurant) {
    return res.status(404).json({ success: false, message: 'Restaurant not found' });
  }

  if (!canManageRestaurant(restaurant, req.user)) {
    return res.status(403).json({ success: false, message: 'You are not authorized to manage this meal' });
  }

  await mealService.deleteMeal(req.params.id);
  return res.status(200).json({ success: true, message: 'Meal deleted successfully' });
});
