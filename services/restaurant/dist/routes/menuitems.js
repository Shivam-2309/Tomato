import express from 'express';
import { addMenuItem, deleteMenuItem, toggleMenuItemAvailability } from '../controllers/menuitem.js';
import { isAuth, isSeller } from '../middlewares/isAuth.js';
const router = express.Router();
// 7:00:07
router.post("/new", isAuth, isSeller, addMenuItem);
router.post("/all:id", isAuth, addMenuItem);
router.delete("/:id", isAuth, isSeller, deleteMenuItem);
router.delete("/status/:id", isAuth, isSeller, toggleMenuItemAvailability);
export default router;
