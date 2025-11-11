/**
 * Mock Blog Controller
 * Xử lý logic blog sử dụng mock data
 */

import * as mockBlogModel from '../models/mockBlogModel.js';

// Get all blogs
export const getBlogs = async (req, res) => {
  try {
    const { search, status, admin_id } = req.query;

    const filters = {};
    if (search) filters.search = search;
    if (status) filters.status = status;
    if (admin_id) filters.admin_id = Number.parseInt(admin_id);

    const blogs = await mockBlogModel.getAllBlogs(filters);

    res.json({
      message: 'Get blogs successfully',
      data: blogs,
      total: blogs.length
    });
  } catch (error) {
    console.error('[MOCK] Get blogs error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get blog detail
export const getBlogDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await mockBlogModel.getBlogById(Number.parseInt(id));

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    res.json({
      message: 'Get blog successfully',
      data: blog
    });
  } catch (error) {
    console.error('[MOCK] Get blog detail error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create blog
export const createBlog = async (req, res) => {
  try {
    const { title, content, category, summary, image_url, published, status } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const newBlog = await mockBlogModel.createBlog({
      title,
      content,
      category: category || 'Chung',
      summary: summary || '',
      image_url: image_url || '',
      published: published !== undefined ? published : true,
      status: status || 'active'
    });

    res.status(201).json({
      message: 'Blog created successfully',
      data: newBlog
    });
  } catch (error) {
    console.error('[MOCK] Create blog error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update blog
export const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updated = await mockBlogModel.updateBlog(Number.parseInt(id), updates);

    if (!updated) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    res.json({
      message: 'Blog updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('[MOCK] Update blog error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete blog
export const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await mockBlogModel.deleteBlog(Number.parseInt(id));

    if (!deleted) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    res.json({
      message: 'Blog deleted successfully'
    });
  } catch (error) {
    console.error('[MOCK] Delete blog error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export default {
  getBlogs,
  getBlogDetail,
  createBlog,
  updateBlog,
  deleteBlog
};
