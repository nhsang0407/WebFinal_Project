// ==================== FORMAT MONEY ====================
function formatCurrency(amount) {
  return amount.toLocaleString("vi-VN") + "đ";
}

// Hàm map trạng thái đơn hàng cho dễ đọc
function mapOrderStatus(status) {
  switch (status) {
    case "Pending": return "Chờ xử lý";
    case "Processing": return "Đang giao";
    case "Shipped": return "Đã giao";
    case "Completed": return "Hoàn tất";
    case "Cancelled": return "Đã hủy";
    default: return status;
  }
}

// Load chi tiết đơn hàng
async function loadOrderDetail() {
  const params = new URLSearchParams(window.location.search);
  const order_id = params.get("order_id");

  if (!order_id) {
    document.body.innerHTML = "<p>Không có mã đơn hàng.</p>";
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/orders/detail/${order_id}`, { credentials: "include" });
    if (!res.ok) throw new Error("Không thể tải dữ liệu");

    const data = await res.json();
    const details = data.orderDetails;

    if (!details || details.length === 0) {
      document.getElementById("order-container").innerHTML = "<p>Không tìm thấy đơn hàng.</p>";
      return;
    }

    // Lấy thông tin từ sản phẩm đầu tiên
    const first = details[0];
    const order = {
      code: first.order_id,
      date: new Date(first.order_date).toLocaleDateString("vi-VN"),
      time: new Date(first.order_date).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      status: mapOrderStatus(first.status),
      total: formatCurrency(first.total_amount),
      products: details.map(p => ({
        image: p.image_url,
        name: p.product_name,
        price: formatCurrency(p.unit_price),
        qty: p.quantity,
        subtotal: formatCurrency(p.unit_price * p.quantity)
      }))
    };

    renderOrder(order);
  } catch (err) {
    console.error(err);
    document.getElementById("order-container").innerHTML = "<p>Lỗi tải đơn hàng.</p>";
  }
}

// Render giao diện chi tiết đơn hàng
function renderOrder(order) {
  const container = document.getElementById("order-container");

  const productRows = order.products.map(p => `
    <tr>
      <td><img src="${p.image}" alt="${p.name}"></td>
      <td>${p.name}</td>
      <td>${p.price}</td>
      <td>${p.qty}</td>
      <td>${p.subtotal}</td>
    </tr>
  `).join("");

  container.innerHTML = `
    <div class="order-container">
      <div class="order-info">
        <p><strong>Đơn hàng:</strong> <span class="code">#DH${order.code}</span></p>
        <p><strong>Ngày đặt hàng:</strong> ${order.date}</p>
        <p><strong>Thời gian:</strong> ${order.time}</p>
        <p><strong>Tình trạng đơn hàng:</strong> <span class="status">${order.status}</span></p>
        <p><strong>Thành tiền:</strong> <span class="total">${order.total}</span></p>
      </div>

      <table class="product-table">
        <thead>
          <tr>
            <th>Ảnh</th>
            <th>Sản phẩm</th>
            <th>Đơn giá</th>
            <th>Số lượng</th>
            <th>Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          ${productRows}
        </tbody>
      </table>
      <div class="center">
        <button class="back-btn" onclick="window.history.back()">Quay lại</button>
      </div>
    </div>
  `;
}

loadOrderDetail();
