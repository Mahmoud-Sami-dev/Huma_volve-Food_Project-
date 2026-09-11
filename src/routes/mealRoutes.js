const express = require('express');
const router = express.Router();
const mealController = require('../controllers/mealController');
router.post('/restaurants/:restaurantId/meals', mealController.createMeal);
router.get('/restaurants/:restaurantId/meals', mealController.getRestaurantMeals);
router.get('/meals/:id', mealController.getMealById);
router.patch('/meals/:id', mealController.updateMeal);
router.delete('/meals/:id', mealController.deleteMeal);

module.exports = router;