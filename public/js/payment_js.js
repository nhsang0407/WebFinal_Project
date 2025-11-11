// ==================== FORMAT MONEY (Cần có trong config/main.js hoặc được load) ====================
function formatCurrency(amount) {
    if (isNaN(amount)) return "0 VNĐ";
    return amount.toLocaleString("vi-VN") + " VNĐ";
}

// Giả sử:
const SHIPPING_FEE = 30000;
const DISCOUNT_MOCK = 20000; // Giả lập giảm giá 20,000đ


// Lấy địa chỉ defautl từ Account đc lưu trong LS
function loadDefaultAddress() {
  const addressBox = document.querySelector('.address-box');

  // Lấy dữ liệu địa chỉ từ localStorage
  const userAddresses = JSON.parse(localStorage.getItem('userAddresses')) || [];

  // Tìm địa chỉ mặc định
  let defaultAddr = userAddresses.find(addr => addr.default);

  // Nếu không có default, thử lấy selectedAddress trước đó
  if (!defaultAddr) {
      defaultAddr = JSON.parse(localStorage.getItem('selectedAddress')) || null;
  }

  // Lưu lại selectedAddress
  if (defaultAddr) {
      localStorage.setItem('selectedAddress', JSON.stringify(defaultAddr));
  } else {
      localStorage.removeItem('selectedAddress');
  }

  // Lưu địa chỉ mặc định vào localStorage
  if (defaultAddr) {
    localStorage.setItem('selectedAddress', JSON.stringify(defaultAddr));
  } else {
    localStorage.removeItem('selectedAddress'); // nếu không có default thì xóa key
  }

  if (!defaultAddr) {
    addressBox.innerHTML = `
      <div>
        <i class="fa-solid fa-location-dot"></i>
        <span>Địa chỉ mua hàng</span>
      </div>
      <div>
        <strong>Chưa có địa chỉ mặc định</strong><br><br>
        <small>Vui lòng thêm hoặc chọn địa chỉ mặc định trong tài khoản.</small>
      </div>
      <button class="edit-btn"><i class="fa-solid fa-pen-to-square"></i></button>
    `;
  } else {
    addressBox.innerHTML = `
      <div>
        <i class="fa-solid fa-location-dot"></i>
        <span>Địa chỉ mua hàng</span>
      </div>
      <div>
        <strong>${defaultAddr.name}</strong> | ${defaultAddr.phone}<br><br>
        <small>${defaultAddr.address}</small>
      </div>
      <button class="edit-btn"><i class="fa-solid fa-pen-to-square"></i></button>
    `;
  }

  // Khi bấm nút sửa → lưu trang hiện tại và chuyển đến account.html#address
  const editBtn = addressBox.querySelector('.edit-btn');
  editBtn.addEventListener('click', () => {
    // Lưu đường dẫn để quay lại
    localStorage.setItem('returnPage', 'payment.html');
    // Chuyển hướng đến tab địa chỉ
    window.location.href = 'Account.html#address';
  });
}


// ==================== RENDER PAYMENT PAGE ====================
async function renderPaymentPage() {
    // 1. KIỂM TRA ĐĂNG NHẬP
    const authRes = await fetch(`${API_BASE_URL}/users/checkAuth`, { credentials: "include" });
    const authData = await authRes.json();

    if (!authData.loggedIn) {
        alert("❌ Vui lòng đăng nhập để tiếp tục thanh toán!");
        window.location.href = "login.html";
        return;
    }

    // Gọi hàm khi load trang checkout và xác thực có user
    loadDefaultAddress();

    // Lấy dữ liệu sản phẩm đã chọn từ localStorage
    const selectedItems = JSON.parse(localStorage.getItem("checkoutCart") || "[]");

    if (selectedItems.length === 0) {
        // Nếu không có sản phẩm nào, chuyển hướng về giỏ hàng
        alert("❌ Giỏ hàng thanh toán trống. Vui lòng chọn sản phẩm.");
        window.location.href = "cart_page.html";
        return;
    }

    // 2. TÍNH TOÁN TỔNG CỘNG
    let subtotal = 0;
    let totalQuantity = 0;
    
    selectedItems.forEach(item => {
        subtotal += item.price * item.quantity;
        totalQuantity += item.quantity;
    });

    const finalShipping = subtotal > 0 ? SHIPPING_FEE : 0;
    const totalDiscount = DISCOUNT_MOCK; // Giả lập giảm giá
    const grandTotal = subtotal + finalShipping - totalDiscount;

    // 3. RENDER DANH SÁCH SẢN PHẨM
    const productListHtml = selectedItems.map(item => `
        <tr>
            <td class="product-img">
                <img src="${item.image_url}" alt="${item.name}">
            </td>
            <td class="product-name">
                ${item.name} 
            </td>
            <td class="product-price">${formatCurrency(item.price)}/ sp</td>
            <td class="product-qty">x${item.quantity} sản phẩm</td>
        </tr>
    `).join("");

    document.querySelector(".product-table").innerHTML = productListHtml;

    // 4. CẬP NHẬT TÓM TẮT ĐƠN HÀNG
    
    // Cập nhật phần Giao hàng
    document.querySelector(".shipping-fee").textContent = formatCurrency(finalShipping);
    document.querySelector(".total-line span:first-child").textContent = `Tổng số tiền (${totalQuantity} sản phẩm):`;
    document.querySelector(".total-price").textContent = formatCurrency(subtotal);

    // Cập nhật Chi tiết thanh toán
    document.querySelector(".summary-box table tr:nth-child(1) td:last-child").textContent = formatCurrency(subtotal);
    document.querySelector(".summary-box table tr:nth-child(2) td:last-child").textContent = formatCurrency(finalShipping);
    document.querySelector(".summary-box table tr:nth-child(3) td:last-child").textContent = `-${formatCurrency(totalDiscount)}`;
    document.querySelector(".summary-box table .total-row td:last-child").textContent = formatCurrency(grandTotal);


    // 5. ĐÍNH KÈM EVENT CHO NÚT ĐẶT HÀNG
    document.querySelector(".btn-submit").addEventListener("click", () => handlePlaceOrder(selectedItems));
}

// ==================== CALL API PLACE ORDER ====================
async function handlePlaceOrder(items) {
    if (confirm("Xác nhận đặt đơn hàng?")) {
        // Tái tính toán tổng tiền trên FE để gửi kèm (Backend sẽ tính toán lại)
        let subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const final_total = subtotal + SHIPPING_FEE - DISCOUNT_MOCK;
        const paymentMethod = document.getElementById('paymentMethod').value;
        try {
            const res = await fetch(`${API_BASE_URL}/orders/checkout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ 
                    items: items,
                    // total_amout: final_total // Khuyến nghị: Backend tự tính
                    payment_method: paymentMethod,
                })
            });

            const data = await res.json();

            if (res.ok) {
                alert(`✅ Đặt hàng thành công! Mã đơn hàng: ${data.order_id}. Tổng tiền: ${formatCurrency(data.total)}`);
                // Xóa cart đã checkout khỏi localStorage
                localStorage.removeItem("checkoutCart");
                // Chuyển hướng đến trang xác nhận đơn hàng hoặc trang chủ
                // window.location.href = "order_confirmation.html?id=" + data.order_id;
                // in bills (pdf)
            } else {
                alert(`❌ Lỗi đặt hàng: ${data.message || 'Không thể tạo đơn hàng.'}`);
            }

        } catch (err) {
            console.error("Lỗi API Checkout:", err);
            alert("❌ Lỗi hệ thống. Vui lòng thử lại sau.");
        }
    }
}


document.addEventListener("DOMContentLoaded", () => {
    renderPaymentPage();
});

