// ==============================
// LẤY ID SẢN PHẨM TỪ URL
// ==============================
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get("id");

if (!productId) {
  document.body.innerHTML = "<p>❌ Không tìm thấy sản phẩm!</p>";
} else {
  loadProductDetail(productId);
}

// ==============================
// GỌI API LẤY CHI TIẾT SẢN PHẨM
// ==============================
async function loadProductDetail(id) {
  try {
    const res = await fetch(`/api/products/${id}`);
    if (!res.ok) throw new Error("Không thể tải dữ liệu sản phẩm!");

    const product = await res.json();
    renderProductDetail(product);

    // 🔥 Sau khi có sản phẩm → load danh sách "Bạn có thể thích"
    loadRelatedProducts(product.category_id, product.product_id);

  } catch (error) {
    console.error("❌ Lỗi khi tải sản phẩm:", error);
    document.querySelector(".product_info").innerHTML = `
      <p class="error">Không thể tải chi tiết sản phẩm. Vui lòng thử lại sau.</p>
    `;
  }
}

// ==============================
// HIỂN THỊ DỮ LIỆU LÊN HTML
// ==============================
function renderProductDetail(p) {
  // Ảnh sản phẩm
  const imgEl = document.getElementById("product-image");
  imgEl.src = p.image_url ? `/${p.image_url}` : "/images/default.jpg";
  imgEl.alt = p.product_name || "Sản phẩm";

  // Tên sản phẩm
  document.getElementById("product-name").textContent =
    p.product_name || "Không có tên sản phẩm";

  // Mô tả ngắn
  document.getElementById("product-subtitle").textContent =
    p.description || "Sản phẩm nông sản tự nhiên từ Tây Nguyên";

  // Giá sản phẩm
  document.getElementById("product-price").textContent = p.price
    ? `${Number(p.price).toLocaleString()}đ`
    : "Liên hệ";

  document.getElementById("product-oldprice").textContent = p.old_price
    ? `${Number(p.old_price).toLocaleString()}đ`
    : "";

  // Mô tả chi tiết
  const detailHTML = (p.detail || "")
    .replace(/\n/g, "<br>")
    .replace(/•/g, "🔸");

  document.getElementById("product-description").innerHTML = `
    <div class="detail-text">
      ${detailHTML || "<p>Không có mô tả chi tiết cho sản phẩm này.</p>"}
    </div>
    <div class="product-extra">
      <p><strong>Danh mục:</strong> ${p.category_name || "Chưa rõ"}</p>
      <p><strong>Nhà cung cấp:</strong> ${p.supplier_name || "HiAn"}</p>
      <p><strong>Tình trạng:</strong> ${p.stock > 0 ? "✅ Còn hàng" : "❌ Hết hàng"
    }</p>
    </div>
  `;

  // Nút tăng giảm số lượng
  const counterEl = document.getElementById("counter");
  document.getElementById("increase").addEventListener("click", () => {
    counterEl.textContent = parseInt(counterEl.textContent) + 1;
  });
  document.getElementById("decrease").addEventListener("click", () => {
    const value = parseInt(counterEl.textContent);
    if (value > 1) counterEl.textContent = value - 1;
  });

  // Thêm vào giỏ hàng
  document.getElementById("addCart").addEventListener("click", async () => {
    const quantity = parseInt(counterEl.textContent);

    try {
      // Kiểm tra login
      const authRes = await fetch(`${API_BASE_URL}/users/checkAuth`, { credentials: "include" });
      const authData = await authRes.json();

      let cart = []; // Khai báo biến cart ở đây

      if (authData.loggedIn) {
        // 1. Thêm vào DB
        const res = await fetch(`${API_BASE_URL}/cart/add`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ product_id: p.product_id, quantity })
        });
        const data = await res.json();

        if (res.ok) {
          alert(`🛒 ${data.message}`);

          // --- Lấy lại cart từ server để cập nhật header ---
          const cartRes = await fetch(`${API_BASE_URL}/cart`, { credentials: "include" });
          const cartData = await cartRes.json();

          // Gán lại cho biến cart đã khai báo bên ngoài
          cart = cartData.items || [];

          // --- Cập nhật icon header ---
          const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
          const el = document.getElementById("cart-count");
          if (el) el.textContent = totalItems;

          // --- Lưu cart tạm vào localStorage để cart_page sử dụng ngay ---
          // 🔥 SỬ DỤNG localStorage
          //localStorage.setItem("cart", JSON.stringify(cart));

          // KHÔNG return ở đây để chạy cập nhật header và chuyển hướng chung bên dưới
        } else {
          alert("❌ Lỗi khi thêm sản phẩm vào giỏ hàng!");
        }
      }
      else {
        // 2. Chưa login → lưu vào localStorage
        cart = JSON.parse(localStorage.getItem("cart") || "[]"); // Đã dùng localStorage.getItem
        const idx = cart.findIndex(i => i.product_id === p.product_id);

        if (idx >= 0) cart[idx].quantity += quantity;
        else cart.push({
          product_id: p.product_id,
          product_name: p.product_name,
          image_url: p.image_url,
          price: Number(p.price),
          quantity
        });

        localStorage.setItem("cart", JSON.stringify(cart)); // Đã dùng localStorage.setItem
        alert(`🛒 Đã thêm ${quantity} "${p.product_name}" vào giỏ hàng!`);
      }

      // ==================== CHẠY SAU KHI XỬ LÝ (CHUNG CHO CẢ 2 TRƯỜNG HỢP) ====================

      // --- Cập nhật Header (nếu giỏ hàng đã được lấy/tính toán) ---
      // (Hàm này đã được bạn định nghĩa ở cuối code, cần đặt bên ngoài listener)
      // updateCartCount(cart); 

      // Lưu ý: Nếu updateCartCount được định nghĩa trong hàm lắng nghe (listener)
      // nó sẽ không thể gọi từ bên ngoài. Tôi giả định updateCartCount nằm bên ngoài.

      // Chuyển sang trang giỏ hàng
      window.location.href = "cart_page.html";

    } catch (err) {
      console.error(err);
      alert("❌ Lỗi khi thêm sản phẩm vào giỏ hàng!");
    }
  });
}

// ==========================
// LOAD SẢN PHẨM "BẠN CÓ THỂ THÍCH"
// ==========================
async function loadRelatedProducts(categoryId, currentProductId) {
  try {
    const response = await fetch(`/api/category/${categoryId}`);
    if (!response.ok) throw new Error("Không thể tải danh mục liên quan");

    const related = await response.json();

    const container = document.querySelector(".like-products");
    container.innerHTML = ""; // Xóa nội dung cũ

    if (!related.length) {
      container.innerHTML = "<p>Không có sản phẩm cùng danh mục.</p>";
      return;
    }

    related
      .filter(p => p.product_id !== currentProductId)
      .forEach(p => {
        container.innerHTML += `
          <div class="product-card" onclick="window.location.href='/products_detail.html?id=${p.product_id}'">
            <div class="image-container">
              <img src="${p.image_url ? `/${p.image_url}` : "/images/default.jpg"}" alt="${p.product_name}">
            </div>
            <div class="product-info">
              <h3>${p.product_name}</h3>
              <p class="price">${Number(p.price).toLocaleString()}đ</p>
            </div>
          </div>
        `;
      });
  } catch (error) {
    console.error("❌ Lỗi khi load sản phẩm liên quan:", error);
  }
}



