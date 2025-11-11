// ==================== FORMAT MONEY ====================
function formatCurrency(amount) {
  return amount.toLocaleString("vi-VN") + "đ";
}

// ==================== UPDATE HEADER CART COUNT ====================
function updateCartCount(cart) {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const el = document.getElementById("cart-count");
  if (el) el.textContent = totalItems;
}

// ==================== RENDER CART ====================
async function renderCartPage() {
  const cartBody = document.getElementById("cartBody");
  let cart = [];

  // Kiểm tra login
  const authRes = await fetch(`${API_BASE_URL}/users/checkAuth`, { credentials: "include" });
  const authData = await authRes.json();

  if (authData.loggedIn) {
    // --- 1. ĐÃ LOGIN: Lấy giỏ hàng TỪ DB ---
    const res = await fetch(`${API_BASE_URL}/cart`, { credentials: "include" });
    const data = await res.json();
    cart = data.items || [];
    console.log("Cart loaded from DB:", data);

    // --- 2. MERGE: Nếu có giỏ hàng trong localStorage (Guest Cart) → Push vào DB ---
    const localCart = JSON.parse(localStorage.getItem("cart") || "[]");
    if (localCart.length) {
      console.log("Merging local cart to DB...");
      for (const item of localCart) {
        await fetch(`${API_BASE_URL}/cart/add`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ product_id: item.product_id, quantity: item.quantity })
        });
      }
      // Xóa giỏ hàng tạm sau khi merge
      localStorage.removeItem("cart");

      // --- Reload cart DB sau khi merge ---
      const res2 = await fetch(`${API_BASE_URL}/cart`, { credentials: "include" });
      cart = (await res2.json()).items || [];
      console.log("Cart reloaded after merge:", cart);
    }
  } else {
    // --- 3. GUEST: Lấy giỏ hàng từ localStorage ---
    cart = JSON.parse(localStorage.getItem("cart") || "[]");
    console.log("Cart loaded from localStorage:", cart);
  }

  // Nếu rỗng
  if (!cart.length) {
    cartBody.innerHTML = `<tr><td colspan="4">Giỏ hàng trống</td></tr>`;
    updateCartTotal();
    updateCartCount([]);
    return;
  }

  // Render cart
  cartBody.innerHTML = cart.map(item => {
    const price = Number(item.price || item.currentPrice || item.unit_price || 0);
    const quantity = item.quantity || 1;
    return `
      <tr data-id="${item.product_id}">
        <td>
          <label class="cart-item">
            <input type="checkbox" class="select-item" checked>
            <img src="${item.image_url}">
            <div class="item-name">${item.product_name}</div>
          </label>
        </td>
        <td>${formatCurrency(price)}</td>
        <td>
          <div class="qty-box" data-price="${price}">
            <button class="minus" type="button">−</button>
            <input type="number" value="${quantity}" min="1">
            <button class="plus" type="button">+</button>
          </div>
        </td>
        <td class="total-col">${formatCurrency(price * quantity)}</td>
      </tr>`;
  }).join("");

  attachEvents();
  updateCartTotal();
  updateCartCount(cart);
}

// ==================== ATTACH EVENTS ====================
function attachEvents() {
  // Tăng/giảm số lượng
  document.querySelectorAll(".qty-box").forEach(qtyBox => {
    const minusBtn = qtyBox.querySelector(".minus");
    const plusBtn = qtyBox.querySelector(".plus");
    const input = qtyBox.querySelector("input");
    const price = Number(qtyBox.dataset.price);

    const update = () => updateRow(qtyBox, price);

    minusBtn.onclick = () => { if (input.value > 1) input.value = Number(input.value) - 1; update();};
    plusBtn.onclick = () => { input.value = Number(input.value) + 1; update(); };
    input.onchange = () => { input.value = Math.max(1, Number(input.value) || 1); update(); };
  });

  // Checkbox chọn sản phẩm
  document.querySelectorAll(".select-item").forEach(cb => cb.onchange = () => { updateCartTotal(); });
}

// ==================== UPDATE ROW ====================
async function updateRow(qtyBox, price) {
  const qty = Number(qtyBox.querySelector("input").value);
  const totalCell = qtyBox.closest("tr").querySelector(".total-col");
  const productId = qtyBox.closest("tr").dataset.id;

  // 1. CẬP NHẬT CỘT TẠM TÍNH TRONG BẢNG LIST CART
  totalCell.textContent = formatCurrency(price * qty);

  // 2. XỬ LÝ LOGIC LƯU TRỮ (GUEST vs LOGIN)
  const authRes = await fetch(`${API_BASE_URL}/users/checkAuth`, { credentials: "include" });
  const authData = await authRes.json();

  let cart = []; // Khởi tạo cart state

  if (authData.loggedIn) {
    // --- ĐÃ LOGIN: Gửi API cập nhật lên DB ---
    // Giả sử API /cart/update sẽ nhận product_id và quantity
    await fetch(`${API_BASE_URL}/cart/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ product_id: productId, quantity: qty })
    });

    // Cập nhật lại state cart từ DB để tính tổng tiền chính xác
    const res = await fetch(`${API_BASE_URL}/cart`, { credentials: "include" });
    cart = (await res.json()).items || [];

  } else {
    // --- GUEST: Cập nhật localStorage ---
    cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const idx = cart.findIndex(i => i.product_id == productId);
    if (idx >= 0) {
      cart[idx].quantity = qty;
      localStorage.setItem("cart", JSON.stringify(cart));
    }
  }

  // 3. CẬP NHẬT TỔNG TIỀN CHUNG VÀ HEADER
  updateCartTotal();
  updateCartCount(cart);
}

// ==================== UPDATE TOTAL ====================
function updateCartTotal() {
  let subtotal = 0;
  document.querySelectorAll("#cartBody tr").forEach(row => {
    const cb = row.querySelector(".select-item");
    const qtyInput = row.querySelector(".qty-box input[type='number']");
    if (cb && cb.checked) {
      const priceValue = row.querySelector(".qty-box").dataset.price;
      const price = parseInt(priceValue || '0');
      const qty = Number(qtyInput.value);

      console.log("Price:", price, "Qty:", qty);

      if (!isNaN(price) && !isNaN(qty)) {
        subtotal += price * qty;
      }
    }
  });

  const shipping = subtotal > 0 ? 30000 : 0;
  const grand = subtotal + shipping;
  console.log('subTotal', subtotal);

  document.getElementById("subtotal").textContent = formatCurrency(subtotal);
  document.getElementById("shipping").textContent = formatCurrency(shipping);
  document.getElementById("grandtotal").textContent = formatCurrency(grand);
}

// ==================== INIT ====================
document.addEventListener("DOMContentLoaded", async () => {
  await renderCartPage(); // đảm bảo cart đã render xong

  // Tiếp tục xem sản phẩm
  document.querySelector(".btn-continue")?.addEventListener("click", () => {
    window.location.href = "products.html";
  });

  // ==================== SAVE SELECTED ITEMS TO SESSION ====================
  async function saveCheckoutCart() {
     const selectedItems = [];
     document.querySelectorAll("#cartBody tr").forEach(row => {
      const cb = row.querySelector(".select-item");
      if (cb && cb.checked) {
       const productId = row.dataset.id;
       const quantity = Number(row.querySelector(".qty-box input[type='number']").value);
       const price = Number(row.querySelector(".qty-box").dataset.price);
       const name = row.querySelector(".item-name").textContent;
       const image_url = row.querySelector("img").src;
    
       selectedItems.push({ product_id: productId, quantity, price, image_url, name });
      }
     });
     localStorage.setItem("checkoutCart", JSON.stringify(selectedItems)); 
    }
  // Thanh toán
  document.querySelector(".btn-checkout")?.addEventListener("click", async () => {
    const authRes = await fetch(`${API_BASE_URL}/users/checkAuth`, { credentials: "include" });
    const authData = await authRes.json();

    if (!authData.loggedIn) {
      alert("❌ Vui lòng đăng nhập để thanh toán!");
      window.location.href = "login.html";
      return;
    }

    // Lưu các sản phẩm được chọn vào localStorage
    await saveCheckoutCart();

    // Điều hướng tới trang payment
    window.location.href = "payment.html";
  });
});
