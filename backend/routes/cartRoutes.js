import express from "express";
import { addItemToCart, removeItemFromCart, viewCart, checkoutCart,uploadInvoice, parseInvoiceAI ,quickCheckout} from "../controllers/cartController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();


router.post('/parse-invoice-ai', protect, parseInvoiceAI);
router.post("/add", protect, addItemToCart);
router.post("/remove", protect, removeItemFromCart);
router.get("/:groupId", protect, viewCart);
router.post('/checkout', protect, uploadInvoice, checkoutCart);
router.post('/quick-checkout', protect, quickCheckout);

export default router;
