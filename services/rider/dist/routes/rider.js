import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import { addRiderProfile, fetchMyRiderProfile, toggleRiderAvailability, } from "../controllers/rider.js";
import uploadFile from "../middlewares/multer.js";
const router = express();
router.get("/myprofile", isAuth, fetchMyRiderProfile);
router.patch("/toggle", isAuth, toggleRiderAvailability);
router.post("/new", isAuth, uploadFile, addRiderProfile);
export default router;
