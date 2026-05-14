import express from "express";
import { createOrder, fetchOrderForPayment } from "../controllers/order.js";
import { isAuth } from "../middlewares/isAuth.js";
const router = express.Router();
router.post("/new", isAuth, createOrder);
router.get("/payment/:id", fetchOrderForPayment);
export default router;
