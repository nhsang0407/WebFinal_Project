async function checkLoginStatus() {
  const res = await fetch(`${API_BASE_URL}/users/checkAuth`, {
    method: "GET",
    credentials: "include"
  });

  const data = await res.json();
  if (data.loggedIn) {
    console.log("Đã đăng nhập");
    return data;
  } else {
    console.log("Chưa đăng nhập");
    //window.location.href = "login.html";
    return false;
  }
}

async function logout() {
  try {
    const res = await fetch(`${API_BASE_URL}/users/logout`, {
      method: "POST",
      credentials: "include"
    });
    const data = await res.json();
    alert("Đã đăng xuất!");
    //window.location.reload();
  } catch (err) {
    console.error("Lỗi đăng xuất:", err);
  }
}

// include.js
document.addEventListener("DOMContentLoaded", async () => {
  // Chèn header
  const header = document.getElementById("header");
  if (header) {
    const res = await fetch("../components/header.html");
    header.innerHTML = await res.text();
      // ✅ Header đã render → kích hoạt sự kiện search
      initSearchEvents();

      // ✅ Sau khi header render xong, cập nhật avatar nếu có lưu trong localStorage
    const savedAvatar = localStorage.getItem("userAvatar");
    if (savedAvatar) {
      const headerAvatar = document.querySelector(".avatar");
      if (headerAvatar) headerAvatar.src = savedAvatar;
    }
  }

  // Chèn footer
  const footer = document.getElementById("footer");
  if (footer) {
    const res = await fetch("../components/footer.html");
    footer.innerHTML = await res.text();
  }

   // ===== BUTTON TO TOP =====
  const toTop = document.getElementById("to-top");
  if (toTop) {
    const res = await fetch("../components/to-top.html");
    toTop.innerHTML = await res.text();

    // Kích hoạt sự kiện scroll + click
    initToTopButton();
  }

  // Chatbot
  const script = document.createElement("script");
  script.innerHTML = `(function(){
            if(!window.chatbase || window.chatbase("getState")!=="initialized"){
                window.chatbase=(...arguments)=>{
                if(!window.chatbase.q){window.chatbase.q=[]}
                window.chatbase.q.push(arguments)
                };
                window.chatbase=new Proxy(window.chatbase,{
                get(target,prop){
                    if(prop==="q"){return target.q}
                    return(...args)=>target(prop,...args)
                }
                })
            }
            const onLoad=function(){
                const script=document.createElement("script");
                script.src="https://www.chatbase.co/embed.min.js";
                script.id="JeqjXkFQWDgmj-KK-iB0g";  //chatbot ID 
                script.domain="www.chatbase.co";
                document.body.appendChild(script);
            };
            if(document.readyState==="complete"){onLoad()}
            else{window.addEventListener("load",onLoad)}
            })();`;
  document.body.appendChild(script);

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.onclick = function (e) {
      e.preventDefault(); // Ngăn trình duyệt load lại trang khi click <a>
      logout(); // call logout funtion in main.js

      // Ẩn thông tin người dùng, hiện lại nút đăng nhập
      document.getElementById("userInfo").style.display = "none";
      document.getElementById("authButtons").style.display = "flex";

      // Ẩn menu dropdown
      document.getElementById("dropdownMenu").style.display = "none";

      window.location.href = "../index.html";
    };
  }

  // Lấy nút logout theo class
  const logoutBtn_acc = document.querySelector(".logout"); // nếu chỉ 1 nút
  if (logoutBtn_acc) {
    logoutBtn_acc.addEventListener("click", function (e) {
      e.preventDefault();
      logout(); // gọi hàm logout từ main.js


      // Ẩn thông tin người dùng và dropdown
      const userInfo = document.querySelector(".userInfo");
      const authButtons = document.querySelector(".authButtons");
      const dropdownMenu = document.querySelector(".dropdownMenu");

      if (userInfo) userInfo.style.display = "none";
      if (authButtons) authButtons.style.display = "flex";
      if (dropdownMenu) dropdownMenu.style.display = "none";

      // Quay về index
      window.location.href = "../index.html";
    });
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const selectElement = document.getElementById("searchCategory");
  if (!selectElement) return;

  // Bắt sự kiện 'change' khi user chọn option
  selectElement.addEventListener("change", (event) => {
    // Lấy giá trị option được chọn (nếu muốn dùng sau)
    const selectedValue = event.target.value;

    // Redirect sang products.html
    window.location.href = "/products.html";
  });
});

// ----- LẤY SỐ LƯỢNG GIỎ ----- //
async function loadCart() {
  const cartCountEl = document.getElementById("cart-count");
  if (!cartCountEl) return; // phòng trường hợp trang chưa có header

  let cartCount = 0;

  try {
      const user = await checkLoginStatus();

      if (user.loggedIn) {
          // ✅ đã login → lấy giỏ từ database
          const res = await fetch(`${API_BASE_URL}/cart`, { credentials: "include" });
          if (res.ok) {
              const items = await res.json();
              cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
          }
      } else {
          // ❌ chưa login → lấy local cart
          const cart = JSON.parse(localStorage.getItem("cart")) || [];
          cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
      }

  } catch (err) {
      console.error("Cart load error: ", err);
  }

  // cập nhật UI
  cartCountEl.textContent = cartCount;
  
  // nếu 0 thì ẩn đi cho đẹp
  cartCountEl.style.display = cartCount > 0 ? "inline-block" : "none";
}
document.addEventListener("DOMContentLoaded", () => {
  loadCart();
});



function initSearchEvents() {
  const searchInput = document.querySelector("#searchInput");
  const searchBtn = document.querySelector("#searchBtn");

  if (!searchInput || !searchBtn) {
    console.warn("Không tìm thấy search input hoặc button trong header.");
    return;
  }

  // Khi nhấn nút tìm kiếm
  searchBtn.addEventListener("click", () => {
    const keyword = searchInput.value.trim();
    if (keyword) {
      window.location.href = `/products.html?search=${encodeURIComponent(keyword)}`;
    }
  });

  // Khi nhấn Enter trong ô tìm kiếm
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      searchBtn.click();
    }
  });
}

// Hàm xử lý sự kiện của nút To Top
function initToTopButton() {
  const btn = document.querySelector(".to-top-btn");
  if (!btn) return;

  window.addEventListener("scroll", () => {
    if (window.scrollY > 200) {
      btn.classList.add("show");
    } else {
      btn.classList.remove("show");
    }
  });

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

