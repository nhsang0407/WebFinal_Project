/**
 * Mock Promotion Model
 * Xử lý dữ liệu khuyến mãi từ mock JSON
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROMOTIONS_FILE = path.join(__dirname, '../../mock_data/promotions.json');

/**
 * Load all promotions from JSON file
 */
function loadPromotions() {
  try {
    const data = fs.readFileSync(PROMOTIONS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('[mockPromotionModel] Error loading promotions:', err.message);
    return [];
  }
}

/**
 * Get all promotions with optional filters
 */
export const getAllPromotions = (filters = {}) => {
  let promotions = loadPromotions();

  // Filter by search term (search in code and description)
  if (filters.search) {
    const searchTerm = filters.search.toLowerCase();
    promotions = promotions.filter(p =>
      p.code.toLowerCase().includes(searchTerm) ||
      p.description.toLowerCase().includes(searchTerm) ||
      p.category.toLowerCase().includes(searchTerm)
    );
  }

  return promotions;
};

/**
 * Get promotion by ID
 */
export const getPromotionById = (promotionId) => {
  const promotions = loadPromotions();
  return promotions.find(p => p.promotion_id === promotionId);
};

/**
 * Create new promotion
 */
export const createPromotion = (promotionData) => {
  try {
    const promotions = loadPromotions();
    const newPromotion = {
      promotion_id: Math.max(...promotions.map(p => p.promotion_id), 0) + 1,
      ...promotionData,
      quantity_used: promotionData.quantity_used || 0,
    };
    promotions.push(newPromotion);
    fs.writeFileSync(PROMOTIONS_FILE, JSON.stringify(promotions, null, 2));
    return newPromotion;
  } catch (err) {
    console.error('[mockPromotionModel] Error creating promotion:', err.message);
    throw err;
  }
};

/**
 * Update promotion
 */
export const updatePromotion = (promotionId, updateData) => {
  try {
    const promotions = loadPromotions();
    const index = promotions.findIndex(p => p.promotion_id === promotionId);
    if (index === -1) {
      throw new Error('Promotion not found');
    }
    promotions[index] = { ...promotions[index], ...updateData };
    fs.writeFileSync(PROMOTIONS_FILE, JSON.stringify(promotions, null, 2));
    return promotions[index];
  } catch (err) {
    console.error('[mockPromotionModel] Error updating promotion:', err.message);
    throw err;
  }
};

/**
 * Delete promotion
 */
export const deletePromotion = (promotionId) => {
  try {
    const promotions = loadPromotions();
    const index = promotions.findIndex(p => p.promotion_id === promotionId);
    if (index === -1) {
      throw new Error('Promotion not found');
    }
    const deleted = promotions.splice(index, 1);
    fs.writeFileSync(PROMOTIONS_FILE, JSON.stringify(promotions, null, 2));
    return deleted[0];
  } catch (err) {
    console.error('[mockPromotionModel] Error deleting promotion:', err.message);
    throw err;
  }
};

export default {
  getAllPromotions,
  getPromotionById,
  createPromotion,
  updatePromotion,
  deletePromotion,
};
