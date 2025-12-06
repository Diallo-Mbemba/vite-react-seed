import express from 'express';
import { createPaymentIntent } from '../controllers/paymentController';

const router = express.Router();

/**
 * POST /api/create-payment-intent
 * Crée un PaymentIntent Stripe pour initier un paiement
 */
router.post('/create-payment-intent', createPaymentIntent);

export default router;

