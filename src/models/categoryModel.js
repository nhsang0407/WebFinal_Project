import db from "../config/database.js";

export const getAllCategories = async () => {
    const [rows] = await db.query("SELECT category_id, category_name FROM category");
    return rows;
  };

// --- Filter sản phẩm theo category_id ---
export const getProductsByCategory = async (id) => {
  const [rows] = await db.query(
    "SELECT * FROM product WHERE category_id = ?",
    [id]
  );
  return rows;
};