// Hàm hiển thị form đăng nhập
function showLogin() {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const promoImg = document.getElementById("promo-img");
    const loginBtn = document.getElementById("loginBtn");
    const registerBtn = document.getElementById("registerBtn");

    loginForm.classList.add("show");
    registerForm.classList.remove("show");

    promoImg.src = "../images/out/combo best seller.png"; //add hinh vo cho dung hinh

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

    promoImg.src = "../images/out/Signup.png"; //add hinh vo cho dung hinh

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
    try {
        const rememberBox = document.querySelector("#loginForm input[type='checkbox']");
        
        // Step 1: Send login request
        const res = await fetch(`${API_BASE_URL}/users/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: login_uid, password: login_pwd }),
            credentials: "include"
        });

        const data = await res.json();
        
        if (!res.ok) {
            alert(data.message || "Đăng nhập thất bại!");
            return;
        }

        // Step 2: Login successful - handle remember checkbox
        if (rememberBox.checked) {
            localStorage.setItem("savedUsername", login_uid);
            localStorage.setItem("savedPassword", login_pwd);
        } else {
            localStorage.removeItem("savedUsername");
            localStorage.removeItem("savedPassword");
        }

        alert("Đăng nhập thành công!");

        // Step 3: Determine redirect URL
        const redirectUrl = data.redirectUrl || "../index.html";

        // Step 4: For admin redirects, wait a moment for session to settle, then redirect
        const looksLikeAdmin = /\/admin\//i.test(redirectUrl) || /admin(-|_)?dashboard|admin\.html/i.test(redirectUrl);
        
        if (looksLikeAdmin) {
            console.log("Admin redirect detected, waiting for session to settle...");
            // Wait 800ms for session to be established on server
            await new Promise(r => setTimeout(r, 800));
            
            // Then verify session is set before redirect
            try {
                const checkRes = await fetch(`${API_BASE_URL}/users/checkAuth`, { 
                    method: 'GET', 
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' }
                });
                
                if (checkRes.ok) {
                    const checkData = await checkRes.json();
                    if (checkData && checkData.loggedIn) {
                        const role = checkData.role || checkData.user?.role;
                        if (role === 'admin' || role === 'super_admin' || role === 'staff') {
                            console.log(`✅ Session verified for admin role: ${role}`);
                            window.location.href = redirectUrl;
                            return;
                        }
                    }
                }
            } catch (err) {
                console.warn("Could not verify session before redirect, proceeding anyway:", err);
            }
        }

        // Redirect to the target URL
        console.log("Redirecting to:", redirectUrl);
        window.location.href = redirectUrl;
        
    } catch (error) {
        console.error("Login error:", error);
        alert("Lỗi kết nối. Vui lòng kiểm tra kết nối mạng và thử lại!");
    }
}


//Quên mật khẩu
async function changePassword() {
    const email = prompt("Vui lòng nhập địa chỉ email của bạn:");
    if (!email) {
        alert("Bạn chưa nhập email!");
        return;
    }

    //change_password.html
    try {
        // Gọi BE để lấy thông tin user
        const response = await fetch(`${API_BASE_URL}/users/profile?email=${encodeURIComponent(email)}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                alert("Không tìm thấy người dùng với email này!");
            } else {
                alert("Lỗi máy chủ. Vui lòng thử lại sau!");
            }
            return;
        }
        // move page
        window.location.href = 'change_password.html';
    } catch (error) {
        console.error("Lỗi khi gọi API:", error);
        alert("Không thể kết nối đến máy chủ!");
    }

}


//Xử lý đăng ký
async function process_register() {
    const fullName = document.getElementById("full_name").value.trim();
    const dob = document.getElementById("dob").value;
    const genderEl = document.querySelector('input[name="gender"]:checked');
    const gender = genderEl ? genderEl.value : "";
    const phone = document.getElementById("phone").value.trim();
    const email = document.getElementById("email").value.trim();
    const address = document.getElementById("address").value.trim();
    const username = document.getElementById("reg_uid").value.trim();
    const password = document.getElementById("reg_pwd").value;
    const confirm = document.getElementById("reg_pwd2").value;

    // Kiểm tra dữ liệu
    if (!fullName || !dob || !gender || !phone || !email || !address || !username || !password || !confirm) {
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

    // Tạo object dữ liệu để gửi lên backend
    const payload = {
        fullName,
        dob,
        gender,
        phone,
        email,
        address,
        username,
        password
    };
    //console.log(payload);
    try {
        const response = await fetch(`${API_BASE_URL}/users/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
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

// proccess login with google
function google_authentication() {
    //  call api google authentication
    window.location.href = `${API_BASE_URL}/users/google`;
}

// PASSWORD
async function change_pw() {
    const username = document.getElementById("user_name").value.trim();
    const newPassword = document.getElementById("new_password").value.trim();
    const confirmPassword = document.getElementById("confirm_password").value.trim();
  
    // ========== 1️⃣ Validate form ==========
    if (!username) {
      alert("Vui lòng nhập mã xác nhận (tên tài khoản)!");
      return;
    }
  
    if (!newPassword) {
      alert("Vui lòng nhập mật khẩu mới!");
      return;
    }
  
    // Kiểm tra độ dài mật khẩu
    if (newPassword.length < 8 || newPassword.length > 20) {
      alert("Mật khẩu phải từ 8 đến 20 ký tự!");
      return;
    }
  
    // Regex kiểm tra mật khẩu hợp lệ
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$^*()_]).{8,20}$/;
    if (!passwordRegex.test(newPassword)) {
      alert("Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt!");
      return;
    }
  
    // Kiểm tra khớp mật khẩu xác nhận
    if (newPassword !== confirmPassword) {
      alert("Mật khẩu xác nhận không khớp!");
      return;
    }
  
    // ========== 2️⃣ Gọi API BE ==========
    try {
      const response = await fetch(`${API_BASE_URL}/users/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username,
          newPassword: newPassword
        })
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        alert(data.message || "Đổi mật khẩu thất bại!");
        return;
      }
  
      alert(data.message);
      // Chuyển hướng sau khi đổi mật khẩu thành công
      window.location.href = "login.html";
    } catch (error) {
      console.error("Lỗi khi gọi API:", error);
      alert("Không thể kết nối đến máy chủ. Vui lòng thử lại sau!");
    }
  }