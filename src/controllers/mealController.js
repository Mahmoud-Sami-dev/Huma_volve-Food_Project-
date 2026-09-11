const Meal = require('../models/Meal');
exports.createMeal = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { name, description, price, isAvailable } = req.body;

    if (!price || price <= 0) {
      return res.status(400).json({ message: 'Price must be greater than zero' });
    }

    const meal = await Meal.create({
      name,
      description,
      price,
      isAvailable,
      restaurant: restaurantId
    });

    res.status(201).json(meal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getRestaurantMeals = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const meals = await Meal.find({ restaurant: restaurantId });
    res.status(200).json(meals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getMealById = async (req, res) => {
  try {
    const meal = await Meal.findById(req.params.id);
    if (!meal) {
      return res.status(404).json({ message: 'Meal not found' });
    }
    res.status(200).json(meal);
  } catch (error) {
    res.status(500).json({ message: 'Invalid Meal ID or Server Error' });
  }
};
exports.updateMeal = async (req, res) => {
  try {
    const { price } = req.body;
    if (price !== undefined && price <= 0) {
      return res.status(400).json({ message: 'Price must be greater than zero' });
    }

    const meal = await Meal.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!meal) {
      return res.status(404).json({ message: 'Meal not found' });
    }

    res.status(200).json(meal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteMeal = async (req, res) => {
  try {
    const meal = await Meal.findByIdAndDelete(req.params.id);
    if (!meal) {
      return res.status(404).json({ message: 'Meal not found' });
    }
    res.status(200).json({ message: 'Meal deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};