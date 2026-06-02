import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import { Server } from "socket.io";
import http from "http";

import userRoutes from "./routes/userRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";
import rideRoutes from "./routes/rideRoutes.js";

import { initChat } from "./controllers/chatController.js"; // correct import

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err.message));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes); 
app.use("/api/cart", cartRoutes);
app.use("/api/groups", groupRoutes);
app.use('/uploads/invoices', express.static('uploads/invoices'));
app.use('/api/rides', rideRoutes);
// Test route
app.get("/", (req, res) => res.send("Server running"));

// HTTP server for Socket.io
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Initialize chat with Socket.io
initChat(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
