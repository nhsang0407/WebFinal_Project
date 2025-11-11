/**
 * Mock Category Model
 * Sử dụng dữ liệu từ mock_data/categories.json
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MOCK_DATA_DIR = path.join(__dirname, '..', '..', 'mock_data');

let categoriesCache = null;

function loadCategories() {
  try {
    const filePath = path.join(MOCK_DATA_DIR, 'categories.json');
    const data = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(data);
    categoriesCache = parsed;
    console.log('[MOCK] Categories loaded from file:', parsed.length, 'items');
    return categoriesCache;
  } catch (error) {
    console.error('[MOCK] Error loading categories:', error.message);
    categoriesCache = [];
    return [];
  }
}

function saveCategories(categories) {
  try {
    const filePath = path.join(MOCK_DATA_DIR, 'categories.json');
    fs.writeFileSync(filePath, JSON.stringify(categories, null, 2), 'utf-8');
    categoriesCache = categories;
    return true;
  } catch (error) {
    console.error('[MOCK] Error saving categories:', error.message);
    return false;
  }
}

// Get all categories
export const getAllCategories = async () => {
  return loadCategories();
};

// Get category by ID
export const getCategoryById = async (categoryId) => {
  const categories = loadCategories();
  return categories.find(c => c.category_id === categoryId) || null;
};

// Create category
export const createCategory = async (categoryData) => {
  const categories = loadCategories();
  
  const maxId = categories.length > 0 ? Math.max(...categories.map(c => c.category_id)) : 0;
  const newId = maxId + 1;
  
  const newCategory = {
    category_id: newId,
    category_name: categoryData.category_name || categoryData.name || '',
    name: categoryData.category_name || categoryData.name || '', // Keep for compatibility
    description: categoryData.description || '',
    image: categoryData.image || 'NOIMAGE',
    image_url: categoryData.image_url || 'NOIMAGE',
    product_count: categoryData.product_count || 0,
    status: categoryData.status || 'active',
    is_active: categoryData.is_active ?? 1,
    created_at: new Date().toISOString()
  };
  
  categories.push(newCategory);
  saveCategories(categories);
  
  return newCategory;
};

// Update category
export const updateCategory = async (categoryId, categoryData) => {
  const categories = loadCategories();
  const categoryIndex = categories.findIndex(c => c.category_id === categoryId);
  
  if (categoryIndex === -1) return null;
  
  // Map category_name from either category_name or name field
  const updateData = {
    ...categoryData
  };
  
  if (updateData.name && !updateData.category_name) {
    updateData.category_name = updateData.name;
  }
  
  categories[categoryIndex] = {
    ...categories[categoryIndex],
    ...updateData,
    updated_at: new Date().toISOString()
  };
  
  // Ensure both name fields are in sync
  if (categories[categoryIndex].category_name) {
    categories[categoryIndex].name = categories[categoryIndex].category_name;
  }
  
  saveCategories(categories);
  return categories[categoryIndex];
};

// Delete category
export const deleteCategory = async (categoryId) => {
  const categories = loadCategories();
  const newCategories = categories.filter(c => c.category_id !== categoryId);
  
  if (newCategories.length === categories.length) return false;
  
  saveCategories(newCategories);
  return true;
};

export default {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};
