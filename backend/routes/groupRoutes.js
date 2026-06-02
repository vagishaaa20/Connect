import express from "express";
import { createGroup, joinGroup, getNearbyGroups } from "../controllers/groupController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create", protect, createGroup);
router.post("/join", protect, joinGroup);
router.get("/nearby", protect, getNearbyGroups);

export default router;
