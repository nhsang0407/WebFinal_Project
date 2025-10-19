import express from "express";
import {
  getProducts,
  getProduct,
  createNewProduct,
  updateExistingProduct,
  removeProduct,
} from "../controllers/productController.js";

const router = express.Router();


router.get("/", getProducts);
router.get("/:id", getProduct);
router.post("/", createNewProduct);
router.put("/:id", updateExistingProduct);
router.delete("/:id", removeProduct);

export default router;
