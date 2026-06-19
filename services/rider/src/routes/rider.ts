import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import {
  acceptOrder,
  addRiderProfile,
  fetchMyCurrentOrder,
  fetchMyRiderProfile,
  toggleRiderAvailability,
  updateOrderStatus,
} from "../controllers/rider.js";
import uploadFile from "../middlewares/multer.js";

const router = express();

router.get("/myprofile", isAuth, fetchMyRiderProfile);
router.patch("/toggle", isAuth, toggleRiderAvailability);
router.post("/new", isAuth, uploadFile, addRiderProfile);
router.post("/accept/:orderId", isAuth, acceptOrder);
router.get("/order/current", isAuth, fetchMyCurrentOrder);
router.put("/order/update/:orderId", isAuth, updateOrderStatus);

export default router;
