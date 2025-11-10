import db from "../config/database.js";

// tìm user theo username hoặc email
export const findUserByIdentifier = async (identifier) => {
  const [rows] = await db.query(
    "SELECT * FROM user WHERE email = ? OR username = ?",
    [identifier, identifier]
  );
  return rows[0];
};

// Tìm user theo Google ID
export const findUserByGoogleId = async (googleId) => {
  const [rows] = await db.query(
    "SELECT * FROM user WHERE auth_id = ?",
    [googleId]
  );

  if (rows.length===0) return null;

  return {
    id: rows[0].id
  };
};

// Tạo user mới
export const createUser = async (userData) => {
  const {
    username,
    email,
    password_hash,
    phone = null,
    address = null,
    full_name = null,
    gender = null,
    date_of_birth = null,
    role = "customer",
    loyalty_points = 0,
    is_active = 1,
    auth_id
  } = userData;

  const [result] = await db.query(
    `INSERT INTO user 
    (username, email, password_hash, phone, address, full_name, gender, date_of_birth, role, loyalty_points, is_active, auth_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      username,
      email,
      password_hash,
      phone,
      address,
      full_name,
      gender,
      date_of_birth,
      role,
      loyalty_points,
      is_active,
      auth_id
    ]
  );

  return {
    id: result.insertId,
    username,
    email,
    auth_id,
  };
};

// tìm user theo id
export const findUserById = async (id) => {
  const [rows] = await db.query("SELECT * FROM user WHERE id = ?", [id]);
  return {
    id:rows[0].user_id,
    username:rows[0].username,
    email:rows[0].email,
    auth_id:rows[0].auth_id,
  };
};
