import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByPrice
} from "../models/productModel.js";


import { getAllCategories, getProductsByCategory } from "../models/categoryModel.js";


export const listCategories = async (req, res) => {
  try {
    const categories = await getAllCategories();
    res.status(200).json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const getProductsDetail = async (req, res) => {
  try {
    const detailProducts = await getAllProducts();
    res.json(detailProducts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const getProducts = async (req, res) => {
  try {
    const search = req.query.search || "";
    const products = await getAllProducts(search);
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




/**
 * 🟡 Lọc sản phẩm theo category_id
 */
export const filterProductsByCategory = async (req, res) => {
  const { category_id } = req.params;


  try {
    const products = await getProductsByCategory(category_id);


    if (!products || products.length === 0) {
      return res.status(404).json({ message: "Không có sản phẩm nào trong danh mục này" });
    }


    res.status(200).json(products);
  } catch (error) {
    console.error("❌ Error filtering products by category:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const filterProductsByPrice = async (req, res) => {
  try {
    console.log(req.query);
    console.log('Nga Khungf');
    const { maxPrice } = req.query;


    // Nếu không có giá trị hợp lệ
    if (parseFloat(req.query.max_price) <= 0) {
      return res.status(400).json({ message: "Giá không hợp lệ" });
    }


    const products = await getProductsByPrice(maxPrice);
    res.json(products);
  } catch (error) {
    console.error("❌ Lỗi khi lọc sản phẩm theo giá:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};


// ===============================
// TÌM KIẾM SẢN PHẨM
// ===============================


/**
 * Tìm kiếm sản phẩm theo tên và có thể thêm các tham số khác như danh mục
 */
export const searchProducts = async (req, res) => {
  try {
    const { query, category_id } = req.query;


    // Kiểm tra nếu không có từ khóa tìm kiếm
    if (!query) {
      return res.status(400).json({ message: "Vui lòng nhập từ khóa tìm kiếm!" });
    }


    // Bắt đầu lấy tất cả sản phẩm
    let products = await getAllProducts();


    // Lọc sản phẩm theo category (nếu có)
    if (category_id) {
      products = products.filter(product => product.category_id === category_id);
    }


    // Lọc theo từ khóa tìm kiếm trong tên sản phẩm
    const filteredProducts = products.filter(product =>
      product.name.toLowerCase().includes(query.toLowerCase())
    );


    // Nếu không tìm thấy sản phẩm nào
    if (filteredProducts.length === 0) {
      return res.status(404).json({ message: "Không có sản phẩm nào phù hợp!" });
    }


    // Trả về kết quả tìm kiếm
    res.status(200).json(filteredProducts);


  } catch (error) {
    console.error("❌ Lỗi khi tìm kiếm sản phẩm:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};
