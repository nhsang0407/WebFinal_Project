/**
 * Mock Promotion Controller
 * Xử lý requests cho promotions
 */

import * as mockPromotionModel from '../models/mockPromotionModel.js';

/**
 * Get all promotions
 */
export const getPromotions = (req, res) => {
  try {
    const { category, status, search } = req.query;

    const filters = {
      ...(category && { category }),
      ...(status && { status }),
      ...(search && { search }),
    };

    const promotions = mockPromotionModel.getAllPromotions(filters);

    res.json({
      success: true,
      message: 'Get promotions success',
      data: promotions,
      total: promotions.length,
    });
  } catch (err) {
    console.error('[promotionController] Error getting promotions:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to get promotions',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
};

/**
 * Get promotion by ID
 */
export const getPromotionById = (req, res) => {
  try {
    const { id } = req.params;

    const promotion = mockPromotionModel.getPromotionById(parseInt(id));

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found',
      });
    }

    res.json({
      success: true,
      message: 'Get promotion success',
      data: promotion,
    });
  } catch (err) {
    console.error('[promotionController] Error getting promotion:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to get promotion',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
};

/**
 * Create promotion
 */
export const createPromotion = (req, res) => {
  try {
    const newPromotion = mockPromotionModel.createPromotion(req.body);

    res.status(201).json({
      success: true,
      message: 'Create promotion success',
      data: newPromotion,
    });
  } catch (err) {
    console.error('[promotionController] Error creating promotion:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to create promotion',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
};

/**
 * Update promotion
 */
export const updatePromotion = (req, res) => {
  try {
    const { id } = req.params;

    const updated = mockPromotionModel.updatePromotion(parseInt(id), req.body);

    res.json({
      success: true,
      message: 'Update promotion success',
      data: updated,
    });
  } catch (err) {
    console.error('[promotionController] Error updating promotion:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update promotion',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
};

/**
 * Delete promotion
 */
export const deletePromotion = (req, res) => {
  try {
    const { id } = req.params;

    mockPromotionModel.deletePromotion(parseInt(id));

    res.json({
      success: true,
      message: 'Delete promotion success',
    });
  } catch (err) {
    console.error('[promotionController] Error deleting promotion:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to delete promotion',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
};

export default {
  getPromotions,
  getPromotionById,
  createPromotion,
  updatePromotion,
  deletePromotion,
};
