// =========================
// 0️⃣  CẤU HÌNH CƠ BẢN
// =========================
const PRODUCTS_PER_PAGE = 12;
let allProducts = [];
let currentPage = 1;

// =========================
// 1️⃣  ĐỊNH DẠNG GIÁ
// =========================
const formatPrice = (price) => {
  if (isNaN(price)) return '—';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
    .format(price)
    .replace('₫', 'đ');
};

// =========================
// 2️⃣  LOAD DANH MỤC
// =========================
async function loadCategories() {
  const listContainer = document.getElementById("categoryList");
  if (!listContainer) return;

  try {
    const response = await fetch(`${API_BASE_URL}/category`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const categories = await response.json();

    // let html = categories.map(cat => `<li>${cat.category_name}</li>`).join("");
    // ✅ Thêm input hidden chứa category_id
    let html = categories.map(cat => `
      <li class="category-item" data-id="${cat.category_id}">
        ${cat.category_name}
        <input type="hidden" name="category_id" value="${cat.category_id}">
      </li>
    `).join("");

    html += `
      <li class="highlight"><i class="fa-solid fa-tag"></i> Khuyến mãi</li>
      <li class="new"><i class="fa-solid fa-leaf"></i> Mới</li>
    `;

    listContainer.innerHTML = html;

    // ✅ Lấy lại danh sách phần tử sau khi innerHTML được gán
    const categoryItems = listContainer.querySelectorAll(".category-item, .highlight, .new");
    categoryItems.forEach(item => {
      item.addEventListener("click", handleCategoryClick);
    });
  } catch (error) {
    console.error("❌ Lỗi khi tải danh mục:", error);
    listContainer.innerHTML = "<li>Lỗi tải danh mục</li>";
  }
}

// =========================
// 3️⃣  CHUẨN HÓA DỮ LIỆU SẢN PHẨM
// =========================
const transformProductData = (rawProduct) => {

  const currentPriceNum = parseFloat(rawProduct.price);
  const oldPriceNum = parseFloat(rawProduct.old_price);

  let discount = "";
  if (!isNaN(currentPriceNum) && !isNaN(oldPriceNum) && oldPriceNum > currentPriceNum) {
    const percent = Math.round(((oldPriceNum / currentPriceNum) - 1) * 100);
    discount = `-${percent}%`;
  }

  return {
    id: rawProduct.product_id,
    name: rawProduct.product_name || "Sản phẩm chưa có tên",
    imagePath: `../${rawProduct.image_url}`,
    altText: rawProduct.product_name || "Hình sản phẩm",
    discount,
    currentPrice: formatPrice(currentPriceNum),
    oldPrice: formatPrice(oldPriceNum),
    rating: rawProduct.rating || 4.7,
    reviews: rawProduct.reviews || 22,
  };
};

// =========================
// 4️⃣  TẠO HTML CHO 1 SẢN PHẨM
// =========================
const createProductCardHTML = (product) => `
  <div class="product-card">
    ${product.discount ? `<div class="discount-tag">${product.discount}</div>` : ''}
    <img src="${product.imagePath}" alt="${product.altText}">
    <div class="product-info">
      <div class="rating">
        <span>⭐ ${product.rating}</span> | <span>${product.reviews} đánh giá</span>
      </div>
      <h3>${product.name}</h3>
      <p class="price">${product.currentPrice} <span class="old-price">${product.oldPrice}</span></p>
    </div>
    

    <input type="hidden" name="id_product" value="${product.id}">
  </div>
`;

// =========================
// 5️⃣  RENDER TRANG HIỆN TẠI
// =========================
function renderCurrentPage() {
  const productListElement = document.getElementById("bestseller-list");
  if (!productListElement) return;

  const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const end = start + PRODUCTS_PER_PAGE;

  const currentProducts = allProducts.slice(start, end);
  const productsHTML = currentProducts.map(createProductCardHTML).join("");
  productListElement.innerHTML = productsHTML;
}

// =========================
// 6️⃣  RENDER PHÂN TRANG
// =========================
function renderPagination(totalPages) {
  const pagination = document.querySelector(".pagination");
  if (!pagination) return;

  let html = `<a href="#" class="page-btn prev ${currentPage === 1 ? "disabled" : ""}">«</a>`;

  for (let i = 1; i <= totalPages; i++) {
    html += `<a href="#" class="page-btn ${i === currentPage ? "active" : ""}" data-page="${i}">${i}</a>`;
  }

  html += `<a href="#" class="page-btn next ${currentPage === totalPages ? "disabled" : ""}">»</a>`;

  pagination.innerHTML = html;

  pagination.querySelectorAll(".page-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      if (btn.classList.contains("disabled")) return;

      if (btn.classList.contains("prev")) {
        if (currentPage > 1) currentPage--;
      } else if (btn.classList.contains("next")) {
        if (currentPage < totalPages) currentPage++;
      } else {
        currentPage = parseInt(btn.dataset.page);
      }

      renderCurrentPage();
      renderPagination(totalPages);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

// =========================
// 7️⃣  LOAD & RENDER SẢN PHẨM
// =========================
async function renderProducts() {
  const productListElement = document.getElementById('bestseller-list');
  if (!productListElement) return;

  productListElement.innerHTML = `<p>⏳ Đang tải sản phẩm...</p>`;

  try {
    const response = await fetch(`${API_BASE_URL}/products`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const rawProducts = await response.json();

    if (!rawProducts.length) {
      productListElement.innerHTML = `<p>Hiện chưa có sản phẩm nào để hiển thị.</p>`;
      return;
    }

    allProducts = rawProducts.map(transformProductData);
    const totalPages = Math.ceil(allProducts.length / PRODUCTS_PER_PAGE);

    renderCurrentPage();
    renderPagination(totalPages);

  } catch (error) {
    console.error("❌ Lỗi khi tải sản phẩm:", error);
    productListElement.innerHTML = `<p>Không thể tải sản phẩm. Vui lòng thử lại sau.</p>`;
  }

  // CSS inline tự động
  if (!document.getElementById("inline-style")) {
    const style = document.createElement("style");
    style.id = "inline-style";
    style.textContent = `
      .old-price { text-decoration: line-through; color: #888; margin-left: 8px; font-size: 0.9rem; }
      .pagination { display: flex; justify-content: center; gap: 6px; margin-top: 20px; }
      .pagination a { padding: 6px 12px; background: #e8f6e1; color: #1f3d1f; border-radius: 6px; text-decoration: none; font-weight: bold; }
      .pagination a.active { background: #1f3d1f; color: white; }
      .pagination a.disabled { opacity: 0.5; pointer-events: none; }
    `;
    document.head.appendChild(style);
  }
}

// =========================
// 🆕  HÀM XỬ LÝ KHI CLICK DANH MỤC
// =========================
async function handleCategoryClick(event) {
  const listContainer = document.getElementById("categoryList");
  const categoryItems = listContainer.querySelectorAll(".category-item, .highlight, .new");

  // ❌ Xóa active cũ
  categoryItems.forEach(item => item.classList.remove("active"));

  // ✅ Thêm active cho mục vừa click
  this.classList.add("active");

  const li = event.currentTarget;
  const categoryId = li.dataset.id;

  // const categoryType = li.dataset.type; // 'sale' hoặc 'new' nếu có

  const productListElement = document.getElementById('bestseller-list');
  productListElement.innerHTML = `<p>⏳ Đang lọc sản phẩm...</p>`;

  try {
    let apiUrl = `${API_BASE_URL}/products`;

    // ✅ Nếu có category ID thì gọi API filter theo category
    if (categoryId) {
      apiUrl = `${API_BASE_URL}/category/${categoryId}`;
    }

    // ✅ Nếu là khuyến mãi hoặc mới
    // if (categoryType === "sale") {
    //   apiUrl = `${API_BASE_URL}/products?filter=sale`;
    // } else if (categoryType === "new") {
    //   apiUrl = `${API_BASE_URL}/products?filter=new`;
    // }

    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const rawProducts = await response.json();
    console.log('data_filter :', rawProducts);
    if (!rawProducts.length) {
      productListElement.innerHTML = `<p>Không có sản phẩm nào trong danh mục này.</p>`;
      return;
    }

    // Gọi lại hàm render sản phẩm
    allProducts = rawProducts.map(transformProductData);
    currentPage = 1;
    const totalPages = Math.ceil(allProducts.length / PRODUCTS_PER_PAGE);

    renderCurrentPage();
    renderPagination(totalPages);
    window.scrollTo({ top: 0, behavior: "smooth" });

  } catch (error) {
    console.error("❌ Lỗi khi lọc sản phẩm:", error);
    productListElement.innerHTML = `<p>Không thể tải sản phẩm. Vui lòng thử lại sau.</p>`;
  }
}

// =========================
// 🎚️ LỌC SẢN PHẨM THEO GIÁ
// =========================
const priceRange = document.getElementById("priceRange");
const maxPriceInput = document.getElementById("maxPriceInput");
const clearFilterBtn = document.getElementById("clearFilterBtn");
const priceValue = document.getElementById("priceValue"); // 👈 Thêm phần hiển thị giá

let debounceTimer;

// Hàm format tiền
const formatCurrency = (value) => {
  return new Intl.NumberFormat("vi-VN").format(value) + "đ";
};

if (priceRange && maxPriceInput && clearFilterBtn && priceValue) {

  // 🔹 Cập nhật giá hiển thị và gọi API khi kéo thanh trượt
  priceRange.addEventListener("input", async (e) => {
    const value = parseInt(e.target.value);
    maxPriceInput.value = value;
    priceValue.textContent = `${value.toLocaleString("vi-VN")}đ`;

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      filterByPrice(value);
    }, 1000);
  });

  // 🔹 Cập nhật giá hiển thị khi nhập trực tiếp
  maxPriceInput.addEventListener("input", async (e) => {
    let value = parseInt(e.target.value);
    if (isNaN(value)) value = 0;
    if (value > 5000000) value = 5000000;

    priceRange.value = value;
    priceValue.textContent = `${value.toLocaleString("vi-VN")}đ`;

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      filterByPrice(value);
    }, 1000);
  });
  //remove filter
  clearFilterBtn.addEventListener("click", async () => {
    priceRange.value = 0;
    maxPriceInput.value = 0;
    priceValue.textContent = "0đ";
    await renderProducts(); // gọi lại toàn bộ sản phẩm
  });
}

// =========================
// 🧠 HÀM GỌI API LỌC THEO GIÁ
// =========================
async function filterByPrice(maxPrice) {
  const productListElement = document.getElementById('bestseller-list');
  productListElement.innerHTML = `<p>⏳ Đang lọc sản phẩm...</p>`;

  try {
    const response = await fetch(`${API_BASE_URL}/products/filter?maxPrice=${maxPrice}`);
    console.log(response);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const rawProducts = await response.json();

    if (!rawProducts.length) {
      productListElement.innerHTML = `<p>Không có sản phẩm nào trong tầm giá này.</p>`;
      return;
    }

    allProducts = rawProducts.map(transformProductData);
    currentPage = 1;
    const totalPages = Math.ceil(allProducts.length / PRODUCTS_PER_PAGE);

    renderCurrentPage();
    renderPagination(totalPages);
    window.scrollTo({ top: 0, behavior: "smooth" });

  } catch (error) {
    console.error("❌ Lỗi khi lọc sản phẩm theo giá:", error);
    productListElement.innerHTML = `<p>Không thể lọc sản phẩm. Vui lòng thử lại sau.</p>`;
  }
}

// =========================
// 8️⃣  KHỞI CHẠY KHI LOAD TRANG
// =========================
document.addEventListener("DOMContentLoaded", () => {
  loadCategories();
  renderProducts();
});

// Khi click vào Giỏ hàng , chi tiết sp
document.getElementById("bestseller-list").addEventListener("click", async (e) => {

  // ✅ Nếu bấm vào nút giỏ hàng thì KHÔNG chuyển trang sản phẩm
  if (e.target.closest(".add-to-cart-btn")) {
    e.stopPropagation(); // chặn bubble click vào card
    const productId = e.target.closest(".add-to-cart-btn").dataset.productId;

    handleAddToCart(productId); // gọi hàm xử lý giỏ hàng
    return;
  }

  // ✅ Còn lại => chuyển sang trang chi tiết sản phẩm
  const card = e.target.closest(".product-card");
  if (card) {
    const id = card.querySelector('input[name="id_product"]').value;
    window.location.href = `products_detail.html?id=${id}`;
  }
});

// Search products
async function searchProducts() {
  const keyword = document.getElementById("searchInput").value.trim();

  currentPage = 1;
  const productListElement = document.getElementById("bestseller-list");
  productListElement.innerHTML = `<p>⏳ Đang tìm...</p>`;

  try {
    const response = await fetch(`${API_BASE_URL}/products?search=${encodeURIComponent(keyword)}`);
    const data = await response.json();

    allProducts = data.map(transformProductData);
    filteredProducts = allProducts;

    const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
    renderCurrentPage();
    renderPagination(totalPages);

  } catch (err) {
    productListElement.innerHTML = `<p>Lỗi tìm kiếm!</p>`;
  }
}

function initSearchEvents() {
  const searchBtn = document.getElementById("searchBtn");
  const searchInput = document.getElementById("searchInput");

  if (!searchBtn || !searchInput) return; // Trang không có search

  searchBtn.addEventListener("click", searchProducts);
  searchInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") searchProducts();
  });
}

function addToLocalCart(productId) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  const exist = cart.find(item => item.product_id === productId);

  if (exist) {
      exist.quantity += 1;
  } else {
      cart.push({
          product_id: productId,
          quantity: 1
      });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
}


async function addToServerCart(productId) {
  const res = await fetch(`${API_BASE_URL}/cart/add`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId })
  });

  const data = await res.json();
  if (!res.ok) {
      console.error("Server Cart Error: ", data.message);
  }
}

async function handleAddToCart(productId) {
  const user = await checkLoginStatus();

  if (!user) {
      // ❌ Local cart
      addToLocalCart(productId);
  } else {
      // ✅ Server cart
      await addToServerCart(productId);
  }

  // reload icon badge
  await loadCart();
}


