/**
 * Mock Blog Model
 * Sử dụng dữ liệu từ mock_data/blogs.json
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MOCK_DATA_DIR = path.join(__dirname, '..', '..', 'mock_data');

let blogsCache = null;

function loadBlogs() {
  if (blogsCache) return blogsCache;
  try {
    const filePath = path.join(MOCK_DATA_DIR, 'blogs.json');
    const data = fs.readFileSync(filePath, 'utf-8');
    blogsCache = JSON.parse(data);
    return blogsCache;
  } catch (error) {
    console.error('[MOCK] Error loading blogs:', error.message);
    return [];
  }
}

function saveBlogs(blogs) {
  try {
    const filePath = path.join(MOCK_DATA_DIR, 'blogs.json');
    fs.writeFileSync(filePath, JSON.stringify(blogs, null, 2), 'utf-8');
    blogsCache = blogs;
    return true;
  } catch (error) {
    console.error('[MOCK] Error saving blogs:', error.message);
    return false;
  }
}

// Get all blogs
export const getAllBlogs = async (filters = {}) => {
  try {
    let blogs = loadBlogs();

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      blogs = blogs.filter(
        blog =>
          blog.title?.toLowerCase().includes(searchLower) ||
          blog.content?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.status) {
      blogs = blogs.filter(blog => blog.status === filters.status);
    }

    if (filters.admin_id) {
      blogs = blogs.filter(blog => blog.admin_id === filters.admin_id);
    }

    return blogs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  } catch (error) {
    console.error('[MOCK] Error getting all blogs:', error);
    return [];
  }
};

// Get blog by ID
export const getBlogById = async (id) => {
  try {
    const blogs = loadBlogs();
    return blogs.find(blog => blog.blog_id === id);
  } catch (error) {
    console.error('[MOCK] Error getting blog by ID:', error);
    return null;
  }
};

// Create blog
export const createBlog = async (blogData) => {
  try {
    let blogs = loadBlogs();

    // Generate new ID
    const newId = blogs.length > 0 ? Math.max(...blogs.map(b => b.blog_id)) + 1 : 1;

    const newBlog = {
      blog_id: newId,
      admin_id: blogData.admin_id || 1,
      title: blogData.title,
      content: blogData.content,
      category: blogData.category || 'Chung',
      summary: blogData.summary || '',
      image_url: blogData.image_url || '',
      published: blogData.published !== undefined ? blogData.published : true,
      status: blogData.status || 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    blogs.push(newBlog);
    saveBlogs(blogs);

    return newBlog;
  } catch (error) {
    console.error('[MOCK] Error creating blog:', error);
    return null;
  }
};

// Update blog
export const updateBlog = async (id, updates) => {
  try {
    let blogs = loadBlogs();
    const index = blogs.findIndex(blog => blog.blog_id === id);

    if (index === -1) {
      return null;
    }

    blogs[index] = {
      ...blogs[index],
      ...updates,
      updated_at: new Date().toISOString()
    };

    saveBlogs(blogs);

    return blogs[index];
  } catch (error) {
    console.error('[MOCK] Error updating blog:', error);
    return null;
  }
};

// Delete blog
export const deleteBlog = async (id) => {
  try {
    let blogs = loadBlogs();
    const index = blogs.findIndex(blog => blog.blog_id === id);

    if (index === -1) {
      return false;
    }

    blogs.splice(index, 1);
    saveBlogs(blogs);

    return true;
  } catch (error) {
    console.error('[MOCK] Error deleting blog:', error);
    return false;
  }
};

export default {
  getAllBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog
};
