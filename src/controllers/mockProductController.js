/**
 * Mock Product Controller
 * Xử lý logic sản phẩm sử dụng mock data
 */

import * as mockProductModel from '../models/mockProductModel.js';

// Get all products
export const getProducts = async (req, res) => {
  try {
    const { category_id, search, status } = req.query;
    
    const filters = {};
    if (category_id) filters.category_id = Number.parseInt(category_id);
    if (search) filters.search = search;
    if (status) filters.status = status;

    const products = await mockProductModel.getAllProducts(filters);
    
    res.json({
      success: true,
      message: 'Get products successfully',
      data: products,
      total: products.length
    });
  } catch (error) {
    console.error('[MOCK] Get products error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get product detail
export const getProductDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await mockProductModel.getProductById(Number.parseInt(id));

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({
      success: true,
      message: 'Get product successfully',
      data: product
    });
  } catch (error) {
    console.error('[MOCK] Get product detail error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Create product
export const createProduct = async (req, res) => {
  try {
    const { category_id, product_name, name, description, detail, price, stock, image_url, status, old_price, discount, is_promotion } = req.body;

    console.log('[MOCK] createProduct received body:', JSON.stringify(req.body, null, 2));

    // Accept both 'product_name' and 'name'
    const finalProductName = product_name || name;
    const parsedCategoryId = Number.parseInt(category_id);
    const parsedPrice = Number.parseFloat(price);

    console.log('[MOCK] Final product name:', finalProductName, 'Category ID:', parsedCategoryId, 'Price:', parsedPrice);

    // Better validation
    if (!finalProductName || !finalProductName.trim?.()) {
      return res.status(400).json({ success: false, message: 'Product name is required' });
    }

    if (Number.isNaN(parsedCategoryId) || parsedCategoryId <= 0) {
      return res.status(400).json({ success: false, message: 'Valid category is required' });
    }

    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({ success: false, message: 'Valid price is required' });
    }

    const newProduct = await mockProductModel.createProduct({
      category_id: parsedCategoryId,
      product_name: finalProductName,
      description: description || '',
      detail: detail || '',
      price: parsedPrice,
      stock: Number.parseInt(stock) || 0,
      image_url: image_url || 'NOIMAGE',
      status: status || 'active',
      old_price: old_price ? Number.parseFloat(old_price) : parsedPrice,
      discount: discount ? Number.parseInt(discount) : 0,
      is_promotion: is_promotion ? 1 : 0
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      id: newProduct.product_id,
      data: newProduct
    });
  } catch (error) {
    console.error('[MOCK] Create product error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

// Update product
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { category_id, product_name, name, description, detail, price, stock, image_url, status, old_price, discount, is_promotion } = req.body;

    // Accept both 'product_name' and 'name'
    const finalProductName = product_name || name;
    const parsedCategoryId = Number.parseInt(category_id);
    const parsedPrice = Number.parseFloat(price);

    // Better validation
    if (!finalProductName || !finalProductName.trim()) {
      return res.status(400).json({ success: false, message: 'Product name is required' });
    }

    if (Number.isNaN(parsedCategoryId) || parsedCategoryId <= 0) {
      return res.status(400).json({ success: false, message: 'Valid category is required' });
    }

    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({ success: false, message: 'Valid price is required' });
    }

    const updates = {
      category_id: parsedCategoryId,
      product_name: finalProductName,
      description: description || '',
      detail: detail || '',
      price: parsedPrice,
      stock: Number.parseInt(stock) || 0,
      image_url: image_url || 'NOIMAGE',
      status: status || 'active',
      old_price: old_price ? Number.parseFloat(old_price) : parsedPrice,
      discount: discount ? Number.parseInt(discount) : 0,
      is_promotion: is_promotion ? 1 : 0
    };

    const updated = await mockProductModel.updateProduct(Number.parseInt(id), updates);

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('[MOCK] Update product error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

// Delete product
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await mockProductModel.deleteProduct(Number.parseInt(id));

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('[MOCK] Delete product error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Filter products by price
export const filterProductsByPrice = async (req, res) => {
  try {
    const { max_price } = req.query;
    
    if (!max_price || parseFloat(max_price) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid max_price is required' });
    }

    const products = await mockProductModel.getAllProducts();
    const filtered = products.filter(p => p.price <= parseFloat(max_price));

    res.json({
      success: true,
      message: 'Products filtered by price successfully',
      data: filtered,
      total: filtered.length
    });
  } catch (error) {
    console.error('[MOCK] Filter products by price error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Search products
export const searchProducts = async (req, res) => {
  try {
    const { query, category_id } = req.query;

    if (!query) {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }

    const filters = { search: query };
    if (category_id) filters.category_id = Number.parseInt(category_id);

    const products = await mockProductModel.getAllProducts(filters);

    res.json({
      success: true,
      message: 'Products searched successfully',
      data: products,
      total: products.length
    });
  } catch (error) {
    console.error('[MOCK] Search products error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// List all categories
export const listCategories = async (req, res) => {
  try {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const filePath = path.join(__dirname, '..', '..', 'mock_data', 'categories.json');
    const data = fs.readFileSync(filePath, 'utf-8');
    const categories = JSON.parse(data);

    res.json({
      success: true,
      message: 'Get categories successfully',
      data: categories,
      total: categories.length
    });
  } catch (error) {
    console.error('[MOCK] List categories error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Filter products by category
export const filterProductsByCategory = async (req, res) => {
  try {
    const { category_id } = req.params;
    const products = await mockProductModel.getAllProducts({ category_id: Number.parseInt(category_id) });

    if (!products || products.length === 0) {
      return res.status(404).json({ success: false, message: 'Không có sản phẩm nào trong danh mục này' });
    }

    res.json({
      success: true,
      message: 'Get products by category successfully',
      data: products,
      total: products.length
    });
  } catch (error) {
    console.error('[MOCK] Filter products by category error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export default {
  getProducts,
  getProductDetail,
  createProduct,
  updateProduct,
  deleteProduct,
  filterProductsByPrice,
  searchProducts,
  listCategories,
  filterProductsByCategory
};
