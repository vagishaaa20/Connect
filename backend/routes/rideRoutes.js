import express from 'express'; 
import {   createRide,   getNearbyRides,   joinRide,   completeRide,   createRidePaymentOrder,   verifyRidePayment,   getRidePaymentStatus, getRideById, getRide } 
from '../controllers/rideController.js'; import { protect } 
from '../middleware/authMiddleware.js';  

const router = express.Router();  

  router.use(protect); 
  router.post('/create',                createRide); 
  router.get('/nearby',                 getNearbyRides);
  router.post('/join',                  joinRide);
  router.post('/complete',              completeRide); 
  router.post('/payment/create-order',  createRidePaymentOrder); 
  router.post('/payment/verify',        verifyRidePayment);
  router.get('/payment/status/:rideId', getRidePaymentStatus); 
// must be last — generic /:id will catch everything above it if placed first
router.get('/:id', protect, getRideById);
router.get('/:rideId', getRide);  
    export default router; 
