import express from "express";
import { addItemToCart, removeItemFromCart, viewCart, checkoutCart,uploadInvoice } from "../controllers/cartController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/add", protect, addItemToCart);
router.post("/remove", protect, removeItemFromCart);
router.get("/:groupId", protect, viewCart);
router.post('/checkout', protect, uploadInvoice, checkoutCart);

export default router;
