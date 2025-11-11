import db from "../config/database.js";

/**
 * Lấy giỏ hàng theo user_id
 * @param {number} user_id 
 * @returns {object|null} cart row or null
 */
export const getCartByUser = async (user_id) => {
  const [rows] = await db.query(
    "SELECT * FROM cart WHERE customer_id = ?", 
    [user_id]
  );
  return rows[0] || null;
};

/**
 * Tạo giỏ hàng mới cho user
 * @param {number} user_id
 * @returns {number} cart_id vừa tạo
 */
export const createCart = async (user_id) => {
  const [result] = await db.query(
    "INSERT INTO cart (customer_id) VALUES (?)", 
    [user_id]
  );
  return result.insertId;
};

/**
 * Lấy toàn bộ item trong giỏ theo cart_id
 * @param {number} cart_id
 * @returns {Array} danh sách sản phẩm trong giỏ
 */
export const getCartItems = async (cart_id) => {
  const [rows] = await db.query(
    `SELECT ci.cart_item_id, ci.quantity, p.product_id, p.product_name, p.price, p.image_url
     FROM cart_item ci
     JOIN product p ON ci.product_id = p.product_id
     WHERE ci.cart_id = ?`,
    [cart_id]
  );
  return rows;
};

/**
 * Kiểm tra sản phẩm đã tồn tại trong giỏ chưa
 * @param {number} cart_id 
 * @param {number} product_id 
 * @returns {object|null}
 */
export const getCartItem = async (cart_id, product_id) => {
  const [rows] = await db.query(
    "SELECT * FROM cart_item WHERE cart_id = ? AND product_id = ?",
    [cart_id, product_id]
  );
  return rows[0] || null;
};

/**
 * Thêm sản phẩm mới vào giỏ
 * @param {number} cart_id
 * @param {number} product_id
 * @param {number} quantity
 */
export const insertCartItem = async (cart_id, product_id, quantity) => {
  await db.query(
    "INSERT INTO cart_item (cart_id, product_id, quantity) VALUES (?,?,?)",
    [cart_id, product_id, quantity]
  );
};

/**
 * Cập nhật số lượng sản phẩm trong giỏ
 * @param {number} cart_item_id
 * @param {number} quantity
 */
export const updateQuantity = async (cart_item_id, quantity) => {
  await db.query(
    "UPDATE cart_item SET quantity = ? WHERE cart_item_id = ?",
    [quantity, cart_item_id]
  );
};

/**
 * Xoá 1 sản phẩm khỏi giỏ
 * @param {number} cart_item_id
 */
export const deleteCartItem = async (cart_item_id) => {
  await db.query(
    "DELETE FROM cart_item WHERE cart_item_id = ?", 
    [cart_item_id]
  );
};

/**
 * Xoá toàn bộ giỏ hàng theo user_id
 * @param {number} user_id
 */
export const deleteCartByUser = async (user_id) => {
  await db.query(
    "DELETE FROM cart WHERE customer_id = ?", 
    [user_id]
  );
};
