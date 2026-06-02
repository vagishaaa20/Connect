import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  createRide,
  getNearbyRides,
  joinRide,
  completeRide
} from '../controllers/rideController.js';

const router = express.Router();

router.post('/create', protect, createRide);
router.get('/nearby', protect, getNearbyRides);
router.post('/join', protect, joinRide);
router.post('/complete', protect, completeRide);

export default router;