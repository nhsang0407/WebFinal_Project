/**
 * Authentication & Authorization Middleware
 * Bảo vệ các API endpoints theo vai trò người dùng
 */

/**
 * Middleware xác thực đăng nhập
 * Kiểm tra session hoặc JWT token
 */
const requireAuth = (req, res, next) => {
  try {
    // Kiểm tra session user
    if (req.session && req.session.user) {
      const userName = req.session.user.user_name || req.session.user.username || 'unknown';
      console.log(`[AUTH] User ${userName} authenticated (role: ${req.session.user.role})`);
      return next();
    }

    // Nếu không có session, kiểm tra JWT token (nếu có)
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      console.log('[AUTH] JWT token found, skipping session check');
      return next();
    }

    return res.status(401).json({
      success: false,
      message: 'Vui lòng đăng nhập để tiếp tục',
      error: 'UNAUTHORIZED',
    });
  } catch (error) {
    console.error('[AUTH] Error in requireAuth:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi xác thực',
      error: error.message,
    });
  }
};

/**
 * Middleware xác thực vai trò admin/staff
 * Chỉ cho phép người dùng với role 'super_admin' hoặc 'staff'
 */
const requireAdmin = (req, res, next) => {
  try {
    const user = req.session?.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập',
        error: 'UNAUTHORIZED',
      });
    }

    // Kiểm tra vai trò
    const allowedRoles = ['super_admin', 'staff'];
    if (!allowedRoles.includes(user.role)) {
      const userName = user.user_name || user.username || 'unknown';
      console.warn(
        `[AUTH] User ${userName} with role '${user.role}' attempted admin action`
      );
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập chức năng này',
        error: 'FORBIDDEN',
      });
    }

    const userName = user.user_name || user.username || 'unknown';
    console.log(`[AUTH] Admin access granted for user ${userName} (role: ${user.role})`);
    return next();
  } catch (error) {
    console.error('[AUTH] Error in requireAdmin:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi kiểm tra quyền',
      error: error.message,
    });
  }
};

/**
 * Middleware xác thực super admin
 * Chỉ cho phép người dùng với role 'super_admin'
 */
const requireSuperAdmin = (req, res, next) => {
  try {
    const user = req.session?.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập',
        error: 'UNAUTHORIZED',
      });
    }

    if (user.role !== 'super_admin') {
      const userName = user.user_name || user.username || 'unknown';
      console.warn(
        `[AUTH] User ${userName} with role '${user.role}' attempted super admin action`
      );
      return res.status(403).json({
        success: false,
        message: 'Chỉ super admin mới có quyền thực hiện hành động này',
        error: 'FORBIDDEN',
      });
    }

    const userName = user.user_name || user.username || 'unknown';
    console.log(`[AUTH] Super admin access granted for user ${userName}`);
    return next();
  } catch (error) {
    console.error('[AUTH] Error in requireSuperAdmin:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi kiểm tra quyền',
      error: error.message,
    });
  }
};

/**
 * Middleware log các API calls
 */
const apiLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.path;
  const user = req.session?.user?.username || 'anonymous';

  console.log(`[API] ${timestamp} | ${method} ${path} | User: ${user}`);
  next();
};

/**
 * Middleware xử lý lỗi toàn cục
 */
const errorHandler = (err, req, res, next) => {
  console.error('[ERROR] Global error handler:', err);

  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Lỗi máy chủ nội bộ';

  res.status(statusCode).json({
    success: false,
    message: message,
    error: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};

export {
  requireAuth,
  requireAdmin,
  requireSuperAdmin,
  apiLogger,
  errorHandler,
};
