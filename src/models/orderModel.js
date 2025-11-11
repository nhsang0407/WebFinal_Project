import db from "../config/database.js";

// Hàm này để tạo một bản ghi mới trong bảng orders
export const createOrder = async (customer_id, total_amount, status = 'Pending') => {
    const [result] = await db.query(
        "INSERT INTO orders (customer_id, total_amount, status, order_date) VALUES (?, ?, ?, NOW())",
        [customer_id, total_amount, status]
    );
    // Trả về ID của đơn hàng vừa tạo (dùng cho order_detail)

    return result.insertId;
};

// Hàm này để chèn chi tiết từng sản phẩm vào bảng order_detail
export const insertOrderDetail = async (order_id, product_id, quantity, unit_price) => {
    // Chú ý: product_id và unit_price nên là số
    const [result] = await db.query(
        "INSERT INTO order_detail (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)",
        [order_id, parseInt(product_id), quantity, parseFloat(unit_price)]
    );
    return result;
};

// Hàm xóa sản phẩm khỏi giỏ hàng sau khi thanh toán thành công
export const removeCartItem = async (cart_id, product_id) => {
    const [result] = await db.query(
        "DELETE FROM cart_item WHERE cart_id = ? AND product_id = ?",
        [cart_id, product_id]
    );
    return result;
};

// Lấy đơn hàng theo customer_id
export const getOrdersByCustomerId = async (customer_id) => {
    const [rows] = await db.query(
        "SELECT order_id, customer_id, order_date, total_amount, status FROM orders WHERE customer_id = ? ORDER BY order_date DESC",
        [customer_id]
    );
    return rows;
};

// Lấy chi tiết 1 đơn hàng theo order_id
export const getOrderDetailByOrderId = async (order_id) => {
    const [rows] = await db.query(
        `SELECT od.order_detail_id, od.order_id, od.product_id, od.quantity, od.unit_price,
                o.order_date,o.status,o.total_amount,
                p.product_name, p.image_url
         FROM order_detail od
         JOIN product p ON od.product_id = p.product_id
         JOIN orders o ON od.order_id = o.order_id
         WHERE od.order_id = ?`,
        [order_id]
    );
    return rows; // trả về mảng các sản phẩm trong đơn hàng
};

