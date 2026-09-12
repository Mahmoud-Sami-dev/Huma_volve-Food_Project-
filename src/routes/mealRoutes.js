const express = require('express');
const mealController = require('../controllers/mealController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/restaurants/:restaurantId/meals', protect, authorize('owner', 'admin'), mealController.createMeal);
router.get('/restaurants/:restaurantId/meals', mealController.getRestaurantMeals);
router.get('/meals/:id', mealController.getMealById);
router.patch('/meals/:id', protect, authorize('owner', 'admin'), mealController.updateMeal);
router.delete('/meals/:id', protect, authorize('owner', 'admin'), mealController.deleteMeal);

module.exports = router;
