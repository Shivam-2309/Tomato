import express from "express";
import { getPendingRestaurants, getPendingRiders, verifyRestaurant, verifyRider, } from "../controllers/admin.js";
import { isAuth, isAdmin } from "../middlewares/isAuth.js";
const router = express.Router();
router.get("/admin/restaurant/pending", isAuth, isAdmin, getPendingRestaurants);
router.get("/admin/rider/pending", isAuth, isAdmin, getPendingRiders);
router.get("/verify/rider/:id", isAuth, isAdmin, verifyRider);
router.get("/verify/restaurant/:id", isAuth, isAdmin, verifyRestaurant);
export default router;
