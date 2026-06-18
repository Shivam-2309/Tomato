import express from "express";
import {
  assignRiderToOrder,
  createOrder,
  fetchOrderForPayment,
  fetchRestaurantOrders,
  fetchSingleOrder,
  getCurrentOrderForRider,
  getMyOrders,
  updateOrderStatus,
  updateOrderStatusRider,
} from "../controllers/order.js";
import { isAuth } from "../middlewares/isAuth.js";
import { isSeller } from "../middlewares/isAuth.js";

const router = express.Router();

router.get("/current/rider", getCurrentOrderForRider);
router.post("/new", isAuth, createOrder);
router.get("/payment/:id", fetchOrderForPayment);
router.get("/my", isAuth, getMyOrders);
router.get("/myOrder/:id", isAuth, fetchSingleOrder);
router.put("/assign/rider", assignRiderToOrder);
router.get("/:restaurantId", isAuth, isSeller, fetchRestaurantOrders);
router.put("/:orderId", isAuth, isSeller, updateOrderStatus);
router.put("/update/status/rider", updateOrderStatusRider);

export default router;
