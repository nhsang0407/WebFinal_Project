import express from "express";
import {
  getProducts,
  getProduct,
  createNewProduct,
  updateExistingProduct,
  removeProduct,
  getProductsDetail,
  filterProductsByPrice,
  searchProducts
} from "../controllers/productController.js";


const router = express.Router();


router.get("/filter", filterProductsByPrice);
router.get("/detail", getProductsDetail);


router.get("/", getProducts);
router.get("/:id", getProduct);
router.post("/", createNewProduct);
router.put("/:id", updateExistingProduct);
router.delete("/:id", removeProduct);
// Route tìm kiếm sản phẩm
router.get("/search", searchProducts);


export default router;