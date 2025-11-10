window.onload = async function () {
    const loggedUser = await checkLoginStatus();

    const userInfo = document.getElementById("userInfo");
    const authButtons = document.getElementById("authButtons");
    const usernameDisplay = document.getElementById("usernameDisplay");

    if (loggedUser.loggedIn) {
        // Hiện tên người dùng
        usernameDisplay.textContent = loggedUser.user_name;
        userInfo.style.display = "flex";
        authButtons.style.display = "none";
    } else {
        userInfo.style.display = "none";
        authButtons.style.display = "flex";
    }
};

// 👉 Hàm này sẽ được gọi khi click vào .user-info
function toggleMenu(event) {
    event.stopPropagation(); // Ngăn sự kiện lan ra document
    const menu = document.getElementById("dropdownMenu");
    menu.style.display = (menu.style.display === "block") ? "none" : "block";
}

// 👉 Đóng menu khi click ra ngoài
document.onclick = function (e) {
    const userInfo = document.getElementById("userInfo");
    const menu = document.getElementById("dropdownMenu");
    if (!userInfo.contains(e.target)) {
        menu.style.display = "none";
    }
};

document.addEventListener("DOMContentLoaded", () => {
  const slider = document.querySelector('.banner-slider');
  const slides = document.querySelectorAll('.banner-img');
  const totalSlides = slides.length;
  let currentSlide = 0;

  function updateSlide() {
    if (!slider) {
      console.error("Không tìm thấy phần tử .banner-slider");
      return;
    }
    slider.style.transform = `translateX(-${currentSlide * 100}%)`;
  }

  function changeSlide(direction) {
    currentSlide = (currentSlide + direction + totalSlides) % totalSlides;
    updateSlide();
  }

  // 🔹 Thêm dòng này để HTML có thể gọi được hàm
  window.changeSlide = changeSlide;

  setInterval(() => {
    changeSlide(1);
  }, 5000);
});



