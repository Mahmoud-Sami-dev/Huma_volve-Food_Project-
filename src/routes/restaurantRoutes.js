const express = require('express');
const restaurantController = require('../controllers/restaurantController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router
  .route('/')
  .get(restaurantController.getRestaurants)
  .post(protect, authorize('owner', 'admin'), restaurantController.createRestaurant);

router
  .route('/:id')
  .get(restaurantController.getRestaurant)
  .patch(protect, authorize('owner', 'admin'), restaurantController.updateRestaurant)
  .delete(protect, authorize('owner', 'admin'), restaurantController.deleteRestaurant);

module.exports = router;
