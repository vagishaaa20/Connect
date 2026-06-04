import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { createPaymentOrder, verifyPayment, getPaymentStatus } from '../controllers/paymentController.js';

const router = express.Router();

router.post('/create-order', protect, createPaymentOrder);
router.post('/verify', protect, verifyPayment);
router.get('/status/:groupId', protect, getPaymentStatus);

export default router;