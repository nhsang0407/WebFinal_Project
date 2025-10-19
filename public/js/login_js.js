// Hàm hiển thị form đăng nhập
function showLogin() {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const promoImg = document.getElementById("promo-img");
    const loginBtn = document.getElementById("loginBtn");
    const registerBtn = document.getElementById("registerBtn");

    loginForm.classList.add("show");
    registerForm.classList.remove("show");

    promoImg.src = "../images/fruits.jpg"; //add hinh vo cho dung hinh

    loginBtn.classList.add("active");
    registerBtn.classList.remove("active");
}

// Hàm hiển thị form đăng ký
function showRegister() {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const promoImg = document.getElementById("promo-img");
    const loginBtn = document.getElementById("loginBtn");
    const registerBtn = document.getElementById("registerBtn");

    loginForm.classList.remove("show");
    registerForm.classList.add("show");

    promoImg.src = "../images/sale.jpg"; //add hinh vo cho dung hinh

    registerBtn.classList.add("active");
    loginBtn.classList.remove("active");
}

// Khởi tạo mặc định khi load trang
window.onload = async function () {
    // Lấy tham số từ URL (ví dụ: ?form=register)
    const params = new URLSearchParams(window.location.search);

    // Check Login 
    const isLogin = checkLoginStatus();
    if (isLogin.loggedIn) {
        alert("Đã Login rồi!");
        window.location.href = "../index.html";
        return;
    }

    const formType = params.get("form");

    // Kiểm tra người dùng bấm nút nào từ trang chủ
    if (formType === "register") {
        showRegister();
    } else {
        showLogin();
    }

    // Kiểm tra và tự động điền nếu đã lưu tài khoản
    const savedUsername = localStorage.getItem("savedUsername");
    const savedPassword = localStorage.getItem("savedPassword");
    if (savedUsername && savedPassword) {
        document.querySelector("#loginForm input[name='login_uid']").value = savedUsername;
        document.querySelector("#loginForm input[name='login_pwd']").value = savedPassword;
        document.querySelector("#loginForm input[type='checkbox']").checked = true;
    }
};

// Login action
async function process_login(login_uid, login_pwd) {
    const rememberBox = document.querySelector("#loginForm input[type='checkbox']");
    const res = await fetch(`${API_BASE_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: login_uid, password: login_pwd }),
        credentials: "include"
    });

    const data = await res.json();
    if (res.ok) {
        if (rememberBox.checked) { // is check remember 
            localStorage.setItem("savedUsername", login_uid);
            localStorage.setItem("savedPassword", login_pwd);
        } else {
            localStorage.removeItem("savedUsername");
            localStorage.removeItem("savedPassword");
        }

        alert("Đăng nhập thành công!");
        window.location.href = "../index.html";
    } else {
        alert(data.message);
    }
}


//Quên mật khẩu
function forgotPassword() {
    const username = prompt("Nhập tên đăng nhập của bạn:");
    if (!username) {
        alert("Bạn chưa nhập tên đăng nhập!");
        return;
    }

    // Lấy danh sách người dùng
    let users = JSON.parse(localStorage.getItem("users")) || [];

    // Tìm người dùng
    const userIndex = users.findIndex(u => u.username === username);
    if (userIndex === -1) {
        alert("Không tìm thấy tên đăng nhập này!");
        return;
    }

    const newPwd = prompt("Nhập mật khẩu mới:");
    if (!newPwd) {
        alert("Bạn chưa nhập mật khẩu mới!");
        return;
    }

    // Cập nhật mật khẩu
    users[userIndex].password = newPwd;
    localStorage.setItem("users", JSON.stringify(users));

    alert("Đặt lại mật khẩu thành công! Hãy đăng nhập lại với mật khẩu mới.");
}


//Xử lý đăng ký
async function process_register() {
    const username = document.getElementById("reg_uid").value.trim();
    const password = document.getElementById("reg_pwd").value;
    const confirm = document.getElementById("reg_pwd2").value;

    // Kiểm tra dữ liệu
    if (!username || !password || !confirm) {
        alert("Vui lòng nhập đầy đủ thông tin!");
        return;
    }
    // Kiểm tra độ mạnh mật khẩu
    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

    if (!passwordRegex.test(password)) {
        alert("Mật khẩu phải có ít nhất 8 ký tự, chứa ít nhất 1 chữ hoa và 1 ký tự đặc biệt!");
        return;
    }

    if (password !== confirm) {
        alert("Mật khẩu xác nhận không khớp!");
        return;
    }

    try {
        // Gọi API backend
        const response = await fetch(`${API_BASE_URL}/users/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (response.ok) {
            alert("Đăng ký thành công! Bạn có thể đăng nhập ngay.");
            showLogin(); // Chuyển sang form đăng nhập
        } else {
            alert(data.message);
        }

    } catch (error) {
        console.error("Register Error:", error);
        alert("Lỗi kết nối tới máy chủ. Vui lòng thử lại sau!");

    }
}

//Show password
function togglePassword() {
    const input = document.getElementById("login_pwd");
    const icon = document.querySelector(".toggle-password");

    if (input.type === "password") {
        input.type = "text";
        icon.textContent = "🙈"; // icon thay đổi khi show
    } else {
        input.type = "password";
        icon.textContent = "👁️"; // icon trở lại khi hide
    }
}

