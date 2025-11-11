import express from "express";
import { listCategories,filterProductsByCategory } from "../controllers/productController.js";

const router = express.Router();

// GET /categories
router.get("/", listCategories);
router.get("/:category_id", filterProductsByCategory);


export default router;

