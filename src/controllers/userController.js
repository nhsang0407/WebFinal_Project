import bcrypt from "bcrypt";
import db from "../config/database.js";
import { findUserByIdentifier, createUser } from "../models/userModel.js";

// logic process when Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Kiểm tra đầu vào
    if (!email || !password) {
      return res.status(400).json({ message: "Email và mật khẩu là bắt buộc" });
    }

    // Tìm user trong DB thật
    const user = await findUserByIdentifier(email);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    // So sánh mật khẩu
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: "Sai mật khẩu" });
    }

    // Tạo session user
    req.session.user = {
      id: user.user_id,
      user_name: user.username,
      email: user.email,
      role: user.role || "customer"
    };

    // Đảm bảo session được lưu
    req.session.save((err) => {
      if (err) {
        console.error("[LOGIN] Lỗi khi lưu session:", err);
      } else {
        console.log(`[LOGIN] Session lưu thành công cho user: ${user.username}`);
      }
    });

    // Xác định trang redirect theo vai trò
    let redirectUrl = "../index.html";
    if (user.role === "admin" || user.role === "super_admin" || user.role === "staff") {
      redirectUrl = "../admin/admin.html";
    }

    console.log(`[LOGIN] ${user.username} (${user.email}) - Vai trò: ${user.role} - SessionID: ${req.sessionID}`);

    // Trả về phản hồi JSON
    res.json({
      message: "Đăng nhập thành công",
      user: req.session.user,
      redirectUrl: redirectUrl
    });

  } catch (err) {
    console.error("[LOGIN] Lỗi:", err);
    res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
};

// check Logged
export const checkAuth = (req, res) => {
  console.log("[CHECKAUTH] Checking authentication...");
  console.log("[CHECKAUTH] Session ID:", req.sessionID);
  console.log("[CHECKAUTH] Session data:", req.session);
  console.log("[CHECKAUTH] User in session:", req.session?.user);
  
  if (req.session.user) {
    console.log("[CHECKAUTH] ✅ User is authenticated:", req.session.user.user_name);
    res.json({ 
      loggedIn: true, 
      user: req.session.user,
      role: req.session.user.role,
      note: "Session verified"
    });
  } else {
    console.log("[CHECKAUTH] ❌ No user in session");
    res.json({ loggedIn: false });
  }
};

// process logout method
export const logout = (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ message: "Logout failed" });
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out" });
  });
};

// process logic register user
export const registerUser = async (req, res) => {
  try {
    const {
      fullName,
      dob,
      gender,
      phone,
      email,
      address,
      username,
      password
    } = req.body;
    console.log(req.body);

    // Kiểm tra dữ liệu bắt buộc
    if (!username || !password || !fullName || !email) {
      return res.status(400).json({ message: "Username, password, fullName, email are required" });
    }

    // Kiểm tra username hoặc email đã tồn tại
    const existingUser = await findUserByIdentifier(username);
    const existingMail = await findUserByIdentifier(email);
    if (existingUser || existingMail) {
      const field = existingUser ? "Username" : "Email";
      return res.status(400).json({ message: `${field} already exists` });
    }

    // Hash password 
    const password_hash = await bcrypt.hash(password, 10);

    // Tạo object user để insert
    const newUser = {
      username,
      email,
      password_hash,
      phone: phone || null,
      address: address || null,
      full_name: fullName || null,
      gender: gender || null,
      date_of_birth: dob || null,
      auth_id: null
    };

    // Insert user mới
    const newUserId = await createUser(newUser);
    // Insert user mới vào mock data
    const result = await mockUserModel.createUser(newUser);

    // Response
    res.status(201).json({
      message: "User registered successfully",
      user_id: newUserId.id, // lưu ý .id vì createUser trả về object
    });

  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


// get info User
export const userInfo = async (req, res) => {
  try {
    const email = req.query.email; // Lấy email từ query string
    const user = await findUserByIdentifier(email);

    //console.log(user);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const profile = {
      id: user.user_id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      address: user.address,
      gender: user.gender,
      date_of_birth: user.date_of_birth,
      role: user.role,
      loyalty_points: user.loyalty_points
    };

    return res.json({ message: "Method success", profile });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const changePassword = async (req, res) => {
  const { username, newPassword } = req.body;

  try {
    // 1️⃣ Kiểm tra người dùng tồn tại
    const [rows] = await db.query(
      "SELECT password_hash FROM user WHERE username = ?",
      [username]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Tài khoản không tồn tại" });
    }

    const user = rows[0];

    // 3️⃣ Hash mật khẩu mới
    const newHashedPassword = await bcrypt.hash(newPassword, 10);

    // 4️⃣ Cập nhật vào DB
    await db.query("UPDATE user SET password_hash = ? WHERE username = ?", [
      newHashedPassword,
      username,
    ]);
    await mockUserModel.updateUser(user.user_id, {
          password_hash: newHashedPassword
        });

    res.status(200).json({ message: "Đổi mật khẩu thành công" });
  } catch (error) {
    console.error("Lỗi khi đổi mật khẩu:", error);
    res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
};

export const userInfoSession = async (req, res) => {
  try {
    // Lấy user_id từ session
    if (!req.session.user) {
      return res.status(401).json({ message: "Chưa đăng nhập" });
    }

    const userId = req.session.user.id;

    const [rows] = await db.query(
      "SELECT user_id, full_name, email, phone, address, username, gender, date_of_birth FROM user WHERE user_id = ?",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0];

    // Lấy danh sách địa chỉ
    const [addressRows] = await db.query(
      `SELECT full_name AS name, phone, address AS address_text, 1 AS is_default
       FROM user
       WHERE user_id = ?`,
      [userId]
    );

    return res.json({
      message: "Success",
      user: {
        ...user,
        addresses: addressRows // trả về mảng addresses dù chỉ có 1
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};