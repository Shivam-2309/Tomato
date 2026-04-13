import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import {
  addToCart,
  clearCart,
  decrementItem,
  fetchMyCart,
  incrementItem,
} from "../controllers/cart.js";

const router = express.Router();

router.post("/add", isAuth, addToCart);
router.get("/all", isAuth, fetchMyCart);
router.post("/inc", isAuth, incrementItem);
router.post("/dec", isAuth, decrementItem);
router.delete("/clear", isAuth, clearCart);

export default router;
