/**
 * Admin API Routes
 * Cung cấp endpoints CRUD cho admin dashboard
 */

import express from 'express';
import { requireAuth, requireAdmin, requireSuperAdmin } from '../middleware/authMiddleware.js';
import * as mockOrderController from '../controllers/mockOrderController.js';
import * as mockOrderModel from '../models/mockOrderModel.js';
import * as mockUserModel from '../models/mockUserModel.js';
import * as mockPromotionController from '../controllers/mockPromotionController.js';
import * as mockBlogController from '../controllers/mockBlogController.js';
import * as mockProductModel from '../models/mockProductModel.js';
import * as mockCategoryModel from '../models/mockCategoryModel.js';

const router = express.Router();

// ========== PRODUCTS ==========

/**
 * GET /api/admin/products
 * Lấy danh sách tất cả sản phẩm từ mock_data
 */
router.get('/products', requireAuth, requireAdmin, async (req, res) => {
  try {
    console.log('[ADMIN] GET /products');

    const { category, search, status } = req.query;
    let filtered = await mockProductModel.getAllProducts();
    
    // Get all categories for mapping
    const allCategories = await mockCategoryModel.getAllCategories();
    const categoryMap = new Map(allCategories.map(cat => [cat.category_id, cat.category_name || cat.name]));

    // Filter by category
    if (category) {
      filtered = filtered.filter((p) => p.category_id === Number.parseInt(category));
    }

    // Filter by search
    if (search) {
      filtered = filtered.filter((p) =>
        (p.product_name || '').toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filter by status
    if (status) {
      filtered = filtered.filter((p) => p.status === status);
    }
    
    // Add category name to each product
    filtered = filtered.map(product => ({
      ...product,
      category: categoryMap.get(product.category_id) || 'N/A'
    }));

    res.json({
      success: true,
      data: filtered,
      total: filtered.length,
    });
  } catch (error) {
    console.error('[ADMIN] Error in GET /products:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách sản phẩm',
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/products/:id
 * Lấy chi tiết 1 sản phẩm
 */
router.get('/products/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const product = await mockProductModel.getProductById(Number.parseInt(id));

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Sản phẩm không tìm thấy',
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('[ADMIN] Error in GET /products/:id:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy chi tiết sản phẩm',
      error: error.message,
    });
  }
});

/**
 * POST /api/admin/products
 * Tạo sản phẩm mới từ mock_data
 */
router.post('/products', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { product_name, name, category_id, price, stock, description, image, old_price, discount, is_promotion, is_active, detail } = req.body;

    // Accept both 'product_name' and 'name'
    const finalProductName = product_name || name;

    // Validation - make stock optional since frontend doesn't send it
    if (!finalProductName || !category_id || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin sản phẩm',
      });
    }

    const newProduct = await mockProductModel.createProduct({
      category_id: Number.parseInt(category_id),
      product_name: finalProductName,
      description: description || '',
      detail: detail || '',
      price: Number.parseInt(price),
      stock: stock ? Number.parseInt(stock) : 0,
      image_url: image || 'NOIMAGE',
      status: is_active ? 'active' : 'inactive',
      old_price: old_price ? Number.parseInt(old_price) : Number.parseInt(price),
      discount: discount ? Number.parseInt(discount) : 0,
      is_promotion: is_promotion ? 1 : 0,
    });

    console.log(`[ADMIN] Product created: #${newProduct.product_id} - ${finalProductName}`);

    res.status(201).json({
      success: true,
      message: 'Thêm sản phẩm thành công',
      id: newProduct.product_id,
      data: newProduct,
    });
  } catch (error) {
    console.error('[ADMIN] Error in POST /products:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi tạo sản phẩm',
      error: error.message,
    });
  }
});

/**
 * PUT /api/admin/products/:id
 * Cập nhật sản phẩm
 */
router.put('/products/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const product = await mockProductModel.getProductById(Number.parseInt(id));

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Sản phẩm không tìm thấy',
      });
    }

    const { product_name, name, category_id, price, stock, status, description, image, old_price, discount, is_promotion, is_active, detail } = req.body;

    // Accept both 'product_name' and 'name'
    const finalProductName = product_name || name;

    const updates = {
      ...(finalProductName && { product_name: finalProductName }),
      ...(category_id && { category_id: Number.parseInt(category_id) }),
      ...(description && { description }),
      ...(detail && { detail }),
      ...(price !== undefined && { price: Number.parseInt(price) }),
      ...(stock !== undefined && { stock: Number.parseInt(stock) }),
      ...(status && { status }),
      ...(is_active !== undefined && { status: is_active ? 'active' : 'inactive' }),
      ...(image && { image_url: image }),
      ...(old_price !== undefined && { old_price: Number.parseInt(old_price) }),
      ...(discount !== undefined && { discount: Number.parseInt(discount) }),
      ...(is_promotion !== undefined && { is_promotion: is_promotion ? 1 : 0 }),
    };

    const updated = await mockProductModel.updateProduct(Number.parseInt(id), updates);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Sản phẩm không tìm thấy',
      });
    }

    console.log(`[ADMIN] Product updated: #${id} - ${updated.product_name}`);

    res.json({
      success: true,
      message: 'Cập nhật sản phẩm thành công',
      id: updated.product_id,
      data: updated,
    });
  } catch (error) {
    console.error('[ADMIN] Error in PUT /products/:id:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật sản phẩm',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/admin/products/:id
 * Xóa sản phẩm
 */
router.delete('/products/:id', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await mockProductModel.deleteProduct(Number.parseInt(id));

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Sản phẩm không tìm thấy',
      });
    }

    console.log(`[ADMIN] Product deleted: #${id}`);

    res.json({
      success: true,
      message: 'Xóa sản phẩm thành công',
    });
  } catch (error) {
    console.error('[ADMIN] Error in DELETE /products/:id:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi xóa sản phẩm',
      error: error.message,
    });
  }
});

// ========== CATEGORIES ==========

/**
 * GET /api/admin/categories
 * Lấy danh sách danh mục từ mock_data
 */
router.get('/categories', requireAuth, requireAdmin, async (req, res) => {
  try {
    const categories = await mockCategoryModel.getAllCategories();
    res.json({
      success: true,
      data: categories,
      total: categories.length,
    });
  } catch (error) {
    console.error('[ADMIN] Error in GET /categories:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách danh mục',
      error: error.message,
    });
  }
});

/**
 * POST /api/admin/categories
 * Tạo danh mục mới
 */
router.post('/categories', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, category_name, description } = req.body;
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

    console.log(`[ADMIN] Category created: #${newCategory.category_id} - ${finalName}`);

    res.status(201).json({
      success: true,
      message: 'Thêm danh mục thành công',
      data: newCategory,
    });
  } catch (error) {
    console.error('[ADMIN] Error in POST /categories:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi tạo danh mục',
      error: error.message,
    });
  }
});

/**
 * PUT /api/admin/categories/:id
 * Cập nhật danh mục
 */
router.put('/categories/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category_name, description } = req.body;
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

    console.log(`[ADMIN] Category updated: #${id}`);

    res.json({
      success: true,
      message: 'Cập nhật danh mục thành công',
      data: updated,
    });
  } catch (error) {
    console.error('[ADMIN] Error in PUT /categories/:id:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật danh mục',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/admin/categories/:id
 * Xóa danh mục
 */
router.delete('/categories/:id', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await mockCategoryModel.deleteCategory(Number.parseInt(id));

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Danh mục không tìm thấy',
      });
    }

    console.log(`[ADMIN] Category deleted: #${id}`);

    res.json({
      success: true,
      message: 'Xóa danh mục thành công',
    });
  } catch (error) {
    console.error('[ADMIN] Error in DELETE /categories/:id:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi xóa danh mục',
      error: error.message,
    });
  }
});

// ========== ORDERS ==========

/**
 * GET /api/admin/orders
 * Lấy danh sách đơn hàng (từ mock data với enriched items)
 */
router.get('/orders', requireAuth, requireAdmin, mockOrderController.getOrders);

/**
 * GET /api/admin/orders/:id
 * Lấy chi tiết đơn hàng (từ mock data với enriched items)
 */
router.get('/orders/:id', requireAuth, requireAdmin, mockOrderController.getOrderDetail);

/**
 * PUT /api/admin/orders/:id
 * Cập nhật trạng thái đơn hàng
 */
router.put('/orders/:id', requireAuth, requireAdmin, mockOrderController.updateOrderStatus);

// ========== USERS ==========

/**
 * GET /api/admin/users
 * Lấy danh sách người dùng (từ mock data)
 */
router.get('/users', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { role, status, search } = req.query;
    
    // Get all users from mock model
    const allUsers = await mockUserModel.getAllUsers?.() || [];
    
    let filtered = Array.isArray(allUsers) ? [...allUsers] : [];

    // Filter by role
    if (role) {
      filtered = filtered.filter((u) => u.role === role);
    }

    // Filter by status
    if (status) {
      // Handle both 'active' and is_active: 1
      const isActive = status === 'active' || status === '1';
      filtered = filtered.filter((u) => 
        (u.is_active === 1 || u.status === 'active') === isActive
      );
    }

    // Filter by search (username or email)
    if (search) {
      filtered = filtered.filter((u) => {
        const username = u.username?.toLowerCase() || '';
        const email = u.email?.toLowerCase() || '';
        const fullName = u.full_name?.toLowerCase() || '';
        const searchLower = search.toLowerCase();
        return username.includes(searchLower) || 
               email.includes(searchLower) || 
               fullName.includes(searchLower);
      });
    }

    res.json({
      success: true,
      data: filtered,
      total: filtered.length,
    });
  } catch (error) {
    console.error('[ADMIN] Error in GET /users:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách người dùng',
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/stats
 * Lấy thống kê dashboard
 */
router.get('/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    // Get data from mock models
    const allOrders = await mockOrderModel.getAllOrders();
    const allProducts = await mockProductModel.getAllProducts();
    const allCategories = await mockCategoryModel.getAllCategories();
    
    const stats = {
      total_orders: Array.isArray(allOrders) ? allOrders.length : 0,
      total_products: Array.isArray(allProducts) ? allProducts.length : 0,
      total_users: 0, // Could get from mockUserModel if available
      total_categories: Array.isArray(allCategories) ? allCategories.length : 0,
      active_products: Array.isArray(allProducts) ? allProducts.filter((p) => p.status === 'active').length : 0,
      total_revenue: Array.isArray(allOrders) ? allOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0) : 0,
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('[ADMIN] Error in GET /stats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thống kê',
      error: error.message,
    });
  }
});

// ========== PROMOTIONS ==========

/**
 * GET /api/admin/promotions
 * Lấy danh sách khuyến mãi
 */
router.get('/promotions', requireAuth, requireAdmin, mockPromotionController.getPromotions);

/**
 * GET /api/admin/promotions/:id
 * Lấy chi tiết khuyến mãi
 */
router.get('/promotions/:id', requireAuth, requireAdmin, mockPromotionController.getPromotionById);

/**
 * POST /api/admin/promotions
 * Tạo khuyến mãi mới
 */
router.post('/promotions', requireAuth, requireAdmin, mockPromotionController.createPromotion);

/**
 * PUT /api/admin/promotions/:id
 * Cập nhật khuyến mãi
 */
router.put('/promotions/:id', requireAuth, requireAdmin, mockPromotionController.updatePromotion);

/**
 * DELETE /api/admin/promotions/:id
 * Xóa khuyến mãi
 */
router.delete('/promotions/:id', requireAuth, requireSuperAdmin, mockPromotionController.deletePromotion);

// ========== BLOGS ==========

/**
 * GET /api/admin/blogs
 * Lấy danh sách bài viết
 */
router.get('/blogs', requireAuth, requireAdmin, mockBlogController.getBlogs);

/**
 * GET /api/admin/blogs/:id
 * Lấy chi tiết bài viết
 */
router.get('/blogs/:id', requireAuth, requireAdmin, mockBlogController.getBlogDetail);

/**
 * POST /api/admin/blogs
 * Tạo bài viết mới
 */
router.post('/blogs', requireAuth, requireAdmin, mockBlogController.createBlog);

/**
 * PUT /api/admin/blogs/:id
 * Cập nhật bài viết
 */
router.put('/blogs/:id', requireAuth, requireAdmin, mockBlogController.updateBlog);

/**
 * DELETE /api/admin/blogs/:id
 * Xóa bài viết
 */
router.delete('/blogs/:id', requireAuth, requireSuperAdmin, mockBlogController.deleteBlog);

export default router;
