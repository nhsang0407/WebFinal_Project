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
      //window.location.href = "/login.html";
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
      window.location.reload();
    } catch (err) {
      console.error("Lỗi đăng xuất:", err);
    }
}

