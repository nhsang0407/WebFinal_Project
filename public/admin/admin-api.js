/**
 * Admin API Helper Functions
 */

// API_BASE_URL is defined in ../js/config.js
// Using it here for all admin API calls
const API_ADMIN_BASE = API_BASE_URL ? `${API_BASE_URL.replace('/api', '')}/api/admin` : 'http://localhost:5000/api/admin';

/**
 * Format currency to Vietnamese Dong
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Show notification toast
 */
function showNotification(message, type = 'info') {
  // Simple notification - can be enhanced with toast library
  console.log(`[${type.toUpperCase()}] ${message}`);
  // Only show alert for important messages, not for API errors
  // alert(message);
}

/**
 * Fetch API with error handling and automatic retry
 */
async function fetchAPI(endpoint, options = {}) {
  const maxRetries = 3;
  let retryCount = 0;
  const retryDelay = 1000; // 1 second between retries

  while (retryCount < maxRetries) {
    try {
      const url = `${API_ADMIN_BASE}${endpoint}`;
      const response = await fetch(url, {
        credentials: 'include',
        ...options,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'API Error');
      }

      return await response.json();
    } catch (error) {
      retryCount++;
      
      // Log error with retry info
      console.warn(`[API ERROR] ${endpoint} (Attempt ${retryCount}/${maxRetries}):`, error.message);
      
      // If max retries reached, throw error
      if (retryCount >= maxRetries) {
        console.error(`[API FAILED] ${endpoint} - Max retries (${maxRetries}) reached`);
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay * retryCount));
    }
  }
}

/**
 * GET Products
 */
async function getProducts(filters = {}) {
  const params = new URLSearchParams(filters);
  return fetchAPI(`/products?${params}`);
}

/**
 * GET Product by ID
 */
async function getProduct(id) {
  return fetchAPI(`/products/${id}`);
}

/**
 * CREATE Product
 */
async function createProduct(productData) {
  return fetchAPI('/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(productData),
  });
}

/**
 * UPDATE Product
 */
async function updateProduct(id, productData) {
  return fetchAPI(`/products/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(productData),
  });
}

/**
 * DELETE Product
 */
async function deleteProduct(id) {
  if (!confirm('Bạn chắc chắn muốn xóa sản phẩm này?')) return;

  try {
    const response = await fetchAPI(`/products/${id}`, {
      method: 'DELETE',
    });

    if (response.success) {
      showNotification('Xóa sản phẩm thành công', 'success');
      loadProductsTable();
    }
  } catch (error) {
    console.error('Error deleting product:', error);
  }
}

/**
 * GET Categories
 */
async function getCategories() {
  console.log('[API] Fetching categories from /categories endpoint...');
  try {
    const result = await fetchAPI('/categories');
    console.log('[API] Categories response received:', result);
    return result;
  } catch (error) {
    console.error('[API] Error fetching categories:', error);
    throw error;
  }
}

/**
 * GET Category by ID
 */
async function getCategory(id) {
  return fetchAPI(`/categories/${id}`);
}

/**
 * CREATE Category
 */
async function createCategory(categoryData) {
  return fetchAPI('/categories', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(categoryData),
  });
}

/**
 * UPDATE Category
 */
async function updateCategory(id, categoryData) {
  return fetchAPI(`/categories/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(categoryData),
  });
}

/**
 * DELETE Category
 */
async function deleteCategory(id) {
  if (!confirm('Bạn chắc chắn muốn xóa danh mục này?')) return;

  try {
    const response = await fetchAPI(`/categories/${id}`, {
      method: 'DELETE',
    });

    if (response.success) {
      showNotification('Xóa danh mục thành công', 'success');
      loadCategoriesTable();
    }
  } catch (error) {
    console.error('Error deleting category:', error);
  }
}

/**
 * GET Orders
 */
async function getOrders(filters = {}) {
  const params = new URLSearchParams(filters);
  return fetchAPI(`/orders?${params}`);
}

/**
 * GET Order by ID
 */
async function getOrder(id) {
  return fetchAPI(`/orders/${id}`);
}

/**
 * UPDATE Order
 */
async function updateOrder(id, orderData) {
  return fetchAPI(`/orders/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderData),
  });
}

/**
 * GET Users
 */
async function getUsers(filters = {}) {
  const params = new URLSearchParams(filters);
  return fetchAPI(`/users?${params}`);
}

/**
 * GET Stats
 */
async function getStats() {
  return fetchAPI('/stats');
}

/**
 * GET Promotions
 */
async function getPromotions(filters = {}) {
  const params = new URLSearchParams(filters);
  return fetchAPI(`/promotions?${params}`);
}

/**
 * GET Promotion by ID
 */
async function getPromotion(id) {
  return fetchAPI(`/promotions/${id}`);
}

/**
 * CREATE Promotion
 */
async function createPromotion(promotionData) {
  return fetchAPI('/promotions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(promotionData),
  });
}

/**
 * UPDATE Promotion
 */
async function updatePromotion(id, promotionData) {
  return fetchAPI(`/promotions/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(promotionData),
  });
}

/**
 * DELETE Promotion
 */
async function deletePromotion(id) {
  if (!confirm('Bạn chắc chắn muốn xóa khuyến mãi này?')) return;

  try {
    const response = await fetchAPI(`/promotions/${id}`, {
      method: 'DELETE',
    });

    if (response.success) {
      showNotification('Xóa khuyến mãi thành công', 'success');
      loadPromotionsTable();
    }
  } catch (error) {
    console.error('Error deleting promotion:', error);
  }
}

