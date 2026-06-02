import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  fetchMessages,
  deleteMessage,
  editMessage,
} from "../controllers/chatController.js";
import Group from "../models/groupModel.js";
import message from "../models/messageModel.js";
import jwt from 'jsonwebtoken';

const router = express.Router();

// Middleware to check if user is in the group
const checkGroupMembership = async (req, res, next) => {
  const userId = req.user._id;
  const groupId = req.params.groupId || req.body.groupId;

  try {
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const isMember =
      group.members.includes(userId) || group.admin.toString() === userId.toString();

    if (!isMember)
      return res
        .status(403)
        .json({ message: "You are not a member of this group" });

    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Fetch past messages
router.get("/:groupId", protect, checkGroupMembership, async (req, res) => {
  const { groupId } = req.params;
  try {
    const messages = await fetchMessages(groupId);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Delete a message
router.delete("/:messageId", protect, async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user._id;

  try {
    const msg = await deleteMessage(messageId, userId);
    res.json(msg);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Edit a message
router.put("/:messageId", protect, async (req, res) => {
  const { messageId } = req.params;
  const { text } = req.body;
  const userId = req.user._id;

  try {
    const msg = await editMessage(messageId, userId, text);
    res.json(msg);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
