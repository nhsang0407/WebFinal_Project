import express from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart
} from "../controllers/cartController.js";

const router = express.Router();

router.get("/", getCart);
router.post("/add", addToCart);
router.put("/:cart_item_id", updateCartItem);
router.delete("/:cart_item_id", removeCartItem);
router.delete("/", clearCart);


export default router;
