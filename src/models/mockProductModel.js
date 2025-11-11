/**
 * Mock Product Model
 * Sử dụng dữ liệu từ mock_data/products.json
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MOCK_DATA_DIR = path.join(__dirname, '..', '..', 'mock_data');

let productsCache = null;
let categoriesCache = null;

function loadProducts() {
  if (productsCache) return productsCache;
  try {
    const filePath = path.join(MOCK_DATA_DIR, 'products.json');
    const data = fs.readFileSync(filePath, 'utf-8');
    productsCache = JSON.parse(data);
    return productsCache;
  } catch (error) {
    console.error('[MOCK] Error loading products:', error.message);
    return [];
  }
}

function loadCategories() {
  if (categoriesCache) return categoriesCache;
  try {
    const filePath = path.join(MOCK_DATA_DIR, 'categories.json');
    const data = fs.readFileSync(filePath, 'utf-8');
    categoriesCache = JSON.parse(data);
    return categoriesCache;
  } catch (error) {
    console.error('[MOCK] Error loading categories:', error.message);
    return [];
  }
}

function saveProducts(products) {
  try {
    const filePath = path.join(MOCK_DATA_DIR, 'products.json');
    fs.writeFileSync(filePath, JSON.stringify(products, null, 2), 'utf-8');
    productsCache = products;
    return true;
  } catch (error) {
    console.error('[MOCK] Error saving products:', error.message);
    return false;
  }
}

// Get all products
export const getAllProducts = async (filters = {}) => {
  let products = loadProducts();
  
  // Apply filters
  if (filters.category_id) {
    products = products.filter(p => p.category_id === filters.category_id);
  }
  if (filters.search) {
    products = products.filter(p => 
      p.product_name.toLowerCase().includes(filters.search.toLowerCase())
    );
  }
  if (filters.status) {
    products = products.filter(p => p.status === filters.status);
  }
  
  return products;
};

// Get product by ID
export const getProductById = async (productId) => {
  const products = loadProducts();
  return products.find(p => p.product_id === productId) || null;
};

// Create product
export const createProduct = async (productData) => {
  const products = loadProducts();
  
  const maxId = products.length > 0 ? Math.max(...products.map(p => p.product_id)) : 0;
  const newId = maxId + 1;
  
  const newProduct = {
    product_id: newId,
    category_id: productData.category_id,
    supplier_id: productData.supplier_id || 1,
    admin_id: productData.admin_id || 1,
    product_name: productData.product_name,
    description: productData.description || '',
    detail: productData.detail || '',
    price: Number.parseFloat(productData.price),
    stock: productData.stock || 0,
    image_url: productData.image_url || null,
    created_at: new Date().toISOString(),
    old_price: productData.old_price || productData.price,
    status: productData.status || 'active'
  };
  
  products.push(newProduct);
  saveProducts(products);
  
  return newProduct;
};

// Update product
export const updateProduct = async (productId, productData) => {
  const products = loadProducts();
  const productIndex = products.findIndex(p => p.product_id === productId);
  
  if (productIndex === -1) return null;
  
  products[productIndex] = {
    ...products[productIndex],
    ...productData,
    updated_at: new Date().toISOString()
  };
  
  saveProducts(products);
  return products[productIndex];
};

// Delete product
export const deleteProduct = async (productId) => {
  const products = loadProducts();
  const newProducts = products.filter(p => p.product_id !== productId);
  
  if (newProducts.length === products.length) return false;
  
  saveProducts(newProducts);
  return true;
};

// Get category by ID
export const getCategoryById = async (categoryId) => {
  const categories = loadCategories();
  return categories.find(c => c.category_id === categoryId) || null;
};

export default {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategoryById
};
