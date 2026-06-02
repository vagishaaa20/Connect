import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import { matchPassword } from "../middleware/authMiddleware.js";
import { geocodeAddressOSM } from "../utils/geocode.js";

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

// REGISTER
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, address, defaultUpi } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "Missing required fields" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "User already exists" });

    const user = new User({ name, email, password, phone, address, defaultUpi });

    // Optional: geocode address
    if (address) {
      const geo = await geocodeAddressOSM(address);
      if (geo)
        user.location = { type: "Point", coordinates: [geo.lng, geo.lat] };
    }

    const saved = await user.save();
    res.status(201).json({
      user: { ...saved.toObject(), password: undefined },
      token: generateToken(saved._id),
    });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// LOGIN
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user && (await matchPassword(password, user.password))) {
      res.json({
        user: { ...user.toObject(), password: undefined },
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
