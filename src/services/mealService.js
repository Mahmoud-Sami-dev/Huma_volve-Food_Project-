const Meal = require('../models/Meal');

exports.createMeal = async (data) => {
  return await Meal.create(data);
};

exports.getMealsByRestaurant = async (restaurantId) => {
  return await Meal.find({ restaurant: restaurantId });
};

exports.getMealById = async (id) => {
  return await Meal.findById(id);
};

exports.updateMeal = async (id, data) => {
  return await Meal.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

exports.deleteMeal = async (id) => {
  return await Meal.findByIdAndDelete(id);
};