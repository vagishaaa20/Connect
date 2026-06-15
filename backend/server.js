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
import paymentRoutes from "./routes/paymentRoutes.js";

import { initChat } from "./controllers/chatController.js";
import { initCronJobs } from "./jobs/cronJobs.js";

dotenv.config();

const app = express();
app.use(express.json({limit: '50mb' }));
app.use(express.urlencoded({limit: '50mb' , extended: true }));
app.use(cors());

// Attach io to every request so controllers can emit socket events
app.use((req, res, next) => { req.io = io; next(); });

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
app.use("/api/rides", rideRoutes);
app.use("/api/payments", paymentRoutes);
app.use('/uploads/invoices', express.static('uploads/invoices'));

app.get("/", (req, res) => res.send("Server running"));

// HTTP server + Socket.io
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Initialize chat and cron jobs
initChat(io);
initCronJobs(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
