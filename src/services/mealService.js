const Meal = require('../models/Meal');

exports.createMeal = (data) => Meal.create(data);
exports.getMealsByRestaurant = (restaurantId) => Meal.find({ restaurant: restaurantId }).sort({ createdAt: -1 });
exports.getMealById = (id) => Meal.findById(id);
exports.updateMeal = (id, data) => Meal.findByIdAndUpdate(id, data, { new: true, runValidators: true });
exports.deleteMeal = (id) => Meal.findByIdAndDelete(id);
