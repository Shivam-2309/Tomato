import express from "express";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
} from "../controllers/payment.js";

const router = express.Router();

router.post("/create", createRazorpayOrder);
router.get("/verify", verifyRazorpayPayment);

export default router;
