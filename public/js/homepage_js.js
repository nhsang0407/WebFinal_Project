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

// 👉 Xử lý đăng xuất
document.addEventListener("DOMContentLoaded", function () {
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

            location.reload();
        };
    }
});
