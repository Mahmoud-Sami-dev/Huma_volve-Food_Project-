const express = require('express');
const restaurantController = require('../controllers/restaurantController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

router
  .route('/')
  .get(restaurantController.getRestaurants)
  .post(protect, restrictTo('owner', 'admin'), restaurantController.createRestaurant);

router
  .route('/:id')
  .get(restaurantController.getRestaurant)
  .patch(protect, restrictTo('owner', 'admin'), restaurantController.updateRestaurant)
  .delete(protect, restrictTo('owner', 'admin'), restaurantController.deleteRestaurant);

module.exports = router;
