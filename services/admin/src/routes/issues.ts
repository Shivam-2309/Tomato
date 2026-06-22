import express from "express";
import { createIssue, getIssue, getAllIssues } from "../controllers/admin.js";
import { isAuth, isAdmin } from "../middlewares/isAuth.js";

const router = express.Router();

router.post("/", isAuth, createIssue);
router.get("/:id", isAuth, getIssue);
router.get("/admin/all", isAuth, isAdmin, getAllIssues);

export default router;
