import express from "express";
import {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
} from "../controllers/userController.js";
import { protect, hashPassword } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", hashPassword, registerUser);
router.post("/login",    loginUser);
router.get("/profile",   protect, getProfile);
router.put("/profile",   protect, updateProfile);   // ← sets upiId

export default router;