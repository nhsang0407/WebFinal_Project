/**
 * Admin Dashboard JavaScript
 * Main logic for admin interface
 */

let charts = {};
let allAdminsData = []; // Store admin/user data for reference

/**
 * Mock admin data for mapping admin_id to name
 * In production, this would be fetched from API
 */
const adminMap = {
  1: 'Dev User',
  2: 'Test User 2',
  3: 'Admin Staff'
};

/**
 * Get admin/user name by admin_id
 */
function getUserNameById(adminId) {
  if (adminMap[adminId]) {
    return adminMap[adminId];
  }
  // If not in map, try to find from fetched data
  if (allAdminsData && allAdminsData.length > 0) {
    const admin = allAdminsData.find(a => a.user_id === adminId);
    if (admin) {
      return admin.full_name || admin.username || `User #${adminId}`;
    }
  }
  return `Admin #${adminId}`;
}

/**
 * Hide auth loading screen
 */
function hideAuthLoadingScreen() {
  const screen = document.getElementById('authLoadingScreen');
  if (screen) {
    screen.style.display = 'none';
  }
}

/**
 * Show auth loading screen (if needed for re-auth)
 */
function showAuthLoadingScreen() {
  const screen = document.getElementById('authLoadingScreen');
  if (screen) {
    screen.style.display = 'flex';
  }
}

/**
 * 🔒 Check if user has admin/staff role access
 * Redirect to login if user is not authorized
 */
async function checkAdminAccess() {
  const handleNotLoggedIn = () => {
    console.warn('❌ Admin Access Denied: User not logged in');
    // Hide loading screen before redirect
    hideAuthLoadingScreen();
    // Redirect to login with return URL
    window.location.href = '../login.html?redirect=/admin/admin.html';
  };

  const handleNotAuthorized = () => {
    console.warn('❌ Admin Access Denied: User is not authorized');
    // Hide loading screen before redirect
    hideAuthLoadingScreen();
    window.location.href = '../index.html';
  };

  try {
    // Fetch session info from server
    const res = await fetch(`${API_BASE_URL}/users/checkAuth`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log(`[checkAdminAccess] Response status: ${res.status}`);

    // If 401/403 -> not authenticated/forbidden
    if (res.status === 401 || res.status === 403) {
      console.warn('[checkAdminAccess] Auth check returned 401/403');
      handleNotLoggedIn();
      return;
    }

    if (!res.ok) {
      console.error('[checkAdminAccess] Server error:', res.status, res.statusText);
      // Still redirect to login on any auth failure
      handleNotLoggedIn();
      return;
    }

    // Parse response
    let data;
    try {
      data = await res.json();
    } catch (parseErr) {
      console.error('[checkAdminAccess] Failed to parse response:', parseErr);
      handleNotLoggedIn();
      return;
    }

    console.log('[checkAdminAccess] Auth response data:', data);

    // Check if logged in
    if (!data || !data.loggedIn) {
      console.warn('[checkAdminAccess] User not logged in (loggedIn flag is false)');
      handleNotLoggedIn();
      return;
    }

    // Check user role
    const userRole = data.role || data.user?.role;
    const validRoles = ['admin', 'super_admin', 'staff'];

    if (!validRoles.includes(userRole)) {
      console.warn(`[checkAdminAccess] Invalid role: ${userRole}`);
      handleNotAuthorized();
      return;
    }

    console.log(`✅ Admin Access Granted: User role is ${userRole}`);
    
    // Hide loading screen once auth check passes
    hideAuthLoadingScreen();
  } catch (error) {
    console.error('[checkAdminAccess] Exception:', error);
    // On network error or other exceptions, show appropriate message
    // Don't immediately redirect - the user might have a valid session
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('[checkAdminAccess] Network error - this might be a CORS or connection issue');
      // Wait a bit and try to show dashboard anyway - session might still be valid
      hideAuthLoadingScreen();
    } else {
      handleNotLoggedIn();
    }
  }
}

/**
 * Initialize admin dashboard
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('Admin dashboard loaded');
  initDashboard();
});

/**
 * Initialize dashboard
 */
function initDashboard() {
  console.log('Initializing admin dashboard...');

  // 🔒 Check if user has admin/staff role
  checkAdminAccess();

  // Fetch current user info and populate topbar/account (non-blocking)
  fetchCurrentUser();

  // Set up sidebar navigation
  setupSidebar();

  // Set up modal handlers
  setupModals();

  // Load dashboard page by default
  showPage('dashboard');

  // Set up user profile
  setupUserProfile();

  console.log('Dashboard initialized successfully');
}

/**
 * Toggle submenu visibility
 */
function toggleSubmenu(element) {
  const submenu = element.nextElementSibling;
  if (submenu && submenu.classList.contains('submenu')) {
    const isVisible = submenu.style.display !== 'none';
    submenu.style.display = isVisible ? 'none' : 'flex';
    
    // Rotate chevron icon
    const chevron = element.querySelector('.fa-chevron-down');
    if (chevron) {
      chevron.style.transform = isVisible ? 'rotate(0deg)' : 'rotate(180deg)';
      chevron.style.transition = 'transform 0.3s ease';
    }
  }
}

/**
 * Set up sidebar navigation
 */
function setupSidebar() {
  const navItems = document.querySelectorAll('.nav-item, .submenu-item');
  const submenuItems = document.querySelectorAll('.submenu-item');
  const sidebarToggle = document.querySelector('.sidebar-toggle');
  const sidebar = document.querySelector('.sidebar');

  navItems.forEach((item) => {
    if (item.classList.contains('logout')) {
      item.addEventListener('click', handleLogout);
    } else {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.getAttribute('data-page');
        if (page) {
          showPage(page);

          // Update active state for regular nav items
          if (!item.classList.contains('submenu-item')) {
            document.querySelectorAll('.nav-item').forEach((nav) => {
              if (!nav.querySelector('.fa-chevron-down')) {
                nav.classList.remove('active');
              }
            });
            item.classList.add('active');
          }
          
          // Update active state for submenu items
          submenuItems.forEach((sub) => sub.classList.remove('active'));
          if (item.classList.contains('submenu-item')) {
            item.classList.add('active');
          }

          // Close sidebar on mobile
          if (window.innerWidth <= 768) {
            sidebar.classList.remove('active');
          }
        }
      });
    }
  });

  // Sidebar toggle
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('active');
      document.querySelector('.admin-container').classList.toggle('sidebar-open');
    });
  }
}

/**
 * Set up modal handlers
 */
function setupModals() {
  const modals = document.querySelectorAll('.modal');
  const closeButtons = document.querySelectorAll('.close-btn');

  modals.forEach((modal) => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  });

  closeButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.target.closest('.modal').classList.remove('active');
    });
  });
}

/**
 * Show specific page
 */
function showPage(pageName) {
  const pages = document.querySelectorAll('.page-content');
  pages.forEach((page) => page.classList.remove('active'));

  const targetPage = document.getElementById(`${pageName}Page`);
  if (targetPage) {
    targetPage.classList.add('active');

    // Load page-specific content
    switch (pageName) {
      case 'dashboard':
        loadDashboard();
        break;
      case 'allProducts':
        loadAllProductsPage();
        break;
      case 'productCategories':
        loadProductCategoriesPage();
        break;
      case 'orders':
        loadOrdersPage();
        break;
      case 'users':
        loadUsersPage();
        break;
      case 'promotions':
        loadPromotionsPage();
        break;
      case 'blogs':
        loadBlogsPage();
        break;
      case 'account':
        loadAccountPage();
        break;
    }

    // Update topbar
    const topbarTitle = document.querySelector('.topbar-left h2');
    if (topbarTitle) {
      topbarTitle.textContent = getPageTitle(pageName);
    }
  }
}

/**
 * Get page title
 */
function getPageTitle(pageName) {
  const titles = {
    dashboard: 'Tổng quan',
    allProducts: 'Tất cả sản phẩm',
    productCategories: 'Danh mục sản phẩm',
    orders: 'Quản lý đơn hàng',
    users: 'Quản lý khách hàng',
    promotions: 'Quản lý khuyến mãi',
    blogs: 'Quản lý blog',
    account: 'Tài khoản Admin',
  };
  return titles[pageName] || pageName;
}

/**
 * Load dashboard data
 */
function loadDashboard() {
  console.log('Loading dashboard...');

  // Get stats from API
  getStats()
    .then((response) => {
      if (response.success) {
        updateStatCards(response.data);
      }
    })
    .catch((error) => {
      console.error('Error loading stats:', error);
    });

  // Initialize charts
  initializeCharts();

  // Load new orders (pending)
  loadNewOrdersTable();

  // Load top products table
  loadTopProductsTable();
}

/**
 * Update stat cards
 */
function updateStatCards(stats) {
  const statCards = document.querySelectorAll('.stat-value');
  if (statCards.length >= 4) {
    statCards[0].textContent = stats.total_orders?.toLocaleString('vi-VN') || '0';
    statCards[1].textContent = stats.total_users?.toLocaleString('vi-VN') || '0';
    statCards[2].textContent = stats.total_products?.toLocaleString('vi-VN') || '0';
    statCards[3].textContent = formatCurrency(stats.total_revenue || 0);
  }
}

/**
 * Load top products table
 */
function loadTopProductsTable() {
  getProducts({ status: 'active' })
    .then((response) => {
      if (!response.success) return;

      const tbody = document.querySelector('#topProductsTable');
      if (!tbody) return;

      tbody.innerHTML = response.data
        .slice(0, 5)
        .map((product, index) => {
          const quantity = Math.floor(Math.random() * 100) + 10;
          const revenue = product.price * quantity;

          return `
            <tr>
              <td>${index + 1}</td>
              <td>${product.name}</td>
              <td>${formatCurrency(product.price)}</td>
              <td>${quantity}</td>
              <td>${formatCurrency(revenue)}</td>
              <td>⭐⭐⭐⭐⭐ (5/5)</td>
            </tr>
          `;
        })
        .join('');
    })
    .catch((error) => console.error('Error loading top products:', error));
}

/**
 * Load new orders (pending orders)
 */
function loadNewOrdersTable() {
  // Fetch all orders then filter client-side for orders that are not completed
  getOrders()
    .then((response) => {
      if (!response.success) return;

      const tbody = document.querySelector('#newOrdersTable');
      if (!tbody) return;

      // Consider orders with status not delivered/cancelled as "new/pending"
      const pending = response.data.filter((o) => {
        const s = (o.status || '').toString().toLowerCase();
        return s !== 'delivered' && s !== 'cancelled' && s !== 'completed';
      });

      tbody.innerHTML = pending
        .slice(0, 6)
        .map((order, index) => {
          const orderDetail = order.items && order.items[0] ? order.items[0] : {};
          const productName = (orderDetail.product_name || orderDetail.name || 'Sản phẩm').toString();
          const quantity = orderDetail.quantity || order.quantity || 1;
          const price = orderDetail.price || order.total_amount || 0;
          const total = order.total_amount || price * quantity;
          const image = orderDetail.image || orderDetail.product_image || '/images/raw/raw/default.png';

          return `
            <tr>
              <td class="order-rank">${index + 1}</td>
              <td class="product-cell"><img src="${image}" class="product-thumb" alt=""/> <div class="product-name">${escapeHtml(productName)}</div></td>
              <td>${formatCurrency(price)}</td>
              <td>${quantity}</td>
              <td>${formatCurrency(total)}</td>
            </tr>
          `;
        })
        .join('');
    })
    .catch((error) => console.error('Error loading new orders:', error));
}

// small helper to avoid XSS when injecting product names
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Initialize charts
 */
async function initializeCharts() {
  try {
    // Fetch data từ API
    const statsResponse = await getStats();
    let chartData = {
      revenue: [],
      users: [],
    };

    if (statsResponse && statsResponse.success && statsResponse.data) {
      // Process revenue data - get monthly data
      if (statsResponse.data.monthlyRevenue) {
        chartData.revenue = statsResponse.data.monthlyRevenue;
      } else {
        // Fallback mock data
        chartData.revenue = [
          { month: 'Jan', amount: 35 },
          { month: 'Feb', amount: 30 },
          { month: 'Mar', amount: 57 },
          { month: 'Apr', amount: 45 },
          { month: 'May', amount: 52 },
          { month: 'Jun', amount: 38 },
          { month: 'Jul', amount: 28 },
          { month: 'Aug', amount: 25 },
          { month: 'Sep', amount: 20 },
          { month: 'Oct', amount: 18 },
          { month: 'Nov', amount: 15 },
          { month: 'Dec', amount: 12 },
        ];
      }

      // Process user activity data
      if (statsResponse.data.userActivity) {
        chartData.users = statsResponse.data.userActivity;
      } else {
        // Fallback mock data
        chartData.users = [
          { month: 'AUG', selfMeasured: 95, member: 48 },
          { month: 'JUL', selfMeasured: 42, member: 18 },
        ];
      }
    } else {
      // Default fallback if API fails
      chartData.revenue = [
        { month: 'Jan', amount: 35 },
        { month: 'Feb', amount: 30 },
        { month: 'Mar', amount: 57 },
        { month: 'Apr', amount: 45 },
        { month: 'May', amount: 52 },
        { month: 'Jun', amount: 38 },
        { month: 'Jul', amount: 28 },
        { month: 'Aug', amount: 25 },
        { month: 'Sep', amount: 20 },
        { month: 'Oct', amount: 18 },
        { month: 'Nov', amount: 15 },
        { month: 'Dec', amount: 12 },
      ];
      chartData.users = [
        { month: 'AUG', selfMeasured: 95, member: 48 },
        { month: 'JUL', selfMeasured: 42, member: 18 },
      ];
    }

    // Revenue Chart (Vertical Bar Chart)
    const revenueCtx = document.getElementById('revenueChart');
    if (revenueCtx && !charts.revenue) {
      const revenueLabels = chartData.revenue.map(item => item.month);
      const revenueAmounts = chartData.revenue.map(item => item.amount);

      charts.revenue = new Chart(revenueCtx, {
        type: 'bar',
        data: {
          labels: revenueLabels,
          datasets: [
            {
              label: 'Doanh thu',
              data: revenueAmounts,
              backgroundColor: '#66bb6a',
              borderRadius: 6,
              borderSkipped: false,
              categoryPercentage: 0.8,
              barPercentage: 0.7,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          indexAxis: 'x',
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              enabled: true,
              backgroundColor: '#a0a9ad',
              padding: 12,
              cornerRadius: 8,
              titleFont: { size: 12, weight: 'bold' },
              bodyFont: { size: 11 },
              displayColors: false,
              callbacks: {
                label: function (context) {
                  return context.parsed.y + ' triệu';
                },
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              ticks: {
                stepSize: 20,
                font: { size: 11 },
                color: '#888',
              },
              grid: {
                display: true,
                color: '#f0f0f0',
                drawBorder: false,
              },
            },
            x: {
              ticks: {
                font: { size: 11 },
                color: '#52c41a',
                weight: 'bold',
              },
              grid: {
                display: false,
                drawBorder: false,
              },
            },
          },
        },
      });
    }

    // User Activity Chart (Vertical Grouped Bar Chart)
    const usersCtx = document.getElementById('activeUsersChart');
    if (usersCtx && !charts.users) {
      const userLabels = chartData.users.map(item => item.month);
      const selfMeasuredData = chartData.users.map(item => item.selfMeasured);
      const memberData = chartData.users.map(item => item.member);

      charts.users = new Chart(usersCtx, {
        type: 'bar',
        data: {
          labels: userLabels,
          datasets: [
            {
              label: 'NGƯỜI DÙNG TỰ ĐO',
              data: selfMeasuredData,
              backgroundColor: '#66bb6a',
              borderRadius: 6,
              borderSkipped: false,
              categoryPercentage: 0.8,
              barPercentage: 0.8,
            },
            {
              label: 'THÀNH VIÊN',
              data: memberData,
              backgroundColor: '#a5d6a7',
              borderRadius: 6,
              borderSkipped: false,
              categoryPercentage: 0.8,
              barPercentage: 0.8,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          indexAxis: 'x',
          plugins: {
            legend: {
              display: true,
              position: 'bottom',
              labels: {
                font: { size: 12, weight: 'bold' },
                color: '#52c41a',
                boxWidth: 14,
                padding: 15,
                usePointStyle: true,
                pointStyle: 'rect',
              },
            },
            tooltip: {
              enabled: true,
              backgroundColor: '#a0a9ad',
              padding: 10,
              cornerRadius: 6,
              titleFont: { size: 11 },
              bodyFont: { size: 11 },
              displayColors: false,
              callbacks: {
                label: function (context) {
                  return context.parsed.y + ' k';
                },
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              ticks: {
                font: { size: 11 },
                color: '#888',
              },
              grid: {
                display: true,
                color: '#f0f0f0',
                drawBorder: false,
              },
            },
            x: {
              ticks: {
                font: { size: 11 },
                color: '#52c41a',
                weight: 'bold',
              },
              grid: {
                display: false,
                drawBorder: false,
              },
            },
          },
        },
      });
    }
  } catch (error) {
    console.error('Error initializing charts:', error);
  }
}

// ========== PRODUCTS PAGE ==========

/**
 * Load Products Page
 */
function loadProductsPage() {
  console.log('Loading products page...');
  loadProductsTable();
}

/**
 * Load products table
 */
function loadProductsTable() {
  console.log('[PRODUCTS] Loading products table...');
  
  getProducts()
    .then((response) => {
      console.log('[PRODUCTS] Response:', response);
      
      if (!response.success) throw new Error(response.message);

      const tbody = document.querySelector('#productsTable');
      if (!tbody) {
        console.error('[PRODUCTS] Table body not found');
        return;
      }

      console.log('[PRODUCTS] Products count:', response.data?.length || 0);

      tbody.innerHTML = response.data
        .map(
          (product) => {
            const categoryName = product.category || 'N/A';
            const productName = product.product_name || product.name || 'N/A';
            const price = product.price || 0;
            const stock = product.stock || 0;
            const status = product.status || 'inactive';
            
            return `
          <tr>
            <td>${product.product_id || product.id || 'N/A'}</td>
            <td>${productName}</td>
            <td>${categoryName}</td>
            <td>${formatCurrency(price)}</td>
            <td>${stock}</td>
            <td><span class="status-badge ${status === 'active' ? 'success' : 'danger'}">${status === 'active' ? 'Hoạt động' : 'Hết hàng'}</span></td>
            <td>
              <button class="btn btn-edit action-btn" onclick="showEditProductModal(${product.product_id || product.id})">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn btn-delete action-btn" onclick="deleteProduct(${product.product_id || product.id})">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          </tr>
        `;
          }
        )
        .join('');
      
      console.log('[PRODUCTS] Table rendered successfully');
    })
    .catch((error) => {
      console.error('[PRODUCTS] Error loading products:', error);
      showNotification('Lỗi tải sản phẩm: ' + (error.message || 'Unknown error'), 'error');
    });
}

/**
 * Show add product modal
 */
function showAddProductModal() {
  const modal = document.querySelector('#editModal');
  const title = modal.querySelector('.modal-header h2');
  const body = modal.querySelector('.modal-body');

  title.textContent = 'Thêm sản phẩm mới';

  body.innerHTML = `
    <form id="productForm" onsubmit="saveProduct(event)">
      <div class="form-group">
        <label>Tên sản phẩm *</label>
        <input type="text" id="productName" required>
      </div>
      <div class="form-group">
        <label>Danh mục *</label>
        <select id="productCategory" required></select>
      </div>
      <div class="form-group">
        <label>Giá *</label>
        <input type="number" id="productPrice" required min="0">
      </div>
      <div class="form-group">
        <label>Số lượng *</label>
        <input type="number" id="productStock" required min="0">
      </div>
      <div class="form-group">
        <label>Mô tả</label>
        <textarea id="productDescription"></textarea>
      </div>
    </form>
  `;

  // Load categories
  loadCategoryOptions();

  modal.classList.add('active');
}

/**
 * Load category options
 */
function loadCategoryOptions() {
  console.log('[CATEGORIES] Loading category options...');
  
  getCategories()
    .then((response) => {
      console.log('[CATEGORIES] Categories response:', response);
      
      if (!response.success) {
        console.error('[CATEGORIES] Response not successful');
        return;
      }

      const select = document.querySelector('#productCategory');
      if (select) {
        select.innerHTML = response.data
          .map((cat) => {
            const catId = cat.category_id || cat.id;
            const catName = cat.category_name || cat.name || 'N/A';
            return `<option value="${catId}">${catName}</option>`;
          })
          .join('');
        
        console.log('[CATEGORIES] Category options loaded:', response.data.length, 'categories');
      }
    })
    .catch((error) => {
      console.error('[CATEGORIES] Error loading categories:', error);
      showNotification('Lỗi tải danh mục', 'error');
    });
}

/**
 * Show edit product modal
 */
function showEditProductModal(productId) {
  getProduct(productId)
    .then((response) => {
      if (!response.success) return;

      const product = response.data;
      const modal = document.querySelector('#editModal');
      const title = modal.querySelector('.modal-header h2');
      const body = modal.querySelector('.modal-body');

      title.textContent = `Chỉnh sửa sản phẩm: ${product.name}`;

      body.innerHTML = `
        <form id="productForm" onsubmit="saveProduct(event, ${product.id})">
          <div class="form-group">
            <label>Tên sản phẩm *</label>
            <input type="text" id="productName" value="${product.name}" required>
          </div>
          <div class="form-group">
            <label>Danh mục *</label>
            <select id="productCategory" required>
              <option value="${product.category_id}" selected>${product.category}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Giá *</label>
            <input type="number" id="productPrice" value="${product.price}" required min="0">
          </div>
          <div class="form-group">
            <label>Số lượng *</label>
            <input type="number" id="productStock" value="${product.stock}" required min="0">
          </div>
          <div class="form-group">
            <label>Mô tả</label>
            <textarea id="productDescription">${product.description || ''}</textarea>
          </div>
        </form>
      `;

      loadCategoryOptions();
      modal.classList.add('active');
    })
    .catch((error) => console.error('Error loading product:', error));
}

/**
 * Save product
 */
function saveProduct(event, productId = null) {
  event.preventDefault();

  // Get form values
  const productName = document.querySelector('#productName').value.trim();
  const categoryId = document.querySelector('#productCategory').value.trim();
  const productPrice = document.querySelector('#productPrice').value.trim();
  const promotionPercent = parseInt(document.querySelector('#productOldPrice').value || 0);
  const productSummary = document.querySelector('#productSummary').value.trim();
  const isActive = document.querySelector('#productActive').checked;
  const isPromotion = document.querySelector('#productPromotion').checked;

  // Validate required fields
  if (!productName) {
    showNotification('Vui lòng nhập tên sản phẩm', 'error');
    return;
  }

  if (!categoryId) {
    showNotification('Vui lòng chọn danh mục', 'error');
    return;
  }

  const priceNum = parseInt(productPrice);
  if (!productPrice || isNaN(priceNum) || priceNum <= 0) {
    showNotification('Vui lòng nhập giá hợp lệ', 'error');
    return;
  }

  if (!productSummary) {
    showNotification('Vui lòng nhập thông tin sản phẩm', 'error');
    return;
  }

  // Calculate old price (sale price) based on discount percentage
  const finalPrice = promotionPercent > 0 ? Math.round(priceNum * (100 - promotionPercent) / 100) : priceNum;

  // Send with product_name (not name) for consistency with backend
  const productData = {
    product_name: productName,  // Use product_name instead of name
    category_id: parseInt(categoryId),
    price: priceNum,
    old_price: finalPrice,
    discount: promotionPercent,
    description: productSummary,
    detail: document.querySelector('#productDescription').value || '',
    status: isActive ? 'active' : 'inactive',
    is_active: isActive ? 1 : 0,
    is_promotion: isPromotion ? 1 : 0,
  };

  console.log('Saving product with data:', productData);

  const promise = productId ? updateProduct(productId, productData) : createProduct(productData);

  promise
    .then((response) => {
      console.log('Product save response:', response);
      if (response.success || response.id) {
        showNotification(
          productId ? 'Cập nhật sản phẩm thành công' : 'Thêm sản phẩm thành công',
          'success'
        );
        closeProductModal();
        loadAllProductsTable();
      } else {
        throw new Error(response.message || 'Lỗi lưu sản phẩm');
      }
    })
    .catch((error) => {
      console.error('Error saving product:', error);
      showNotification(error.message || 'Lỗi lưu sản phẩm', 'error');
    });
}

/**
 * Calculate and display final price after discount
 */
function updateFinalPrice() {
  const priceInput = document.querySelector('#productPrice');
  const promotionInput = document.querySelector('#productOldPrice');
  const finalPriceDisplay = document.querySelector('#finalPrice');

  if (!priceInput || !promotionInput || !finalPriceDisplay) return;

  const price = parseInt(priceInput.value) || 0;
  const promotion = parseInt(promotionInput.value) || 0;

  let finalPrice = price;
  if (promotion > 0 && promotion <= 100) {
    finalPrice = Math.round(price * (100 - promotion) / 100);
  }

  finalPriceDisplay.textContent = finalPrice.toLocaleString('vi-VN') + ' VNĐ';
}

/**
 * Toggle promotion checkbox - enable/disable promotion field
 */
function togglePromotionField() {
  const promotionCheckbox = document.querySelector('#productPromotion');
  const promotionInput = document.querySelector('#productOldPrice');

  if (!promotionCheckbox || !promotionInput) return;

  if (promotionCheckbox.checked) {
    promotionInput.disabled = false;
    promotionInput.style.borderColor = '#c8e6c9';
    promotionInput.style.background = 'white';
  } else {
    promotionInput.disabled = true;
    promotionInput.value = '0';
    promotionInput.style.borderColor = '#e0e0e0';
    promotionInput.style.background = '#f5f5f5';
    updateFinalPrice();
  }
}

/**
 * Load all products page with table matching screenshot
 */
function loadAllProductsPage() {
  console.log('Loading all products page...');
  loadAllProductsTable();
  loadAllProductsCategoryFilter();
}

/**
 * Load all products table with columns: ID | Category | Image | Name | Price | Visible | Actions
 */
function loadAllProductsTable() {
  getProducts()
    .then((response) => {
      if (!response.success) throw new Error(response.message);

      const tbody = document.querySelector('#allProductsTable');
      if (!tbody) return;

      tbody.innerHTML = response.data
        .map((product) => {
          const imageUrl = product.image_url || product.image || 'https://via.placeholder.com/50';
          const isVisible = product.status === 'active';
          
          return `
            <tr>
              <td>${product.id || product.product_id || 'N/A'}</td>
              <td>${product.category_name || product.category || 'N/A'}</td>
              <td><img src="${imageUrl}" alt="Product" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;"></td>
              <td>${product.product_name || product.name || 'N/A'}</td>
              <td>${formatCurrency(product.price || 0)}</td>
              <td>
                <input type="checkbox" ${isVisible ? 'checked' : ''} 
                  onchange="toggleProductVisibility(${product.id || product.product_id}, this.checked)"
                  style="cursor: pointer; width: 18px; height: 18px;">
              </td>
              <td>
                <button class="btn btn-edit action-btn" onclick="showEditProductModal(${product.id || product.product_id})" title="Chỉnh sửa">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-delete action-btn" onclick="deleteProduct(${product.id || product.product_id})" title="Xóa">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          `;
        })
        .join('');
    })
    .catch((error) => {
      console.error('Error loading all products:', error);
      showNotification('Lỗi tải sản phẩm', 'error');
    });
}

/**
 * Load category filter options for all products page
 */
function loadAllProductsCategoryFilter() {
  getCategories()
    .then((response) => {
      if (!response.success) return;

      const select = document.querySelector('#allProductCategoryFilter');
      if (select) {
        select.innerHTML = '<option value="">Tất cả danh mục</option>' +
          response.data
            .map((cat) => `<option value="${cat.id}">${cat.name}</option>`)
            .join('');
      }
    })
    .catch((error) => console.error('Error loading categories:', error));
}

/**
 * Filter all products by category and search
 */
function filterAllProducts() {
  const searchText = document.querySelector('#allProductSearch')?.value || '';
  const categoryId = document.querySelector('#allProductCategoryFilter')?.value || '';

  getProducts()
    .then((response) => {
      if (!response.success) throw new Error(response.message);

      let filtered = response.data;

      // Filter by category
      if (categoryId) {
        filtered = filtered.filter(p => p.category_id === parseInt(categoryId));
      }

      // Filter by search text
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        filtered = filtered.filter(p => 
          (p.name || '').toLowerCase().includes(searchLower) ||
          (p.id || '').toString().includes(searchLower)
        );
      }

      const tbody = document.querySelector('#allProductsTable');
      if (!tbody) return;

      tbody.innerHTML = filtered
        .map((product) => {
          const imageUrl = product.image || 'https://via.placeholder.com/50';
          const isVisible = product.status === 'active';
          
          return `
            <tr>
              <td>${product.id || 'N/A'}</td>
              <td>${product.category || 'N/A'}</td>
              <td><img src="${imageUrl}" alt="Product" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;"></td>
              <td>${product.name || 'N/A'}</td>
              <td>${formatCurrency(product.price || 0)}</td>
              <td>
                <input type="checkbox" ${isVisible ? 'checked' : ''} 
                  onchange="toggleProductVisibility(${product.id}, this.checked)"
                  style="cursor: pointer; width: 18px; height: 18px;">
              </td>
              <td>
                <button class="btn btn-edit action-btn" onclick="showEditProductModal(${product.id})" title="Chỉnh sửa">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-delete action-btn" onclick="deleteProduct(${product.id})" title="Xóa">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          `;
        })
        .join('');
    })
    .catch((error) => {
      console.error('Error filtering products:', error);
      showNotification('Lỗi lọc sản phẩm', 'error');
    });
}

/**
 * Toggle product visibility (active/inactive)
 */
async function toggleProductVisibility(productId, isVisible) {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: isVisible ? 'active' : 'inactive'
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to update product: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.success) {
      showNotification(isVisible ? 'Hiển thị sản phẩm' : 'Ẩn sản phẩm', 'success');
      loadAllProductsTable();
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error toggling product visibility:', error);
    showNotification('Lỗi cập nhật sản phẩm', 'error');
    loadAllProductsTable();
  }
}

/**
 * Load product categories page
 */
// ========== ORDERS PAGE ==========

/**
 * Load Orders Page
 */
function loadOrdersPage() {
  console.log('Loading orders page...');
  loadOrdersTable();
}

/**
 * Load orders table
 */
let ordersData = [];
let currentOrdersPage = 1;
const ordersPerPage = 6;

function loadOrdersTable() {
  getOrders()
    .then((response) => {
      if (!response.success) {
        console.error('Failed to load orders:', response);
        return;
      }

      ordersData = response.data || [];
      updateOrdersTableBody(currentOrdersPage);
      updateOrdersPagination();
    })
    .catch((error) => console.error('Error loading orders:', error));
}

/**
 * Update only the orders table body (for refresh without losing filter/search state)
 */
function updateOrdersTableBody(pageNum) {
  const startIdx = (pageNum - 1) * ordersPerPage;
  const endIdx = startIdx + ordersPerPage;
  const pageData = ordersData.slice(startIdx, endIdx);

  const tbody = document.querySelector('#ordersTable');
  if (!tbody) return;

  const statusMap = {
    pending: 'Chờ xử lý',
    processing: 'Đang xử lý',
    shipped: 'Đã gửi',
    delivered: 'Đã giao',
    cancelled: 'Đã hủy',
  };

  const statusClass = {
    'Chờ xử lý': 'processing',
    'Đang xử lý': 'processing',
    'Đã gửi': 'shipped',
    'Đã giao': 'delivered',
    'Đã hủy': 'cancelled',
  };

  // Format datetime
  const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes} ${day}/${month}/${year}`;
  };

  // Get status
  const getStatus = (status) => {
    const normalized = (status || 'pending').toLowerCase();
    return statusMap[normalized] || status || 'Chờ xử lý';
  };

  tbody.innerHTML = pageData
    .map((order, idx) => {
      const status = getStatus(order.status);
      const statusBadgeClass = statusClass[status] || 'pending';
      const orderCode = order.order_code || order.id || `ĐH${startIdx + idx + 1}`;
      const customer = order.customer || order.customer_name || 'Khách hàng';
      const createdDate = formatDate(order.created_at || new Date());
      const totalAmount = order.total_amount || order.total || 0;

      return `
        <tr style="border-bottom: 1px solid #ddd; height: 60px; vertical-align: middle; cursor: pointer;" onclick="showOrderDetail(${idx}, ${startIdx})">
          <td style="padding: 12px; text-align: center; font-weight: 600; color: #333;">${startIdx + idx + 1}</td>
          <td style="padding: 12px; font-weight: 600; color: #333;">${orderCode}</td>
          <td style="padding: 12px;">${customer}</td>
          <td style="padding: 12px; font-size: 13px; color: #666;">
            <div>${createdDate.split(' ')[1]}</div>
            <div>${createdDate.split(' ')[0]}</div>
          </td>
          <td style="padding: 12px; text-align: center;">
            <span class="status-badge ${statusBadgeClass}" style="display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 500; border: 2px solid; background: white;">
              ${status}
            </span>
          </td>
          <td style="padding: 12px; text-align: center;">
            <span style="color: #666;">Chuyển khoản</span>
          </td>
          <td style="padding: 12px; text-align: center;">
            <button onclick="event.stopPropagation(); showOrderDetail(${idx}, ${startIdx})" style="background: none; border: none; cursor: pointer; font-size: 18px; color: #52c41a;">⋯</button>
          </td>
        </tr>
      `;
    })
    .join('');
}

/**
 * Display orders for specific page
 */
function displayOrdersPage(pageNum) {
  const startIdx = (pageNum - 1) * ordersPerPage;
  const endIdx = startIdx + ordersPerPage;
  const pageData = ordersData.slice(startIdx, endIdx);

  const tbody = document.querySelector('#ordersTable');
  if (!tbody) return;

  const statusMap = {
    pending: 'Chờ xử lý',
    processing: 'Đang xử lý',
    shipped: 'Đã gửi',
    delivered: 'Đã giao',
    cancelled: 'Đã hủy',
  };

  const statusClass = {
    'Chờ xử lý': 'processing',
    'Đang xử lý': 'processing',
    'Đã gửi': 'shipped',
    'Đã giao': 'delivered',
    'Đã hủy': 'cancelled',
  };

  // Format datetime
  const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes} ${day}/${month}/${year}`;
  };

  // Get status
  const getStatus = (status) => {
    const normalized = (status || 'pending').toLowerCase();
    return statusMap[normalized] || status || 'Chờ xử lý';
  };

  tbody.innerHTML = pageData
    .map((order, idx) => {
      const status = getStatus(order.status);
      const statusBadgeClass = statusClass[status] || 'pending';
      const orderCode = order.order_code || order.id || `ĐH${startIdx + idx + 1}`;
      const customer = order.customer || order.customer_name || 'Khách hàng';
      const createdDate = formatDate(order.created_at || new Date());
      const totalAmount = order.total_amount || order.total || 0;

      return `
        <tr style="border-bottom: 1px solid #ddd; height: 60px; vertical-align: middle; cursor: pointer;" onclick="showOrderDetail(${idx}, ${startIdx})">
          <td style="padding: 12px; text-align: center; font-weight: 600; color: #333;">${startIdx + idx + 1}</td>
          <td style="padding: 12px; font-weight: 600; color: #333;">${orderCode}</td>
          <td style="padding: 12px;">${customer}</td>
          <td style="padding: 12px; font-size: 13px; color: #666;">
            <div>${createdDate.split(' ')[1]}</div>
            <div>${createdDate.split(' ')[0]}</div>
          </td>
          <td style="padding: 12px; text-align: center;">
            <span class="status-badge ${statusBadgeClass}" style="display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 500; border: 2px solid; background: white;">
              ${status}
            </span>
          </td>
          <td style="padding: 12px; text-align: center;">
            <span style="color: #666;">Chuyển khoản</span>
          </td>
          <td style="padding: 12px; text-align: center;">
            <button onclick="event.stopPropagation(); showOrderDetail(${idx}, ${startIdx})" style="background: none; border: none; cursor: pointer; font-size: 18px; color: #52c41a;">⋯</button>
          </td>
        </tr>
      `;
    })
    .join('');
}

/**
 * Update orders pagination
 */
function updateOrdersPagination() {
  const totalPages = Math.ceil(ordersData.length / ordersPerPage);
  const paginationInfo = document.querySelector('#orderPaginationInfo');
  
  if (!paginationInfo) return;

  let pageNumbers = '';
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers += `<button onclick="goToOrdersPage(${i})" style="margin: 0 3px; ${i === currentOrdersPage ? 'background: #52c41a; color: white; border-color: #52c41a;' : ''}">${i}</button>`;
  }

  paginationInfo.innerHTML = pageNumbers;
}

/**
 * Go to specific orders page
 */
function goToOrdersPage(pageNum) {
  const totalPages = Math.ceil(ordersData.length / ordersPerPage);
  if (pageNum >= 1 && pageNum <= totalPages) {
    currentOrdersPage = pageNum;
    displayOrdersPage(pageNum);
    updateOrdersPagination();
  }
}

/**
 * Show order detail modal
 */
function showOrderDetail(pageIdx, startIdx) {
  const dataIdx = startIdx + pageIdx;
  const order = ordersData[dataIdx];
  
  if (!order) {
    console.error('Order not found');
    return;
  }

  const modal = document.getElementById('orderDetailModal');
  
  // Format date and time
  const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return { date: `${day}/${month}/${year}`, time: `${hours}:${minutes}` };
  };

  const dateObj = formatDate(order.created_at);
  const orderCode = order.order_code || order.id || `ĐH${dataIdx + 1}`;

  // Get status text
  const statusMap = {
    pending: 'Chờ xử lý',
    processing: 'Đang xử lý',
    shipped: 'Đã gửi',
    delivered: 'Đã giao',
    cancelled: 'Đã hủy',
  };
  const status = statusMap[(order.status || 'pending').toLowerCase()] || order.status || 'Chờ xử lý';

  // Fill order info
  document.getElementById('orderCode').textContent = orderCode;
  document.getElementById('orderDate').textContent = dateObj.date;
  document.getElementById('orderTime').textContent = dateObj.time;
  document.getElementById('orderStatus').textContent = status;

  // Fill customer info
  document.getElementById('customerName').textContent = order.customer || order.customer_name || 'Khách hàng';
  document.getElementById('customerAddress').textContent = order.address || 'Hoàng Diệu 2, TP. Thủ Đức';
  document.getElementById('customerPhone').textContent = order.phone || '0976 106 992';

  // Fill order items
  const itemsTable = document.getElementById('orderItemsTable');
  const items = order.items || [];
  
  let itemsHTML = '';
  let subtotal = 0;

  if (items.length > 0) {
    itemsHTML = items.map((item, idx) => {
      const price = item.price || 0;
      const qty = item.quantity || 1;
      const total = price * qty;
      subtotal += total;
      
      const image = item.image || item.product_image || '/images/raw/raw/default.png';
      const productName = item.product_name || item.name || 'Sản phẩm';

      return `
        <tr style="border-bottom: 1px solid #ddd; height: 80px;">
          <td style="padding: 12px; text-align: center;">
            <img src="${image}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">
          </td>
          <td style="padding: 12px;">${productName}</td>
          <td style="padding: 12px;">${formatCurrency(price)}</td>
          <td style="padding: 12px;">${qty}</td>
          <td style="padding: 12px;">${formatCurrency(total)}</td>
        </tr>
      `;
    }).join('');
  } else {
    itemsHTML = '<tr><td colspan="5" style="padding: 20px; text-align: center; color: #999;">Không có sản phẩm</td></tr>';
  }

  itemsTable.innerHTML = itemsHTML;

  // Fill summary
  const shippingFee = order.shipping_fee || 30000;
  const discount = order.discount || -25000;
  const totalAmount = order.total_amount || 0;

  document.getElementById('subtotal').textContent = formatCurrency(subtotal || totalAmount - shippingFee - discount);
  document.getElementById('shippingFee').textContent = formatCurrency(shippingFee);
  document.getElementById('discount').textContent = formatCurrency(discount);
  document.getElementById('totalAmount').textContent = formatCurrency(totalAmount);

  // Payment method
  const paymentMethods = ['Tiền mặt', 'Chuyển khoản', 'Thẻ tín dụng', 'Ví điện tử'];
  const paymentMethod = order.payment_method || paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
  document.getElementById('paymentMethod').textContent = paymentMethod;

  // Show modal
  modal.style.display = 'flex';
}

/**
 * Close order detail modal
 */
function closeOrderDetailModal() {
  const modal = document.getElementById('orderDetailModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

/**
 * Close modal by clicking outside
 */
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('orderDetailModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeOrderDetailModal();
      }
    });
  }
});

// ========== USERS PAGE ==========

/**
 * Load Users Page
 */
function loadUsersPage() {
  console.log('Loading users page...');
  loadUsersTable();
}

/**
 * Load users table
 */
let allUsersData = []; // Store all users for filtering
let allOrdersData = []; // Store all orders for counting

function loadUsersTable() {
  // First get all users
  getUsers()
    .then((usersResponse) => {
      if (!usersResponse.success) return;

      allUsersData = usersResponse.data || [];

      // Then get all orders to count per customer
      getOrders()
        .then((ordersResponse) => {
          allOrdersData = ordersResponse.data || [];
          
          // Display all users initially
          updateUsersTableBody(allUsersData, allOrdersData);
        })
        .catch((error) => console.error('Error loading orders:', error));
    })
    .catch((error) => console.error('Error loading users:', error));
}

/**
 * Update only the users table body (for refresh without losing filter/search state)
 */
function updateUsersTableBody(usersData, ordersData) {
  const tbody = document.querySelector('#usersTable');
  if (!tbody) return;

  tbody.innerHTML = usersData
    .map((user, idx) => {
      // Count orders for this user
      const userOrders = ordersData.filter(o => o.customer_id === user.user_id);
      const orderCount = userOrders.length;
      
      return `
        <tr>
          <td>${user.user_id || user.id || idx + 1}</td>
          <td>${user.full_name || user.username || 'N/A'}</td>
          <td>${user.email || 'N/A'}</td>
          <td>${user.phone || 'N/A'}</td>
          <td>${user.role || 'N/A'}</td>
          <td>${user.address || 'N/A'}</td>
          <td style="text-align: center; font-weight: 600;">${orderCount}</td>
        </tr>
      `;
    })
    .join('');
}

/**
 * Display users table with data
 */
function displayUsersTable(usersData, ordersData) {
  const tbody = document.querySelector('#usersTable');
  if (!tbody) return;

  tbody.innerHTML = usersData
    .map((user, idx) => {
      // Count orders for this user
      const userOrders = ordersData.filter(o => o.customer_id === user.user_id);
      const orderCount = userOrders.length;
      
      return `
        <tr>
          <td>${user.user_id || user.id || idx + 1}</td>
          <td>${user.full_name || user.username || 'N/A'}</td>
          <td>${user.email || 'N/A'}</td>
          <td>${user.phone || 'N/A'}</td>
          <td>${user.role || 'N/A'}</td>
          <td>${user.address || 'N/A'}</td>
          <td style="text-align: center; font-weight: 600;">${orderCount}</td>
        </tr>
      `;
    })
    .join('');
}

/**
 * Filter users by search and role
 */
function filterUsers() {
  const searchInput = document.getElementById('userSearch');
  const roleSelect = document.getElementById('userRoleFilter');
  
  if (!searchInput || !roleSelect) {
    console.error('Filter elements not found');
    return;
  }

  const searchValue = searchInput.value.toLowerCase().trim();
  const roleValue = roleSelect.value;

  // Filter users
  let filtered = allUsersData.filter(user => {
    // Filter by role
    if (roleValue && user.role !== roleValue) {
      return false;
    }

    // Filter by search (name, email, phone)
    if (searchValue) {
      const fullName = (user.full_name || '').toLowerCase();
      const email = (user.email || '').toLowerCase();
      const phone = (user.phone || '').toLowerCase();
      const username = (user.username || '').toLowerCase();

      return (
        fullName.includes(searchValue) ||
        email.includes(searchValue) ||
        phone.includes(searchValue) ||
        username.includes(searchValue)
      );
    }

    return true;
  });

  // Display filtered results
  updateUsersTableBody(filtered, allOrdersData);

  // Show result count
  console.log(`Tìm thấy ${filtered.length} khách hàng`);
}

/**
 * Auto filter when typing in search box (optional - real-time filter)
 */
document.addEventListener('DOMContentLoaded', () => {
  const userSearch = document.getElementById('userSearch');
  const userRoleFilter = document.getElementById('userRoleFilter');

  if (userSearch) {
    userSearch.addEventListener('keyup', () => {
      filterUsers();
    });
  }

  if (userRoleFilter) {
    userRoleFilter.addEventListener('change', () => {
      filterUsers();
    });
  }
});

/**
 * Edit user
 */
function editUser(userId) {
  console.log('Edit user:', userId);
}

// ========== CATEGORIES PAGE ==========


// ========== PROMOTIONS PAGE ==========

/**
 * Load Promotions Page
 */
function loadPromotionsPage() {
  console.log('Loading promotions page...');
  // Render the page UI first
  displayPromotionsTable([]);
  // Then load data from API
  loadPromotionsTable();
}

/**
 * Load promotions table
 */
let allPromotionsData = [];
let currentDisplayedPromotions = []; // Track currently displayed data (after filters)
let currentPromoSortField = null;
let currentPromoSortOrder = 'asc'; // 'asc' or 'desc'

function loadPromotionsTable() {
  getPromotions()
    .then((response) => {
      if (!response.success) {
        console.error('Failed to load promotions:', response);
        return;
      }

      allPromotionsData = response.data || [];
      currentDisplayedPromotions = [...allPromotionsData]; // Initialize displayed data
      
      // Only update table body, don't re-render entire page
      updatePromotionsTableBody(currentDisplayedPromotions);
      console.log('[loadPromotionsTable] Loaded', allPromotionsData.length, 'promotions');
    })
    .catch((error) => console.error('Error loading promotions:', error));
}

/**
 * Display promotions table with data
 */
function displayPromotionsTable(promotionsData) {
  const promotionsPage = document.querySelector('#promotionsPage');
  if (!promotionsPage) return;

  // Save current filter values before re-rendering
  const oldSearchInput = document.getElementById('promotionSearch');
  const currentSearchValue = oldSearchInput?.value || '';

  const pageHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h1 style="color: #333; font-size: 24px; margin: 0;">THÊM KHUYẾN MÃI</h1>
      <button class="btn btn-primary" onclick="addPromotion()" style="background: #52c41a; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">
        + Thêm khuyến mãi
      </button>
    </div>

    <div class="filter-bar" style="display: flex; gap: 10px; margin-bottom: 20px; align-items: center;">
      <input type="text" id="promotionSearch" placeholder="Tìm kiếm..." style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; flex: 1;">
      <button onclick="filterPromotions()" style="padding: 8px 16px; background: #52c41a; color: white; border: none; border-radius: 4px; cursor: pointer;">
        <i class="fas fa-search"></i>
      </button>
      <select id="promotionSortField" style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; background: white; cursor: pointer; min-width: 150px;">
        <option value="">Sắp xếp: Tất cả</option>
        <option value="category">Danh mục</option>
        <option value="code">Mã</option>
        <option value="status">Tình trạng</option>
        <option value="quantity">Số lượng</option>
        <option value="start_date">Bắt đầu</option>
        <option value="end_date">Kết thúc</option>
      </select>
    </div>

    <div class="table-card" style="background: #f0f8e6; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <table class="data-table" style="width: 100%; border-collapse: collapse;">
        <thead style="background: #c8e6c9;">
          <tr>
            <th style="padding: 12px; text-align: left; font-weight: 600; border-right: 1px solid #ddd;">STT</th>
            <th style="padding: 12px; text-align: left; font-weight: 600; border-right: 1px solid #ddd;">Danh mục</th>
            <th style="padding: 12px; text-align: left; font-weight: 600; border-right: 1px solid #ddd;">Mã</th>
            <th style="padding: 12px; text-align: left; font-weight: 600; border-right: 1px solid #ddd;">Tình trạng</th>
            <th style="padding: 12px; text-align: left; font-weight: 600; border-right: 1px solid #ddd;">Số lượng</th>
            <th style="padding: 12px; text-align: left; font-weight: 600; border-right: 1px solid #ddd;">Bắt đầu</th>
            <th style="padding: 12px; text-align: left; font-weight: 600; border-right: 1px solid #ddd;">Kết thúc</th>
            <th style="padding: 12px; text-align: center; font-weight: 600;">Hành động</th>
          </tr>
        </thead>
        <tbody id="promotionsTable" style="background: white;">
          <!-- Data will be inserted here -->
        </tbody>
      </table>
    </div>
  `;

  promotionsPage.innerHTML = pageHTML;

  // Restore previous filter values
  const newSearchInput = document.getElementById('promotionSearch');
  if (newSearchInput) newSearchInput.value = currentSearchValue;

  // Add event listeners AFTER rendering
  setTimeout(() => {
    const searchInput = document.getElementById('promotionSearch');
    const sortField = document.getElementById('promotionSortField');
    
    console.log('[displayPromotionsTable] Setting up event listeners');
    console.log('[displayPromotionsTable] searchInput found:', !!searchInput);
    console.log('[displayPromotionsTable] sortField found:', !!sortField);
    
    if (searchInput) {
      searchInput.addEventListener('keyup', () => {
        console.log('[EVENT] Search input changed - debouncing...');
        
        // Clear previous timeout
        clearTimeout(filterPromotionsTimeout);
        
        // Set new timeout - only filter after user stops typing for 300ms
        filterPromotionsTimeout = setTimeout(() => {
          console.log('[EVENT] Debounce done - executing filter');
          applyPromotionFilter();
        }, 300);
      });
    }

    if (sortField) {
      sortField.addEventListener('change', () => {
        const field = sortField.value;
        console.log('[EVENT] Sort field changed to:', field);
        if (field) {
          sortPromotions(field);
        } else {
          // Reset to original order
          currentDisplayedPromotions = [...currentDisplayedPromotions].sort((a, b) => 
            (a.promotion_id || 0) - (b.promotion_id || 0)
          );
          updatePromotionsTableBody(currentDisplayedPromotions);
        }
      });
    }
  }, 10);

  // Render table data
  const tbody = document.querySelector('#promotionsTable');
  if (tbody) {
    tbody.innerHTML = promotionsData
      .map((promo, idx) => {
        const statusColor = promo.status === 'On Sales' ? '#52c41a' : '#ff4d4f';
        const statusBgColor = promo.status === 'On Sales' ? '#f6ffed' : '#fff1f0';
        
        return `
          <tr style="border-bottom: 1px solid #ddd; background: #f9fdf7;">
            <td style="padding: 12px; text-align: center; font-weight: 600;">${idx + 1}</td>
            <td style="padding: 12px;">
              <div style="font-size: 13px; color: #333;">${promo.category}</div>
              <div style="font-size: 12px; color: #999;">${promo.description}</div>
            </td>
            <td style="padding: 12px; font-size: 13px; color: #333;">${promo.code}</td>
            <td style="padding: 12px;">
              <span style="display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 500; background: ${statusBgColor}; color: ${statusColor}; border: 1px solid ${statusColor};">
                ${promo.status}
              </span>
            </td>
            <td style="padding: 12px; text-align: center; font-size: 13px;">${promo.quantity_used}/${promo.quantity_limit}</td>
            <td style="padding: 12px; text-align: center; font-size: 13px;">${promo.start_date}</td>
            <td style="padding: 12px; text-align: center; font-size: 13px;">${promo.end_date}</td>
            <td style="padding: 12px; text-align: center;">
              <button onclick="editPromotion(${promo.promotion_id})" style="background: none; border: none; cursor: pointer; font-size: 16px; color: #52c41a; margin-right: 8px;">
                <i class="fas fa-edit"></i>
              </button>
              <button onclick="deletePromotionConfirm(${promo.promotion_id})" style="background: none; border: none; cursor: pointer; font-size: 16px; color: #ff4d4f;">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          </tr>
        `;
      })
      .join('');
  }
}

// Debounce timer for search
let filterPromotionsTimeout;

/**
 * Filter promotions by search and category (called by debounce)
 * Does NOT re-render the search inputs
 */
function applyPromotionFilter() {
  const searchInput = document.getElementById('promotionSearch');
  
  if (!searchInput) {
    console.warn('[applyPromotionFilter] Search input not found');
    return;
  }

  const searchValue = searchInput.value.toLowerCase().trim();

  console.log('[applyPromotionFilter] Search:', searchValue);

  let filtered = allPromotionsData.filter(promo => {
    // Filter by search (code, description, category)
    if (searchValue) {
      const code = (promo.code || '').toLowerCase();
      const description = (promo.description || '').toLowerCase();
      const category = (promo.category || '').toLowerCase();

      return code.includes(searchValue) || 
             description.includes(searchValue) || 
             category.includes(searchValue);
    }

    return true;
  });

  console.log('[applyPromotionFilter] Found', filtered.length, 'promotions');

  // Update current displayed data
  currentDisplayedPromotions = filtered;
  
  // Reset sort field when filtering
  currentPromoSortField = null;
  currentPromoSortOrder = 'asc';
  
  // Update table only, keep inputs intact
  updatePromotionsTableBody(currentDisplayedPromotions);
}

/**
 * Update only the table body without re-rendering the entire page
 */
function updatePromotionsTableBody(promotionsData) {
  const tbody = document.querySelector('#promotionsTable');
  if (!tbody) return;

  tbody.innerHTML = promotionsData
    .map((promo, idx) => {
      const statusColor = promo.status === 'On Sales' ? '#52c41a' : '#ff4d4f';
      const statusBgColor = promo.status === 'On Sales' ? '#f6ffed' : '#fff1f0';
      
      return `
        <tr style="border-bottom: 1px solid #ddd; background: #f9fdf7;">
          <td style="padding: 12px; text-align: center; font-weight: 600;">${idx + 1}</td>
          <td style="padding: 12px;">
            <div style="font-size: 13px; color: #333;">${promo.category}</div>
            <div style="font-size: 12px; color: #999;">${promo.description}</div>
          </td>
          <td style="padding: 12px; font-size: 13px; color: #333;">${promo.code}</td>
          <td style="padding: 12px;">
            <span style="display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 500; background: ${statusBgColor}; color: ${statusColor}; border: 1px solid ${statusColor};">
              ${promo.status}
            </span>
          </td>
          <td style="padding: 12px; text-align: center; font-size: 13px;">${promo.quantity_used}/${promo.quantity_limit}</td>
          <td style="padding: 12px; text-align: center; font-size: 13px;">${promo.start_date}</td>
          <td style="padding: 12px; text-align: center; font-size: 13px;">${promo.end_date}</td>
          <td style="padding: 12px; text-align: center;">
            <button onclick="editPromotion(${promo.promotion_id})" style="background: none; border: none; cursor: pointer; font-size: 16px; color: #52c41a; margin-right: 8px;">
              <i class="fas fa-edit"></i>
            </button>
            <button onclick="deletePromotionConfirm(${promo.promotion_id})" style="background: none; border: none; cursor: pointer; font-size: 16px; color: #ff4d4f;">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
    })
    .join('');
}

/**
 * Filter promotions by search
 */
function filterPromotions() {
  const searchInput = document.getElementById('promotionSearch');
  
  if (!searchInput) {
    console.warn('[filterPromotions] Search input not found');
    return;
  }

  const searchValue = searchInput.value.toLowerCase().trim();

  console.log('[filterPromotions] Search:', searchValue);

  let filtered = allPromotionsData.filter(promo => {
    // Filter by search (code, description, category)
    if (searchValue) {
      const code = (promo.code || '').toLowerCase();
      const description = (promo.description || '').toLowerCase();
      const category = (promo.category || '').toLowerCase();

      return code.includes(searchValue) || 
             description.includes(searchValue) || 
             category.includes(searchValue);
    }

    return true;
  });

  console.log('[filterPromotions] Found', filtered.length, 'promotions');

  // Update current displayed data
  currentDisplayedPromotions = filtered;
  
  // Reset sort field when filtering
  currentPromoSortField = null;
  currentPromoSortOrder = 'asc';
  
  // Update table body only, don't re-render entire page
  updatePromotionsTableBody(currentDisplayedPromotions);
}

/**
 * Sort promotions by field
 */
function sortPromotions(field) {
  console.log('[sortPromotions] Sorting by', field, 'Current order:', currentPromoSortOrder);

  // Toggle sort order if same field, otherwise default to asc
  if (currentPromoSortField === field) {
    currentPromoSortOrder = currentPromoSortOrder === 'asc' ? 'desc' : 'asc';
  } else {
    currentPromoSortField = field;
    currentPromoSortOrder = 'asc';
  }

  let sorted = [...currentDisplayedPromotions]; // Sort the current displayed data, not all data

  sorted.sort((a, b) => {
    let aVal = a[field];
    let bVal = b[field];

    // Handle promotion_id field (map 'id' to 'promotion_id')
    if (field === 'id') {
      aVal = a.promotion_id || 0;
      bVal = b.promotion_id || 0;
    }

    // Handle numeric fields
    if (field === 'promotion_id' || field === 'quantity_used' || field === 'quantity_limit') {
      aVal = parseInt(aVal) || 0;
      bVal = parseInt(bVal) || 0;
    }

    // Handle quantity field (sort by quantity_used)
    if (field === 'quantity') {
      aVal = parseInt(a.quantity_used) || 0;
      bVal = parseInt(b.quantity_used) || 0;
    }

    // Handle date fields (convert from DD/MM/YY to comparable format)
    if (field === 'start_date' || field === 'end_date') {
      try {
        const aParts = (aVal || '').split('/');
        const bParts = (bVal || '').split('/');
        
        // Convert DD/MM/YY to date object
        if (aParts.length === 3 && bParts.length === 3) {
          const aYear = parseInt(aParts[2]) + (parseInt(aParts[2]) < 50 ? 2000 : 1900);
          const bYear = parseInt(bParts[2]) + (parseInt(bParts[2]) < 50 ? 2000 : 1900);
          
          aVal = new Date(aYear, parseInt(aParts[1]) - 1, parseInt(aParts[0]));
          bVal = new Date(bYear, parseInt(bParts[1]) - 1, parseInt(bParts[0]));
        }
      } catch (e) {
        console.error('[sortPromotions] Error parsing dates:', e);
        aVal = new Date(0);
        bVal = new Date(0);
      }
    }

    // String comparison
    if (typeof aVal === 'string') {
      aVal = (aVal || '').toLowerCase();
      bVal = (bVal || '').toLowerCase();
      const result = aVal.localeCompare(bVal);
      return currentPromoSortOrder === 'asc' ? result : -result;
    }

    // Date comparison
    if (aVal instanceof Date && bVal instanceof Date) {
      return currentPromoSortOrder === 'asc' 
        ? aVal - bVal 
        : bVal - aVal;
    }

    // Numeric comparison
    return currentPromoSortOrder === 'asc' 
      ? aVal - bVal 
      : bVal - aVal;
  });

  console.log('[sortPromotions] Sorted:', sorted.length, 'items, order:', currentPromoSortOrder);
  
  currentDisplayedPromotions = sorted;
  updatePromotionsTableBody(currentDisplayedPromotions);
}

/**
 * Delete promotion with confirmation
 */
function deletePromotionConfirm(promotionId) {
  if (confirm('Bạn chắc chắn muốn xóa khuyến mãi này?')) {
    deletePromotion(promotionId);
  }
}

/**
 * Add promotion
 */
function addPromotion() {
  console.log('Add promotion');
  showPromotionModal(null);
}

/**
 * Edit promotion
 */
function editPromotion(promotionId) {
  console.log('Edit promotion:', promotionId);
  const promo = allPromotionsData.find(p => p.promotion_id === promotionId);
  if (promo) {
    showPromotionModal(promo);
  }
}

/**
 * Show promotion modal (add/edit)
 */
function showPromotionModal(promo) {
  const isEdit = !!promo;
  const isChecked = promo?.status === 'On Sales';
  const modalHTML = `
    <div class="modal" id="promotionModal" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center;">
      <div style="background: #e8f5e9; border-radius: 8px; max-width: 900px; width: 90%; max-height: 90vh; overflow-y: auto; padding: 30px;">
        <h1 style="text-align: center; color: #558b2f; margin-bottom: 30px; font-size: 28px; font-weight: 600;">
          ${isEdit ? 'CHỈNH SỬA MÃ KHUYẾN MÃI' : 'THÊM MÃ KHUYẾN MÃI'}
        </h1>

        <form id="promotionForm" style="display: grid; gap: 20px;">
          <!-- Mã khuyến mãi -->
          <div>
            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">Mã khuyến mãi</label>
            <input type="text" id="promoCode" placeholder="Nhập mã khuyến mãi" value="${promo?.code || ''}" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
          </div>

          <!-- Trạng thái -->
          <div>
            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">Trạng thái</label>
            <div style="display: flex; align-items: center; gap: 10px;">
              <input type="checkbox" id="promoStatus" ${isChecked ? 'checked' : ''} style="width: 50px; height: 24px; cursor: pointer; accent-color: #52c41a;">
              <span id="statusLabel" style="font-weight: 600; color: #333; font-size: 14px;">${isChecked ? 'Hiển thị mã trên website' : 'Ẩn'}</span>
            </div>
          </div>

          <!-- Mô tả -->
          <div>
            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">Mô tả</label>
            <textarea id="promoDescription" placeholder="Nhập mô tả" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; min-height: 100px; font-family: Arial;">${promo?.description || ''}</textarea>
          </div>

          <!-- Từ và Đến -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">Từ</label>
              <input type="datetime-local" id="promoStartDate" value="${promo ? formatDateTimeForInput(promo.start_date) : ''}" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
            </div>
            <div>
              <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">Đến</label>
              <input type="datetime-local" id="promoEndDate" value="${promo ? formatDateTimeForInput(promo.end_date) : ''}" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
            </div>
          </div>

          <!-- Loại mã khuyến mãi -->
          <div>
            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">Loại mã khuyến mãi</label>
            <select id="promoCategory" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
              <option value="Mã giảm giá" ${promo?.category === 'Mã giảm giá' ? 'selected' : ''}>Mã giảm giá</option>
              <option value="Ưu đãi phí vận chuyển" ${promo?.category === 'Ưu đãi phí vận chuyển' ? 'selected' : ''}>Ưu đãi phí vận chuyển</option>
            </select>
          </div>

          <!-- Số lượng và Mức giảm -->
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; align-items: flex-end;">
            <div>
              <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">Số lượng</label>
              <input type="number" id="promoQuantity" placeholder="0" value="${promo?.quantity_limit || 0}" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
            </div>
            <div>
              <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">Mức giảm</label>
              <input type="number" id="promoDiscount" placeholder="0" value="0" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
            </div>
            <div>
              <select style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
                <option>%</option>
                <option>VNĐ</option>
              </select>
            </div>
          </div>

          <!-- Buttons -->
          <div style="display: flex; justify-content: center; gap: 15px; margin-top: 20px;">
            <button type="button" onclick="closePromotionModal()" style="padding: 12px 40px; background: #ddd; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 16px;">Hủy bỏ</button>
            <button type="button" onclick="savePromotion(${isEdit ? promo.promotion_id : 'null'})" style="padding: 12px 40px; background: #52c41a; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 16px;">Lưu</button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Remove old modal if exists
  const oldModal = document.getElementById('promotionModal');
  if (oldModal) oldModal.remove();

  // Add new modal to body
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // Setup status toggle listener
  setTimeout(() => {
    const statusCheckbox = document.getElementById('promoStatus');
    const statusLabel = document.getElementById('statusLabel');
    if (statusCheckbox && statusLabel) {
      statusCheckbox.addEventListener('change', () => {
        statusLabel.textContent = statusCheckbox.checked ? 'Hiển thị mã trên website' : 'Ẩn';
      });
    }
  }, 10);
}

/**
 * Format date from DD/MM/YY to datetime-local format (YYYY-MM-DDTHH:mm)
 */
function formatDateTimeForInput(dateStr) {
  if (!dateStr) return '';
  // Expected format: "01/01/2025 8:30 AM" or "DD/MM/YY"
  try {
    const parts = dateStr.split(' ');
    const datePart = parts[0]; // DD/MM/YY
    const dateParts = datePart.split('/');
    
    let day = dateParts[0];
    let month = dateParts[1];
    let year = dateParts[2];
    
    // Convert YY to YYYY
    if (year < 50) {
      year = '20' + year;
    } else {
      year = '19' + year;
    }
    
    // Format as YYYY-MM-DD
    return `${year}-${month}-${day}`;
  } catch (e) {
    return '';
  }
}

/**
 * Save promotion (create or update)
 */
function savePromotion(promotionId) {
  const code = document.getElementById('promoCode').value.trim();
  const description = document.getElementById('promoDescription').value.trim();
  const startDate = document.getElementById('promoStartDate').value;
  const endDate = document.getElementById('promoEndDate').value;
  const category = document.getElementById('promoCategory').value;
  const quantity = parseInt(document.getElementById('promoQuantity').value) || 0;
  const status = document.getElementById('promoStatus').checked ? 'On Sales' : 'Expired';

  // Validation
  if (!code) {
    alert('Vui lòng nhập mã khuyến mãi');
    return;
  }
  if (!description) {
    alert('Vui lòng nhập mô tả');
    return;
  }
  if (!startDate || !endDate) {
    alert('Vui lòng chọn ngày bắt đầu và kết thúc');
    return;
  }

  const promotionData = {
    code,
    description,
    start_date: formatDateForDisplay(startDate),
    end_date: formatDateForDisplay(endDate),
    category,
    quantity_limit: quantity,
    quantity_used: 0,
    status,
  };

  if (promotionId) {
    // Edit
    updatePromotionAPI(promotionId, promotionData);
  } else {
    // Add
    createPromotionAPI(promotionData);
  }
}

/**
 * Format date from datetime-local format to DD/MM/YY
 */
function formatDateForDisplay(dateStr) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  } catch (e) {
    return dateStr;
  }
}

/**
 * Close promotion modal
 */
function closePromotionModal() {
  const modal = document.getElementById('promotionModal');
  if (modal) modal.remove();
}

/**
 * Create promotion via API
 */
async function createPromotionAPI(promotionData) {
  try {
    const response = await createPromotion(promotionData);
    if (response.success) {
      alert('Thêm khuyến mãi thành công');
      closePromotionModal();
      loadPromotionsTable();
    } else {
      alert('Lỗi: ' + (response.message || 'Thêm khuyến mãi thất bại'));
    }
  } catch (error) {
    console.error('Error creating promotion:', error);
    alert('Lỗi: ' + error.message);
  }
}

/**
 * Update promotion via API
 */
async function updatePromotionAPI(promotionId, promotionData) {
  try {
    const response = await updatePromotion(promotionId, promotionData);
    if (response.success) {
      alert('Cập nhật khuyến mãi thành công');
      closePromotionModal();
      loadPromotionsTable();
    } else {
      alert('Lỗi: ' + (response.message || 'Cập nhật khuyến mãi thất bại'));
    }
  } catch (error) {
    console.error('Error updating promotion:', error);
    alert('Lỗi: ' + error.message);
  }
}


// ========== BLOGS PAGE ==========

/**
 * Load Blogs Page
 */
function loadBlogsPage() {
  console.log('Loading blogs page...');
  displayBlogsPage([]);
  loadBlogsTable();
}

/**
 * Display blogs page HTML structure
 */
function displayBlogsPage(blogsData) {
  const blogsPage = document.querySelector('#blogsPage');
  if (!blogsPage) return;

  const pageHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h1 style="color: #333; font-size: 24px; margin: 0;">QUẢN LÝ BÀI VIẾT</h1>
      <button class="btn btn-primary" onclick="addBlog()" style="background: #52c41a; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">
        + Thêm bài viết
      </button>
    </div>

    <div class="filter-bar" style="display: flex; gap: 10px; margin-bottom: 20px; align-items: center;">
      <input type="text" id="blogSearch" placeholder="Tìm kiếm bài viết..." style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; flex: 1;">
      <button onclick="searchBlogs()" style="padding: 8px 16px; background: #52c41a; color: white; border: none; border-radius: 4px; cursor: pointer;">
        <i class="fas fa-search"></i>
      </button>
    </div>

    <div class="table-card" style="background: #f0f8e6; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <table class="data-table" style="width: 100%; border-collapse: collapse;">
        <thead style="background: #c8e6c9;">
          <tr>
            <th style="padding: 12px; text-align: center; font-weight: 600; border-right: 1px solid #ddd;">STT</th>
            <th style="padding: 12px; text-align: left; font-weight: 600; border-right: 1px solid #ddd;">ID</th>
            <th style="padding: 12px; text-align: center; font-weight: 600; border-right: 1px solid #ddd;">Ngày</th>
            <th style="padding: 12px; text-align: left; font-weight: 600; border-right: 1px solid #ddd;">Danh mục</th>
            <th style="padding: 12px; text-align: left; font-weight: 600; border-right: 1px solid #ddd;">Tiêu đề</th>
            <th style="padding: 12px; text-align: center; font-weight: 600; border-right: 1px solid #ddd;">Hiển thị</th>
            <th style="padding: 12px; text-align: center; font-weight: 600;">Hành động</th>
          </tr>
        </thead>
        <tbody id="blogsTable" style="background: white;">
          <!-- Data will be inserted here -->
        </tbody>
      </table>
    </div>
  `;

  blogsPage.innerHTML = pageHTML;
}

/**
 * Load blogs table
 */
let allBlogsData = [];

function loadBlogsTable() {
  // Fetch blogs from API
  fetchBlogsFromAPI();
}

/**
 * Fetch blogs from API endpoint
 * Optional: filter by admin_id if provided
 */
function fetchBlogsFromAPI(adminId = null) {
  console.log('🔄 Fetching blogs from API...', { adminId });
  
  // Build query string
  let url = '/api/admin/blogs';
  if (adminId) {
    url += `?admin_id=${adminId}`;
  }
  
  fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('✅ Blogs loaded from API:', data);
      
      // Handle different response formats
      if (data.data && Array.isArray(data.data)) {
        allBlogsData = data.data;
      } else if (Array.isArray(data)) {
        allBlogsData = data;
      } else {
        console.warn('⚠️ Unexpected API response format:', data);
        allBlogsData = [];
      }
      
      updateBlogsTableBody(allBlogsData);
    })
    .catch(error => {
      console.error('❌ Error fetching blogs:', error);
      // Fallback to empty data if API fails
      allBlogsData = [];
      updateBlogsTableBody([]);
      showNotification('Lỗi khi tải danh sách bài viết', 'error');
    });
}

/**
 * Update only the blogs table body (for refresh without losing filter state)
 */
function updateBlogsTableBody(blogsData) {
  const tbody = document.querySelector('#blogsTable');
  if (!tbody) return;

  tbody.innerHTML = blogsData
    .map((blog, idx) => {
      // Handle both blog_id from API and id from local storage
      const blogId = blog.blog_id || blog.id;
      const adminName = getUserNameById(blog.admin_id);
      const isPublished = blog.published !== false || blog.status === 'published' || blog.status === 'active';
      const checkColor = isPublished ? '#52c41a' : '#ccc';
      const createdDate = blog.created_at ? new Date(blog.created_at).toLocaleDateString('vi-VN') : (blog.date || 'N/A');
      
      return `
      <tr style="border-bottom: 1px solid #ddd; background: #f9fdf7;">
        <td style="padding: 12px; text-align: center; font-weight: 600;">${idx + 1}</td>
        <td style="padding: 12px; font-size: 13px; color: #333; font-weight: 500;" title="Admin ID: ${blog.admin_id}">${adminName}</td>
        <td style="padding: 12px; text-align: center; font-size: 13px; color: #666;">${createdDate}</td>
        <td style="padding: 12px; font-size: 13px; color: #666;">${blog.category || 'Chung'}</td>
        <td style="padding: 12px;">
          <div style="font-size: 13px; color: #333; font-weight: 500;">${blog.title}</div>
        </td>
        <td style="padding: 12px; text-align: center;">
          <button onclick="toggleBlogVisibility(${blogId}, '${blog.status || 'active'}')" style="background: none; border: none; cursor: pointer; font-size: 20px; color: ${checkColor}; transition: all 0.3s ease;" title="${isPublished ? 'Ẩn bài viết' : 'Hiển thị bài viết'}">
            <i class="fas fa-check-circle"></i>
          </button>
        </td>
        <td style="padding: 12px; text-align: center;">
          <button onclick="editBlog(${blogId})" style="background: none; border: none; cursor: pointer; font-size: 16px; color: #52c41a; margin-right: 12px; transition: all 0.2s ease;" title="Sửa bài viết">
            <i class="fas fa-edit"></i>
          </button>
          <button onclick="deleteBlogConfirm(${blogId})" style="background: none; border: none; cursor: pointer; font-size: 16px; color: #ff4d4f; transition: all 0.2s ease;" title="Xóa bài viết">
            <i class="fas fa-times-circle"></i>
          </button>
        </td>
      </tr>
    `;
    })
    .join('');
}

/**
 * Search blogs
 */
function searchBlogs() {
  const searchInput = document.getElementById('blogSearch');
  if (!searchInput) return;

  const searchValue = searchInput.value.toLowerCase().trim();
  console.log('[searchBlogs] Search value:', searchValue);

  // In a real app, this would filter the blogs data
  // For now, just reload with filter applied
  loadBlogsTable();
}

/**
 * Add blog
 */
function addBlog() {
  console.log('Add blog');
  showAddBlogModal();
}

/**
 * Show add blog modal (called from button)
 */
function showAddBlogModal() {
  console.log('%c🔵 showAddBlogModal() called', 'color: #52c41a; font-weight: bold;');
  
  const modal = document.getElementById('blogModal');
  console.log('Modal element:', modal);
  
  if (!modal) {
    console.error('❌ Blog modal not found with ID "blogModal"');
    alert('Lỗi: Không tìm thấy modal (ID: blogModal)');
    return;
  }
  
  const form = document.getElementById('blogForm');
  console.log('Form element:', form);
  
  if (!form) {
    console.error('❌ Blog form not found with ID "blogForm"');
    return;
  }
  
  const title = document.getElementById('blogModalTitle');
  console.log('Title element:', title);
  
  try {
    // Clear form
    console.log('🔄 Resetting form...');
    form.reset();
    
    // Clear image
    console.log('🖼️ Clearing image...');
    clearBlogImage();
    
    // Set title
    if (title) {
      title.textContent = 'THÊM BÀI VIẾT';
      console.log('✅ Title set to: THÊM BÀI VIẾT');
    }
    
    // Clear blog ID
    form.dataset.blogId = '';
    console.log('✅ Blog ID cleared');
    
    // Show modal by adding 'show' class (CSS has #blogModal.show { display: flex !important; })
    console.log('📺 Adding show class to modal');
    modal.classList.add('show');
    
    console.log('%c✅ Blog modal opened successfully for adding', 'color: #52c41a; font-weight: bold;');
  } catch (error) {
    console.error('❌ Error in showAddBlogModal():', error);
    alert('Lỗi: ' + error.message);
  }
}

/**
 * Toggle blog visibility (published/draft)
 */
function toggleBlogVisibility(blogId, currentStatus) {
  console.log('🔄 Toggle blog visibility:', blogId, 'Current status:', currentStatus);
  
  // Determine new status
  const isCurrentlyActive = currentStatus === 'active' || currentStatus === 'published';
  const newStatus = isCurrentlyActive ? 'draft' : 'active';
  
  console.log(`📝 Changing status from '${currentStatus}' to '${newStatus}'`);
  
  // Send update to API
  const blogData = {
    status: newStatus
  };
  
  fetch(`/api/admin/blogs/${blogId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(blogData)
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('✅ Blog status updated successfully:', data);
      
      // Reload blogs table to reflect the change
      fetchBlogsFromAPI();
      
      // Show success notification
      showNotification(`Bài viết đã được ${newStatus === 'draft' ? 'ẩn' : 'hiển thị'}`, 'success');
    })
    .catch(error => {
      console.error('❌ Error toggling blog visibility:', error);
      showNotification('Lỗi khi cập nhật trạng thái bài viết: ' + error.message, 'error');
    });
}

/**
 * Edit blog
 */
function editBlog(blogId) {
  console.log('✏️ Edit blog:', blogId);
  const blog = allBlogsData.find(b => b.blog_id === blogId || b.id === blogId);
  if (blog) {
    console.log('✅ Found blog to edit:', blog);
    showEditBlogModal(blog);
  } else {
    console.warn('⚠️ Blog not found:', blogId);
    alert('Không tìm thấy bài viết');
  }
}

/**
 * Show edit blog modal
 */
function showEditBlogModal(blog) {
  console.log('📝 Show edit blog modal for:', blog.id || blog.blog_id);
  
  const modal = document.getElementById('blogModal');
  const form = document.getElementById('blogForm');
  const title = document.getElementById('blogModalTitle');
  
  if (!modal || !form) {
    console.error('❌ Blog modal or form not found');
    return;
  }
  
  // Reset form
  form.reset();
  
  // Populate form fields with blog data
  const titleInput = document.getElementById('blogTitle');
  const categoryInput = document.getElementById('blogCategory');
  const publishedInput = document.getElementById('blogPublished');
  const summaryInput = document.getElementById('blogSummary');
  const contentInput = document.getElementById('blogContent');
  
  if (titleInput) titleInput.value = blog.title || '';
  if (categoryInput) categoryInput.value = blog.category || '';
  
  // Check if blog is published - handle both 'published' and 'status' fields
  if (publishedInput) {
    // Check if blog should be published: not explicitly unpublished AND not in draft status
    const isPublished = (blog.published !== false) && (blog.status !== 'draft');
    console.log('📋 Setting published checkbox:', { 
      isPublished, 
      blog_published: blog.published, 
      blog_status: blog.status,
      check: `published=${blog.published} && status=${blog.status}`
    });
    publishedInput.checked = isPublished;
  }
  
  if (summaryInput) summaryInput.value = blog.summary || '';
  if (contentInput) contentInput.value = blog.content || '';
  
  // Store blog ID in form for later use
  form.dataset.blogId = blog.blog_id || blog.id;
  
  // Set modal title
  if (title) {
    title.textContent = 'CẬP NHẬT BÀI VIẾT';
  }
  
  // Show modal by adding 'show' class
  modal.classList.add('show');
  console.log('✅ Edit blog modal opened with ID:', form.dataset.blogId);
}

/**
 * Close blog modal
 */
function closeBlogModal() {
  const modal = document.getElementById('blogModal');
  if (modal) {
    modal.classList.remove('show');
  }
}

/**
 * Handle blog image selection from input
 */
function handleBlogImageSelect(event) {
  const file = event.target.files[0];
  if (file) {
    previewBlogImage(file);
  }
}

/**
 * Handle blog image drop
 */
function handleBlogImageDrop(event) {
  event.preventDefault();
  event.stopPropagation();
  
  const files = event.dataTransfer.files;
  if (files.length > 0) {
    const file = files[0];
    if (file.type.startsWith('image/')) {
      previewBlogImage(file);
    } else {
      alert('Vui lòng chọn tệp ảnh');
    }
  }
}

/**
 * Preview blog image
 */
function previewBlogImage(file) {
  // Check file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    alert('Kích thước ảnh không được vượt quá 5MB');
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const imgElement = document.getElementById('blogImageImg');
    const preview = document.getElementById('blogImagePreview');
    const form = document.getElementById('blogForm');
    
    if (imgElement) {
      imgElement.src = e.target.result;
    }
    if (preview) {
      preview.style.display = 'block';
    }
    if (form) {
      form.dataset.imageData = e.target.result;
    }
    
    console.log('Image preview loaded');
  };
  reader.readAsDataURL(file);
}

/**
 * Clear blog image
 */
function clearBlogImage() {
  const fileInput = document.getElementById('blogImage');
  if (fileInput) {
    fileInput.value = '';
  }
  const preview = document.getElementById('blogImagePreview');
  if (preview) {
    preview.style.display = 'none';
  }
  const form = document.getElementById('blogForm');
  if (form) {
    form.dataset.imageData = '';
  }
}

/**
 * Save blog (add or edit) - sends to API
 */
function saveBlog(event) {
  event.preventDefault();
  console.log('💾 saveBlog() called - form submitted');
  console.log('  Event target:', event.target.id);
  console.log('  Form dataset:', event.target.dataset);
  
  const form = event.target;
  const blogId = form.dataset.blogId || '';
  
  console.log('📋 blogId from dataset:', blogId, 'Type:', typeof blogId);
  
  const title = document.getElementById('blogTitle').value.trim();
  const category = document.getElementById('blogCategory').value;
  const published = document.getElementById('blogPublished').checked;
  const summary = document.getElementById('blogSummary').value.trim();
  const content = document.getElementById('blogContent').value.trim();
  
  console.log('� Form fields retrieved:', { 
    titleLength: title.length,
    categoryLength: category.length, 
    published, 
    summaryLength: summary.length, 
    contentLength: content.length 
  });
  
  if (!title || !category || !summary || !content) {
    console.warn('⚠️ Validation failed - missing required fields');
    console.warn('  title empty:', !title);
    console.warn('  category empty:', !category);
    console.warn('  summary empty:', !summary);
    console.warn('  content empty:', !content);
    alert('Vui lòng điền đầy đủ thông tin bài viết');
    return;
  }

  const blogData = {
    title,
    category,
    published,
    summary,
    content,
    status: published ? 'active' : 'draft'
  };

  console.log('📝 Saving blog:', { blogId, isUpdate: !!blogId, ...blogData });

  if (blogId) {
    // Update existing blog via API
    console.log('🔄 Calling updateBlogViaAPI with ID:', blogId);
    updateBlogViaAPI(Number.parseInt(blogId), blogData);
  } else {
    // Create new blog via API
    console.log('➕ Calling createBlogViaAPI');
    createBlogViaAPI(blogData);
  }
}

/**
 * Create blog via API
 */
function createBlogViaAPI(blogData) {
  console.log('🆕 Creating blog via API...');
  
  fetch('/api/admin/blogs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(blogData)
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('✅ Blog created successfully:', data);
      
      // Reload blogs table
      fetchBlogsFromAPI();
      
      // Close modal
      closeBlogModal();
      
      // Show success message
      showNotification('Thêm bài viết thành công', 'success');
    })
    .catch(error => {
      console.error('❌ Error creating blog:', error);
      showNotification('Lỗi khi thêm bài viết: ' + error.message, 'error');
    });
}

/**
 * Update blog via API
 */
function updateBlogViaAPI(blogId, blogData) {
  console.log('✏️ Updating blog via API...');
  console.log('  Blog ID:', blogId);
  console.log('  Data:', blogData);
  
  fetch(`/api/admin/blogs/${blogId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(blogData)
  })
    .then(response => {
      console.log('📡 Response status:', response.status, response.statusText);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('✅ Blog updated successfully:', data);
      
      // Reload blogs table
      fetchBlogsFromAPI();
      
      // Close modal
      closeBlogModal();
      
      // Show success message
      showNotification('Cập nhật bài viết thành công', 'success');
    })
    .catch(error => {
      console.error('❌ Error updating blog:', error);
      showNotification('Lỗi khi cập nhật bài viết: ' + error.message, 'error');
    });
}

/**
 * Delete blog with confirmation via API
 */
function deleteBlogConfirm(blogId) {
  if (confirm('Bạn chắc chắn muốn xóa bài viết này?')) {
    console.log('🗑️ Deleting blog:', blogId);
    deleteBlogViaAPI(blogId);
  }
}

/**
 * Delete blog via API
 */
function deleteBlogViaAPI(blogId) {
  console.log('🗑️ Deleting blog via API...', blogId);
  
  fetch(`/api/admin/blogs/${blogId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('✅ Blog deleted successfully:', data);
      
      // Reload blogs table
      fetchBlogsFromAPI();
      
      // Show success message
      showNotification('Xóa bài viết thành công', 'success');
    })
    .catch(error => {
      console.error('❌ Error deleting blog:', error);
      showNotification('Lỗi khi xóa bài viết: ' + error.message, 'error');
    });
}

// ========== CONTACTS PAGE ==========

/**
 * Load Contacts Page
 */
function loadContactsPage() {
  console.log('Loading contacts page...');
  loadContactsTable();
}

/**
 * Load contacts table
 */
function loadContactsTable() {
  // Mock data
  const contacts = [
    {
      id: 1,
      name: 'Nguyễn Văn A',
      email: 'nguyenvana@email.com',
      subject: 'Hỏi về sản phẩm',
      date: '2024-01-18',
      status: 'new',
    },
    {
      id: 2,
      name: 'Trần Thị B',
      email: 'tranthib@email.com',
      subject: 'Phản hồi về dịch vụ',
      date: '2024-01-17',
      status: 'replied',
    },
  ];

  const tbody = document.querySelector('#contactsTable');
  if (tbody) {
    tbody.innerHTML = contacts
      .map(
        (contact) => `
        <tr>
          <td>${contact.id}</td>
          <td>${contact.name}</td>
          <td>${contact.email}</td>
          <td>${contact.subject}</td>
          <td><span class="status-badge ${contact.status === 'replied' ? 'success' : 'warning'}">${contact.status === 'replied' ? 'Đã trả lời' : 'Mới'}</span></td>
          <td>${contact.date}</td>
          <td>
            <button class="btn btn-edit action-btn" onclick="viewContact(${contact.id})">
              <i class="fas fa-eye"></i>
            </button>
          </td>
        </tr>
      `
      )
      .join('');
  }
}

/**
 * View contact
 */
function viewContact(contactId) {
  console.log('View contact:', contactId);
}

// ========== UTILITIES ==========

/**
 * Set up user profile
 */
function setupUserProfile() {
  const userMenu = document.querySelector('.user-menu');
  if (userMenu) {
    userMenu.addEventListener('click', () => {
      console.log('User menu clicked');
      // Navigate to account page when user menu clicked
      showPage('account');
    });
  }
}

// Current logged-in user cache
let currentUser = null;

/**
 * Fetch current logged-in user from server and populate topbar/account
 */
async function fetchCurrentUser() {
  try {
    const res = await fetch(`${API_BASE_URL}/users/checkAuth`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      console.warn('[fetchCurrentUser] Auth check failed with status', res.status);
      return;
    }

    const data = await res.json();
    if (!data || !data.loggedIn) {
      console.warn('[fetchCurrentUser] Not logged in');
      return;
    }

    currentUser = data.user || data;
    console.log('[fetchCurrentUser] Fetched user data:', currentUser);

    // Populate topbar
    const avatar = document.querySelector('.user-avatar');
    const topbarName = document.querySelector('.user-name');
    const topbarRole = document.querySelector('.user-role');

    if (avatar && currentUser.avatar_url) avatar.src = currentUser.avatar_url;
    if (topbarName) topbarName.textContent = currentUser.user_name || currentUser.username || currentUser.full_name || currentUser.email;
    if (topbarRole) topbarRole.textContent = (currentUser.role || '').toString().replace('_', ' ').toUpperCase();

    // Populate account page fields if present
    const accountName = document.querySelector('#accountName');
    const accountRole = document.querySelector('#accountRole');
    const accountEmail = document.querySelector('#accountEmail');
    const accountAvatar = document.querySelector('.account-avatar');
    const detailFullName = document.querySelector('#detailFullName');
    const detailEmail = document.querySelector('#detailEmail');
    const detailPhone = document.querySelector('#detailPhone');
    const detailRole = document.querySelector('#detailRole');

    if (accountAvatar && currentUser.avatar_url) accountAvatar.src = currentUser.avatar_url;
    if (accountName) accountName.textContent = currentUser.user_name || currentUser.username || currentUser.full_name || currentUser.email;
    if (accountRole) accountRole.textContent = (currentUser.role || '').toString().replace('_', ' ').toUpperCase();
    if (accountEmail) accountEmail.textContent = currentUser.email || currentUser.user_email || '';
    if (detailFullName) detailFullName.textContent = currentUser.full_name || currentUser.user_name || currentUser.username || '';
    if (detailEmail) detailEmail.textContent = currentUser.email || '';
    if (detailPhone) detailPhone.textContent = currentUser.phone || currentUser.mobile || '';
    if (detailRole) detailRole.textContent = (currentUser.role || '').toString().replace('_', ' ').toUpperCase();

    console.log('[fetchCurrentUser] ✅ Populated all user fields for', currentUser.user_name || currentUser.email);
  } catch (err) {
    console.error('[fetchCurrentUser] Error fetching current user:', err);
  }
}

// ========== ACCOUNT PAGE ==========

/**
 * Load Account Page
 */
function loadAccountPage() {
  console.log('Loading account page...');
  const accountPage = document.querySelector('#accountPage');
  if (!accountPage) {
    console.error('Account page not found');
    return;
  }

  // Create account page HTML
  if (currentUser) {
    const roleDisplay = (currentUser.role || '').toString().replace('_', ' ').toUpperCase();
    const accountHTML = `
      <div class="page-header">
        <h1>Tài khoản Admin</h1>
      </div>

      <div class="account-container">
        <!-- Account Info Section -->
        <div class="account-card">
          <div class="account-header">
            <img src="${currentUser.avatar_url || 'https://via.placeholder.com/100'}" alt="Admin" class="account-avatar">
            <div class="account-info">
              <div class="account-name" id="accountName">${currentUser.user_name || currentUser.username || currentUser.full_name || currentUser.email || 'Admin'}</div>
              <div class="account-role" id="accountRole">${roleDisplay}</div>
              <div class="account-email" id="accountEmail">${currentUser.email || 'No email'}</div>
            </div>
          </div>

          <div class="account-actions">
            <button class="btn btn-primary" onclick="editAccountInfo()">Cập nhật ảnh</button>
            <button class="btn btn-secondary" onclick="editAccountPassword()">Chỉnh sửa</button>
          </div>
        </div>

        <!-- Account Details Section -->
        <div class="account-details">
          <h2>Thông tin chi tiết</h2>
          <div class="details-grid">
            <div class="detail-item">
              <label>Họ và tên:</label>
              <span id="detailFullName">${currentUser.full_name || currentUser.user_name || currentUser.username || 'N/A'}</span>
            </div>
            <div class="detail-item">
              <label>Email:</label>
              <span id="detailEmail">${currentUser.email || 'N/A'}</span>
            </div>
            <div class="detail-item">
              <label>Số điện thoại:</label>
              <span id="detailPhone">${currentUser.phone || currentUser.mobile || 'N/A'}</span>
            </div>
            <div class="detail-item">
              <label>Chức vụ:</label>
              <span id="detailRole">${roleDisplay}</span>
            </div>
          </div>
        </div>

        <!-- Password Section -->
        <div class="password-section">
          <h2>Mật khẩu</h2>
          <div class="password-item">
            <div class="password-label">Mật khẩu</div>
            <div class="password-value">••••••••</div>
            <button class="edit-btn" onclick="editPassword()"><i class="fas fa-edit"></i></button>
          </div>

          <div class="password-item">
            <div class="password-label">SMS</div>
            <div class="password-desc">Nhận mã SMS cho mỗi lần đăng nhập</div>
            <button class="edit-btn" onclick="editSMS()"><i class="fas fa-edit"></i></button>
          </div>

          <div class="password-item">
            <div class="password-label">Thông báo SMS</div>
            <div class="toggle-switch">
              <input type="checkbox" id="smsNotification" checked>
              <label for="smsNotification" class="toggle-slider"></label>
            </div>
          </div>
        </div>
      </div>
    `;

    accountPage.innerHTML = accountHTML;
    console.log('[loadAccountPage] ✅ Account page populated with current user data');
  } else {
    console.warn('[loadAccountPage] currentUser not loaded yet, will fetch');
    // If currentUser not loaded yet, fetch it
    fetchCurrentUser();
  }
}

/**
 * Edit account info
 */
function editAccountInfo() {
  console.log('Edit account info');
  alert('Chức năng cập nhật ảnh đang được phát triển');
}

/**
 * Filter orders
 */
function filterOrders(status) {
  console.log('Filter orders by status:', status);
  currentOrdersPage = 1;
  loadOrdersTable();
}

/**
 * Prev order page (pagination)
 */
function prevOrderPage() {
  if (currentOrdersPage > 1) {
    currentOrdersPage--;
    displayOrdersPage(currentOrdersPage);
    updateOrdersPagination();
  }
}

/**
 * Next order page (pagination)
 */
function nextOrderPage() {
  const totalPages = Math.ceil(ordersData.length / ordersPerPage);
  if (currentOrdersPage < totalPages) {
    currentOrdersPage++;
    displayOrdersPage(currentOrdersPage);
    updateOrdersPagination();
  }
}

/**
 * Edit account password
 */
function editAccountPassword() {
  console.log('Edit account password');
  alert('Chức năng chỉnh sửa mật khẩu đang được phát triển');
}

/**
 * Edit password
 */
function editPassword() {
  console.log('Edit password');
  alert('Chức năng đổi mật khẩu đang được phát triển');
}

/**
 * Edit SMS
 */
function editSMS() {
  console.log('Edit SMS');
  alert('Chức năng cấu hình SMS đang được phát triển');
}

/**
 * Handle logout
 */
function handleLogout() {
  if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
    window.location.href = '/';
  }
}

/**
 * Show add product modal
 */
function showAddProductModal() {
  const modal = document.querySelector('#productModal');
  const title = document.querySelector('#productModalTitle');
  const form = document.querySelector('#productForm');

  title.textContent = 'THÊM SẢN PHẨM MỚI';
  form.reset();
  
  // Reset form onsubmit for adding (not editing)
  form.setAttribute('onsubmit', 'saveProduct(event)');
  form.removeAttribute('data-product-id');
  
  document.querySelector('#productImagePreview').style.display = 'none';
  document.querySelector('#productDetailImagePreview').style.display = 'none';
  document.querySelector('#productActive').checked = true;
  document.querySelector('#productPromotion').checked = false;

  // Load categories
  loadProductCategoryOptions();

  // Add event listeners for price calculation
  setTimeout(() => {
    const priceInput = document.querySelector('#productPrice');
    const promotionInput = document.querySelector('#productOldPrice');
    const promotionCheckbox = document.querySelector('#productPromotion');

    if (priceInput) {
      priceInput.addEventListener('input', updateFinalPrice);
    }
    if (promotionInput) {
      promotionInput.addEventListener('input', updateFinalPrice);
    }
    if (promotionCheckbox) {
      promotionCheckbox.addEventListener('change', togglePromotionField);
    }

    // Initialize
    updateFinalPrice();
    togglePromotionField();
  }, 100);

  modal.style.display = 'flex';
}

/**
 * Show edit product modal
 */
function showEditProductModal(productId) {
  getProduct(productId)
    .then((response) => {
      if (!response.success) return;

      const product = response.data;
      const modal = document.querySelector('#productModal');
      const title = document.querySelector('#productModalTitle');
      const form = document.querySelector('#productForm');

      title.textContent = `CHỈNH SỬA SẢN PHẨM: ${product.product_name || product.name || 'N/A'}`;

      // Store productId in form as data attribute
      form.setAttribute('data-product-id', productId);
      
      // Update form onsubmit to pass productId
      form.setAttribute('onsubmit', `saveProduct(event, ${productId})`);

      // Populate form
      document.querySelector('#productName').value = product.product_name || product.name || '';
      document.querySelector('#productCategory').value = product.category_id || '';
      document.querySelector('#productPrice').value = product.price || 0;
      document.querySelector('#productOldPrice').value = product.discount || 0;
      document.querySelector('#productSummary').value = product.description || '';
      document.querySelector('#productDescription').value = product.detail || '';
      document.querySelector('#productActive').checked = product.status === 'active' || product.is_active === 1;
      document.querySelector('#productPromotion').checked = product.is_promotion === 1;

      // Load categories
      loadProductCategoryOptions();

      // Show product image preview if exists
      if (product.image_url && product.image_url !== 'NOIMAGE') {
        document.querySelector('#productImageImg').src = product.image_url;
        document.querySelector('#productImagePreview').style.display = 'block';
      }

      // Add event listeners for price calculation
      setTimeout(() => {
        const priceInput = document.querySelector('#productPrice');
        const promotionInput = document.querySelector('#productOldPrice');
        const promotionCheckbox = document.querySelector('#productPromotion');

        if (priceInput) {
          priceInput.addEventListener('input', updateFinalPrice);
        }
        if (promotionInput) {
          promotionInput.addEventListener('input', updateFinalPrice);
        }
        if (promotionCheckbox) {
          promotionCheckbox.addEventListener('change', togglePromotionField);
        }

        // Initialize
        updateFinalPrice();
        togglePromotionField();
      }, 100);

      modal.style.display = 'flex';
    })
    .catch((error) => console.error('Error loading product:', error));
}

/**
 * Load category options for product dropdown
 */
function loadProductCategoryOptions() {
  getCategories()
    .then((response) => {
      if (!response.success) return;

      const select = document.querySelector('#productCategory');
      if (select) {
        const options = response.data
          .map((cat) => `<option value="${cat.category_id || cat.id}">${cat.category_name || cat.name}</option>`)
          .join('');
        
        // Preserve the first option
        select.innerHTML = '<option value="">Chọn danh mục</option>' + options;
      }
    })
    .catch((error) => console.error('Error loading categories:', error));
}

/**
 * Handle product image selection
 */
function handleProductImageSelect(event) {
  const file = event.target.files[0];
  if (file) {
    displayProductImagePreview(file);
  }
}

/**
 * Handle product image drop
 */
function handleProductImageDrop(event) {
  event.preventDefault();
  event.stopPropagation();
  const files = event.dataTransfer.files;
  if (files.length > 0) {
    displayProductImagePreview(files[0]);
    document.querySelector('#productImage').files = files;
  }
}

/**
 * Display product image preview
 */
function displayProductImagePreview(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    document.querySelector('#productImageImg').src = e.target.result;
    document.querySelector('#productImagePreview').style.display = 'block';
  };
  reader.readAsDataURL(file);
}

/**
 * Clear product image
 */
function clearProductImage() {
  document.querySelector('#productImage').value = '';
  document.querySelector('#productImagePreview').style.display = 'none';
}

/**
 * Handle product detail image selection
 */
function handleProductDetailImageSelect(event) {
  const file = event.target.files[0];
  if (file) {
    displayProductDetailImagePreview(file);
  }
}

/**
 * Handle product detail image drop
 */
function handleProductDetailImageDrop(event) {
  event.preventDefault();
  event.stopPropagation();
  const files = event.dataTransfer.files;
  if (files.length > 0) {
    displayProductDetailImagePreview(files[0]);
    document.querySelector('#productDetailImage').files = files;
  }
}

/**
 * Display product detail image preview
 */
function displayProductDetailImagePreview(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    document.querySelector('#productDetailImageImg').src = e.target.result;
    document.querySelector('#productDetailImagePreview').style.display = 'block';
  };
  reader.readAsDataURL(file);
}

/**
 * Clear product detail image
 */
function clearProductDetailImage() {
  document.querySelector('#productDetailImage').value = '';
  document.querySelector('#productDetailImagePreview').style.display = 'none';
}

/**
 * Close product modal
 */
function closeProductModal() {
  const modal = document.querySelector('#productModal');
  modal.style.display = 'none';
  document.querySelector('#productForm').reset();
}

/**
 * Close modal
 */
function closeModal() {
  document.querySelector('#editModal').classList.remove('active');
}

// ============================================
// CATEGORY FUNCTIONS
// ============================================

/**
 * Load product categories page
 */
function loadProductCategoriesPage() {
  console.log('[PAGE] Loading product categories page...');
  loadCategoriesTable();
}

/**
 * Load all categories table
 */
function loadCategoriesTable() {
  console.log('[CATEGORY] Starting to load categories table...');
  
  getCategories()
    .then((response) => {
      console.log('[CATEGORY] API Response:', response);
      
      if (!response.success) {
        console.error('[CATEGORY] Response not successful:', response.message);
        throw new Error(response.message);
      }

      const tbody = document.querySelector('#categoriesTable');
      console.log('[CATEGORY] Found tbody element:', !!tbody);
      
      if (!tbody) {
        console.error('[CATEGORY] Table body element not found!');
        return;
      }

      console.log('[CATEGORY] Categories data:', response.data);
      console.log('[CATEGORY] Total categories:', response.data?.length || 0);

      if (!response.data || response.data.length === 0) {
        console.warn('[CATEGORY] No categories found in response');
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">Không có danh mục nào</td></tr>';
        return;
      }

      tbody.innerHTML = response.data
        .map((category, index) => {
          console.log(`[CATEGORY] Processing category ${index}:`, category);
          const imageUrl = category.image_url || 'https://via.placeholder.com/80';
          const productCount = category.product_count || 0;
          
          return `
            <tr>
              <td>${category.category_id || 'N/A'}</td>
              <td><strong>${category.category_name || category.name || 'N/A'}</strong></td>
              <td><img src="${imageUrl}" alt="Category" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;"></td>
              <td>${productCount} sản phẩm</td>
              <td>
                <input type="checkbox" checked style="cursor: pointer; width: 18px; height: 18px;">
              </td>
              <td>
                <button class="btn btn-edit action-btn" onclick="showEditCategoryModal(${category.category_id})" title="Chỉnh sửa">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-delete action-btn" onclick="deleteCategoryItem(${category.category_id})" title="Xóa">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          `;
        })
        .join('');
      
      console.log('[CATEGORY] Table rendered successfully with', response.data.length, 'rows');
    })
    .catch((error) => {
      console.error('[CATEGORY] Error loading categories:', error);
      console.error('[CATEGORY] Error details:', error.message || error);
      showNotification('Lỗi tải danh mục: ' + (error.message || 'Unknown error'), 'error');
    });
}

/**
 * Show add category modal
 */
function showAddCategoryModal() {
  const modal = document.querySelector('#categoryModal');
  const title = document.querySelector('#categoryModalTitle');
  const form = document.querySelector('#categoryForm');

  title.textContent = 'THÊM DANH MỤC MỚI';
  form.reset();
  form.setAttribute('onsubmit', 'saveCategory(event)');
  form.removeAttribute('data-category-id');

  modal.style.display = 'flex';
}

/**
 * Show edit category modal
 */
function showEditCategoryModal(categoryId) {
  getCategory(categoryId)
    .then((response) => {
      if (!response.success) return;

      const category = response.data;
      const modal = document.querySelector('#categoryModal');
      const title = document.querySelector('#categoryModalTitle');
      const form = document.querySelector('#categoryForm');

      title.textContent = `CHỈNH SỬA DANH MỤC: ${category.category_name || category.name || 'N/A'}`;

      // Store categoryId in form
      form.setAttribute('data-category-id', categoryId);
      form.setAttribute('onsubmit', `saveCategory(event, ${categoryId})`);

      // Populate form
      document.querySelector('#categoryName').value = category.category_name || category.name || '';
      document.querySelector('#categoryDescription').value = category.description || '';

      modal.style.display = 'flex';
    })
    .catch((error) => console.error('Error loading category:', error));
}

/**
 * Save category (create or update)
 */
function saveCategory(event, categoryId = null) {
  event.preventDefault();

  const categoryName = document.querySelector('#categoryName').value.trim();
  const categoryDescription = document.querySelector('#categoryDescription').value.trim();

  // Validation
  if (!categoryName) {
    showNotification('Vui lòng nhập tên danh mục', 'error');
    return;
  }

  const categoryData = {
    category_name: categoryName,
    description: categoryDescription,
  };

  console.log('Saving category with data:', categoryData);

  const promise = categoryId ? updateCategory(categoryId, categoryData) : createCategory(categoryData);

  promise
    .then((response) => {
      console.log('Category save response:', response);
      if (response.success || response.id) {
        showNotification(
          categoryId ? 'Cập nhật danh mục thành công' : 'Thêm danh mục thành công',
          'success'
        );
        closeCategoryModal();
        loadCategoriesTable();
      } else {
        throw new Error(response.message || 'Lỗi lưu danh mục');
      }
    })
    .catch((error) => {
      console.error('Error saving category:', error);
      showNotification(error.message || 'Lỗi lưu danh mục', 'error');
    });
}

/**
 * Delete category
 */
function deleteCategoryItem(categoryId) {
  if (!confirm('Bạn chắc chắn muốn xóa danh mục này?')) return;

  try {
    const response = deleteCategory(categoryId);
    // deleteCategory in admin-api.js already handles loading and notification
  } catch (error) {
    console.error('Error deleting category:', error);
    showNotification('Lỗi xóa danh mục', 'error');
  }
}

/**
 * Filter categories
 */
function filterCategories() {
  const searchText = document.querySelector('#categorySearch')?.value || '';

  getCategories()
    .then((response) => {
      if (!response.success) throw new Error(response.message);

      let filtered = response.data;

      // Filter by search text
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        filtered = filtered.filter(c => 
          (c.category_name || '').toLowerCase().includes(searchLower) ||
          (c.name || '').toLowerCase().includes(searchLower)
        );
      }

      const tbody = document.querySelector('#categoriesTable');
      if (!tbody) return;

      tbody.innerHTML = filtered
        .map((category) => {
          const imageUrl = category.image_url || 'https://via.placeholder.com/80';
          const productCount = category.product_count || 0;
          
          return `
            <tr>
              <td>${category.category_id || 'N/A'}</td>
              <td><strong>${category.category_name || category.name || 'N/A'}</strong></td>
              <td><img src="${imageUrl}" alt="Category" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;"></td>
              <td>${productCount} sản phẩm</td>
              <td>
                <input type="checkbox" checked style="cursor: pointer; width: 18px; height: 18px;">
              </td>
              <td>
                <button class="btn btn-edit action-btn" onclick="showEditCategoryModal(${category.category_id})" title="Chỉnh sửa">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-delete action-btn" onclick="deleteCategoryItem(${category.category_id})" title="Xóa">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          `;
        })
        .join('');
    })
    .catch((error) => {
      console.error('Error filtering categories:', error);
      showNotification('Lỗi lọc danh mục', 'error');
    });
}

/**
 * Close category modal
 */
function closeCategoryModal() {
  const modal = document.querySelector('#categoryModal');
  modal.style.display = 'none';
  document.querySelector('#categoryForm').reset();
}
