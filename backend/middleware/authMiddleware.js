// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/userModel.js";

//  Hash password before saving a new or updated user
export const hashPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      req.body.password = await bcrypt.hash(password, salt);
    }
    next();
  } catch (err) {
    console.error("Password hashing failed:", err);
    res.status(500).json({ message: "Error hashing password" });
  }
};

//  Verify JWT for protected routes
export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
      if (!req.user) return res.status(401).json({ message: "User not found" });
      next();
    } catch (err) {
      console.error("JWT auth failed:", err.message);
      res.status(401).json({ message: "Not authorized, invalid token" });
    }
  } else {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

//  Compare passwords
export const matchPassword = async (entered, hashed) => {
  return await bcrypt.compare(entered, hashed);
};
