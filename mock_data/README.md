# 📊 Mock Data Folder

Thư mục `mock_data` chứa dữ liệu giả (mock data) ở định dạng JSON, tương ứng với tất cả các bảng trong database của dự án WebFinal.

## 📁 Cấu trúc Thư Mục

```
mock_data/
├── users.json              # Bảng users - Người dùng hệ thống
├── categories.json         # Bảng categories - Danh mục sản phẩm
├── suppliers.json          # Bảng suppliers - Nhà cung cấp
├── products.json           # Bảng products - Sản phẩm
├── orders.json             # Bảng orders - Đơn hàng
├── order_details.json      # Bảng order_details - Chi tiết đơn hàng
├── cart.json               # Bảng cart - Giỏ hàng
├── cart_items.json         # Bảng cart_items - Sản phẩm trong giỏ
├── payments.json           # Bảng payments - Thanh toán
├── shipping.json           # Bảng shipping - Vận chuyển
├── reviews.json            # Bảng reviews - Đánh giá sản phẩm
├── blogs.json              # Bảng blogs - Bài blog
├── blog_comments.json      # Bảng blog_comments - Bình luận blog
├── contact_messages.json   # Bảng contact_messages - Tin nhắn liên hệ
├── README.md               # Tệp này
└── MockDataLoader.js       # Utility để tải mock data vào ứng dụng
```

---

## 📋 Chi Tiết Từng Tệp

### 1. **users.json** (6 người dùng)
| Field | Mô tả | Ví dụ |
|-------|-------|-------|
| user_id | ID người dùng | 1 |
| username | Tên đăng nhập | "hungdev" |
| email | Email | "dev@gmail.com" |
| password_hash | Mật khẩu được hash | "$2a$12$..." |
| role | Vai trò (super_admin, staff, customer) | "super_admin" |
| is_active | Trạng thái kích hoạt | 1 |

**Tài khoản quan trọng:**
- **Admin:** id=1, username="hungdev", email="dev@gmail.com"
- **Staff:** id=7, username="staff", email="staff@webfinal.com"

---

### 2. **categories.json** (5 danh mục)
| Field | Mô tả |
|-------|-------|
| category_id | ID danh mục |
| category_name | Tên danh mục |
| description | Mô tả |

**Danh mục:**
- Thảo mộc sấy khô
- Trái cây sấy dẻo
- Trái cây sấy giòn
- Trái cây sấy thăng hoa
- Combo 3 vị best seller

---

### 3. **suppliers.json** (3 nhà cung cấp)
| Field | Mô tả |
|-------|-------|
| supplier_id | ID nhà cung cấp |
| supplier_name | Tên công ty |
| contact_info | Số điện thoại |
| address | Địa chỉ |

---

### 4. **products.json** (7 sản phẩm chủ chốt)
| Field | Mô tả |
|-------|-------|
| product_id | ID sản phẩm |
| category_id | ID danh mục |
| product_name | Tên sản phẩm |
| price | Giá hiện tại |
| old_price | Giá gốc |
| stock | Số lượng trong kho |
| image_url | Đường dẫn ảnh |

**Sản phẩm có sẵn:**
- Bông atisô sấy khô
- Cỏ ngọt sấy khô
- Bưởi sấy dẻo
- Chuối sấy giòn
- Sầu riêng sấy thăng hoa
- Combo 3 vị best seller

---

### 5. **orders.json** (6 đơn hàng)
| Field | Mô tả |
|-------|-------|
| order_id | ID đơn hàng |
| customer_id | ID khách hàng |
| total_amount | Tổng tiền |
| status | Trạng thái (Pending, Processing, Shipped, Completed, Cancelled) |
| order_date | Ngày đặt hàng |

**Trạng thái đơn:**
- Pending - Chờ xử lý
- Processing - Đang xử lý
- Shipped - Đang giao
- Completed - Hoàn tất
- Cancelled - Đã hủy

---

### 6. **order_details.json** (9 dòng đơn hàng)
| Field | Mô tả |
|-------|-------|
| order_detail_id | ID chi tiết đơn |
| order_id | ID đơn hàng |
| product_id | ID sản phẩm |
| quantity | Số lượng |
| price | Giá từng sản phẩm |
| subtotal | Tổng tiền dòng |

---

### 7. **cart.json** (3 giỏ hàng)
| Field | Mô tả |
|-------|-------|
| cart_id | ID giỏ |
| customer_id | ID khách |
| created_at | Ngày tạo |
| updated_at | Ngày cập nhật |

---

### 8. **cart_items.json** (5 sản phẩm trong giỏ)
| Field | Mô tả |
|-------|-------|
| cart_item_id | ID dòng giỏ |
| cart_id | ID giỏ |
| product_id | ID sản phẩm |
| quantity | Số lượng |
| price | Giá |

---

### 9. **payments.json** (5 thanh toán)
| Field | Mô tả |
|-------|-------|
| payment_id | ID thanh toán |
| order_id | ID đơn hàng |
| payment_method | Phương thức (credit_card, bank_transfer, e_wallet) |
| amount | Số tiền |
| status | Trạng thái (completed, pending, failed) |
| transaction_id | Mã giao dịch |

---

### 10. **shipping.json** (5 vận chuyển)
| Field | Mô tả |
|-------|-------|
| shipping_id | ID vận chuyển |
| order_id | ID đơn hàng |
| shipping_address | Địa chỉ giao |
| shipping_method | Phương thức (standard, express) |
| tracking_number | Mã theo dõi |
| status | Trạng thái (pending, in_transit, delivered) |

---

### 11. **reviews.json** (5 đánh giá)
| Field | Mô tả |
|-------|-------|
| review_id | ID đánh giá |
| product_id | ID sản phẩm |
| customer_id | ID khách |
| rating | Điểm (1-5 sao) |
| comment | Bình luận |
| created_at | Ngày tạo |

---

### 12. **blogs.json** (3 bài blog)
| Field | Mô tả |
|-------|-------|
| blog_id | ID bài |
| admin_id | ID tác giả |
| title | Tiêu đề |
| content | Nội dung |
| image_url | Ảnh đại diện |
| created_at | Ngày đăng |

---

### 13. **blog_comments.json** (4 bình luận)
| Field | Mô tả |
|-------|-------|
| comment_id | ID bình luận |
| blog_id | ID bài |
| customer_id | ID khách |
| comment | Nội dung |
| created_at | Ngày bình luận |

---

### 14. **contact_messages.json** (5 tin nhắn)
| Field | Mô tả |
|-------|-------|
| message_id | ID tin |
| customer_id | ID khách (null nếu chưa login) |
| name | Tên người gửi |
| email | Email người gửi |
| subject | Chủ đề |
| message | Nội dung |
| created_at | Ngày gửi |

---

## 🔄 Mối Quan Hệ Dữ Liệu

```
users (khách hàng)
  ├── orders (1 khách có nhiều đơn)
  │   ├── order_details (1 đơn có nhiều dòng)
  │   │   └── products (sản phẩm đặt)
  │   ├── payments (1 đơn có 1 thanh toán)
  │   └── shipping (1 đơn có 1 vận chuyển)
  ├── cart (1 khách có 1 giỏ)
  │   └── cart_items (giỏ có nhiều dòng)
  │       └── products
  ├── reviews (khách đánh giá sản phẩm)
  ├── blog_comments (khách bình luận blog)
  └── contact_messages (khách gửi tin)

categories
  └── products (1 danh mục có nhiều sản phẩm)

suppliers
  └── products (1 nhà cung cấp có nhiều sản phẩm)

blogs (tác giả là admin)
  └── blog_comments (1 blog có nhiều bình luận)
```

---

## 📊 Thống Kê Dữ Liệu

| Bảng | Số bản ghi |
|------|-----------|
| users | 6 |
| categories | 5 |
| suppliers | 3 |
| products | 7 |
| orders | 6 |
| order_details | 9 |
| cart | 3 |
| cart_items | 5 |
| payments | 5 |
| shipping | 5 |
| reviews | 5 |
| blogs | 3 |
| blog_comments | 4 |
| contact_messages | 5 |
| **TỔNG CỘNG** | **76 bản ghi** |

---

## 🔐 Tài Khoản Test

### Super Admin
```
Email/Username: hungdev / dev@gmail.com
Password: (được hash, cần kiểm tra DB)
Role: super_admin
```

### Staff
```
Email/Username: staff / staff@webfinal.com
Password: 123 (password test)
Role: staff
```

### Customer
```
Email/Username: ngatt111e@st.uel.edu.vn
Password: (được hash)
Role: customer
```

---

## 💡 Cách Sử Dụng

### 1. **Tải Mock Data Vào Memory**
```javascript
import mockData from './mock_data/users.json';

// Hoặc tải tất cả
const mockDataLoader = require('./MockDataLoader');
const allData = mockDataLoader.loadAllMockData();
```

### 2. **Sử Dụng Trong Backend**
```javascript
// app.js hoặc routes
import users from './mock_data/users.json';
import products from './mock_data/products.json';

app.get('/api/products', (req, res) => {
  res.json(products);
});
```

### 3. **Sử Dụng Trong Admin Dashboard**
```javascript
// Khi database không available, fallback tới mock data
async function getProducts() {
  try {
    return await fetch('/api/products').then(r => r.json());
  } catch (err) {
    // Fallback to mock data
    return mockData.products;
  }
}
```

---

## 🔄 Cập Nhật Mock Data

### Thêm Người Dùng Mới
Chỉnh sửa `users.json`:
```json
{
  "user_id": 8,
  "username": "newuser",
  "email": "new@example.com",
  "password_hash": "$2b$10$...",
  "role": "customer",
  "is_active": 1,
  "created_at": "2025-11-11T12:00:00Z",
  "updated_at": "2025-11-11T12:00:00Z"
}
```

### Thêm Sản Phẩm Mới
Chỉnh sửa `products.json`:
```json
{
  "product_id": 8,
  "category_id": 1,
  "supplier_id": 1,
  "admin_id": 1,
  "product_name": "Sản phẩm mới",
  "description": "Mô tả",
  "price": 100000,
  "stock": 50,
  "image_url": "images/...",
  "created_at": "2025-11-11T12:00:00Z",
  "old_price": 120000
}
```

---

## ⚠️ Ghi Chú Quan Trọng

1. **ID tự động tăng:** Khi thêm dữ liệu, ID nên tiếp tục từ số cuối cùng
2. **Định dạng ngày giờ:** Sử dụng ISO 8601 (YYYY-MM-DDTHH:MM:SSZ)
3. **Enum values:** Tuân theo các giá trị cho phép trong SQL schema
4. **Foreign keys:** Đảm bảo ID tham chiếu tồn tại trong bảng parent
5. **Persistency:** Data chỉ tồn tại trong memory, F5 page sẽ reset

---

## 🚀 Integration với Database

Khi sẵn sàng chuyển sang database thực:

1. **Import SQL files từ `/database`**
   ```bash
   mysql -u root -p webfinal < database/webfinal_user.sql
   mysql -u root -p webfinal < database/webfinal_product.sql
   # ... các file khác
   ```

2. **Update API routes**
   ```javascript
   // Thay vì import JSON
   import products from './models/productModel.js';
   
   // Gọi database query
   const allProducts = await products.getAll();
   ```

3. **Loại bỏ mock data**
   ```javascript
   // Xóa hoặc disable import mock data
   // import mockData from './mock_data/...';
   ```

---

## 📚 Tài Liệu Liên Quan

- 📖 Database Schema: `/database/*.sql`
- 🔐 Login Troubleshooting: `LOGIN_TROUBLESHOOTING.md`
- 🎯 Admin Dashboard Guide: `ADMIN_DASHBOARD_GUIDE.md`
- 🏗️ Architecture: `ADMIN_ARCHITECTURE.md`

---

## ✅ Checklist Kiểm Tra

- ✅ Tất cả file JSON có cấu trúc hợp lệ
- ✅ ID tuân theo quy tắc (không trùng lặp)
- ✅ Foreign keys chính xác
- ✅ Enum values hợp lệ
- ✅ Ngày giờ có format chuẩn
- ✅ Password hash được mã hóa (bcrypt)
- ✅ Dữ liệu đa dạng và liên quan nhau

---

**Last Updated:** November 11, 2025
**Version:** 1.0
**Status:** ✅ Production Ready
