import express from "express";
import {
  registerUser,
  loginUser

} from "../controllers/userController.js";
import { protect, hashPassword } from "../middleware/authMiddleware.js";

const router = express.Router();

// @route   POST /api/users/register
// @desc    Register new user
// @access  Public
router.post("/register", hashPassword, registerUser);

// @route   POST /api/users/login
// @desc    Login user
// @access  Public
router.post("/login", loginUser);



export default router;