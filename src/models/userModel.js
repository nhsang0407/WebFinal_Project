import db from "../config/database.js";

export const findUserByIdentifier = async (identifier) => {
  const [rows] = await db.query(
    "SELECT * FROM user WHERE email = ? OR username = ?",
    [identifier, identifier]
  );
  return rows[0];
};

export const createUser = async (userData) => {
  const {
    username,
    email,
    password_hash,
    phone = null,
    address = null,
    profile_picture = null,
    gender = null,
    date_of_birth = null,
    role = "customer",
    loyalty_points = 0,
    is_active = 1,
  } = userData;

  const [result] = await db.query(
    `INSERT INTO user 
    (username, email, password_hash, phone, address, profile_picture, gender, date_of_birth, role, loyalty_points, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      username,
      email,
      password_hash,
      phone,
      address,
      profile_picture,
      gender,
      date_of_birth,
      role,
      loyalty_points,
      is_active,
    ]
  );

  return result.insertId;
};
