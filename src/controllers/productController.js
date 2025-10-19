import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../models/productModel.js";

export const getProducts = async (req, res) => {
  try {
    const products = await getAllProducts();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getProduct = async (req, res) => {
  try {
    const product = await getProductById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createNewProduct = async (req, res) => {
  try {
    const id = await createProduct(req.body);
    res.status(201).json({ message: "Product created", id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateExistingProduct = async (req, res) => {
  try {
    const result = await updateProduct(req.params.id, req.body);
    if (result === 0) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product updated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const removeProduct = async (req, res) => {
  try {
    const result = await deleteProduct(req.params.id);
    if (result === 0) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
