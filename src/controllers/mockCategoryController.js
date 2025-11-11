/**
 * Mock Category Controller
 * Xử lý các request liên quan đến danh mục sản phẩm
 */

import * as mockCategoryModel from '../models/mockCategoryModel.js';

// Get all categories
export const getCategories = async (req, res) => {
  try {
    const categories = await mockCategoryModel.getAllCategories();
    res.json({
      success: true,
      data: categories,
      total: categories.length,
    });
  } catch (error) {
    console.error('[MOCK] Error getting categories:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách danh mục',
      error: error.message,
    });
  }
};

// Get category by ID
export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await mockCategoryModel.getCategoryById(Number.parseInt(id));

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Danh mục không tìm thấy',
      });
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('[MOCK] Error getting category:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy chi tiết danh mục',
      error: error.message,
    });
  }
};

// Create category
export const createCategory = async (req, res) => {
  try {
    const { category_name, name, description } = req.body;

    const finalName = category_name || name;

    if (!finalName) {
      return res.status(400).json({
        success: false,
        message: 'Tên danh mục không được để trống',
      });
    }

    const newCategory = await mockCategoryModel.createCategory({
      category_name: finalName,
      description: description || '',
    });

    console.log(`[MOCK] Category created: #${newCategory.category_id} - ${finalName}`);

    res.status(201).json({
      success: true,
      message: 'Thêm danh mục thành công',
      id: newCategory.category_id,
      data: newCategory,
    });
  } catch (error) {
    console.error('[MOCK] Error creating category:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi tạo danh mục',
      error: error.message,
    });
  }
};

// Update category
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { category_name, name, description } = req.body;

    const finalName = category_name || name;

    const updated = await mockCategoryModel.updateCategory(Number.parseInt(id), {
      ...(finalName && { category_name: finalName }),
      ...(description && { description }),
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Danh mục không tìm thấy',
      });
    }

    console.log(`[MOCK] Category updated: #${id}`);

    res.json({
      success: true,
      message: 'Cập nhật danh mục thành công',
      id: updated.category_id,
      data: updated,
    });
  } catch (error) {
    console.error('[MOCK] Error updating category:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật danh mục',
      error: error.message,
    });
  }
};

// Delete category
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await mockCategoryModel.deleteCategory(Number.parseInt(id));

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Danh mục không tìm thấy',
      });
    }

    console.log(`[MOCK] Category deleted: #${id}`);

    res.json({
      success: true,
      message: 'Xóa danh mục thành công',
    });
  } catch (error) {
    console.error('[MOCK] Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi xóa danh mục',
      error: error.message,
    });
  }
};

export default {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
