import db from "../config/database.js";

export const getAllProducts = async () => {
  const [rows] = await db.query(
    `SELECT p.*, c.category_name, s.supplier_name 
     FROM product p
     LEFT JOIN category c ON p.category_id = c.category_id
     LEFT JOIN supplier s ON p.supplier_id = s.supplier_id
     ORDER BY p.product_id DESC`
  );
  return rows;
};

export const getProductById = async (id) => {
  const [rows] = await db.query(
    `SELECT p.*, c.category_name, s.supplier_name 
     FROM product p
     LEFT JOIN category c ON p.category_id = c.category_id
     LEFT JOIN supplier s ON p.supplier_id = s.supplier_id
     WHERE p.product_id = ?`,
    [id]
  );
  return rows[0];
};

export const createProduct = async (product) => {
  const { category_id, supplier_id, admin_id, product_name, description, price, stock, image_url } = product;
  const [result] = await db.query(
    `INSERT INTO product (category_id, supplier_id, admin_id, product_name, description, price, stock, image_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [category_id, supplier_id, admin_id, product_name, description, price, stock, image_url]
  );
  return { id: result.insertId };
};

export const updateProduct = async (id, product) => {
  const { category_id, supplier_id, admin_id, product_name, description, price, stock, image_url } = product;
  const [result] = await db.query(
    `UPDATE product 
     SET category_id=?, supplier_id=?, admin_id=?, product_name=?, description=?, price=?, stock=?, image_url=? 
     WHERE product_id=?`,
    [category_id, supplier_id, admin_id, product_name, description, price, stock, image_url, id]
  );
  return result.affectedRows;
};

export const deleteProduct = async (id) => {
  const [result] = await db.query(`DELETE FROM product WHERE product_id=?`, [id]);
  return result.affectedRows;
};
