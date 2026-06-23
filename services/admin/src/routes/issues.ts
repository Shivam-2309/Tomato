import express from "express";
import {
  createIssue,
  getIssue,
  getAllIssues,
  updateAIResult,
  approveIssue,
  rejectIssue,
} from "../controllers/admin.js";
import { isAuth, isAdmin } from "../middlewares/isAuth.js";
import uploadFile from "../middlewares/multer.js";

const router = express.Router();

router.post("/", isAuth, uploadFile, createIssue);
router.get("/:id", isAuth, getIssue);
router.get("/admin/all", isAuth, isAdmin, getAllIssues);
router.patch("/:issueId/ai-result", updateAIResult);

router.patch("/admin/:id/approve", isAuth, isAdmin, approveIssue);
router.patch("/admin/:id/reject", isAuth, isAdmin, rejectIssue);

export default router;
