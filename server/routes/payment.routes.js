import express from "express";
import { verifyJWTToken } from "../middlewares/auth.middleware.js";
import {
  getRazorpayKey,
  checkout,
  paymentVerification,
  getOrderHistory,
  getOrderDetails,
  cancelOrder,
} from "../controllers/payment.controller.js";

const router = express.Router();

// All payment routes require authentication
router.use(verifyJWTToken);

// Get Razorpay key
router.get("/razorpay-key", getRazorpayKey);

// Create order (checkout)
router.post("/checkout", checkout);

// Verify payment
router.post("/verify", paymentVerification);

// Order history
router.get("/orders", getOrderHistory);

// Order details
router.get("/orders/:orderId", getOrderDetails);

// Cancel order
router.post("/orders/:orderId/cancel", cancelOrder);

export default router;
