
import * as orderModel from '../models/orderModel.js';
import * as paymentModel from '../models/paymentModel.js';
import { getCartByUser } from "../models/cartModel.js";

export const createOrder = async (req, res) => {
    try {
        // 1. KIỂM TRA XÁC THỰC
        if (!req.session.user) {
            return res.status(401).json({ message: "Not logged in" });
        }
        
        const customer_id = req.session.user.id;
        
        // items: là mảng sản phẩm đã chọn từ FE (selectedItems)
        const { items, payment_method } = req.body;
        // console.log(items);

        if (!items || items.length === 0) {
            return res.status(400).json({ message: "No items selected for checkout." });
        }

        // 2. TÍNH TỔNG TIỀN (Backend phải tự tính toán để đảm bảo an toàn)
        let total_amount = 0;
        for (const item of items) {
            // Đảm bảo giá và số lượng là số
            const price = parseFloat(item.price);
            const qty = parseInt(item.quantity);
            if (isNaN(price) || isNaN(qty) || price < 0 || qty < 1) {
                 return res.status(400).json({ message: "Invalid price or quantity." });
            }
            total_amount += price * qty;
        }

        // 3. TẠO ĐƠN HÀNG (Bảng orders)
        // Lưu ý: Thêm phí vận chuyển, mã giảm giá nếu có vào total_amount
        const final_total = total_amount + 30000; // Ví dụ thêm 30,000đ phí vận chuyển
        
        const order_id = await orderModel.createOrder(customer_id, final_total, 'Pending');
        
        
        // 4. CHÈN CHI TIẾT ĐƠN HÀNG (Bảng order_detail)
        for (const item of items) {
            await orderModel.insertOrderDetail(
                order_id,
                item.product_id,
                item.quantity,
                item.price // Dùng giá đơn vị từ FE (nên kiểm tra lại với giá gốc trong DB)
            );
            
            // 5. XÓA SẢN PHẨM KHỎI GIỎ HÀNG (Nếu thanh toán thành công)
            // Lấy cart_id của user
            const cart = await getCartByUser(customer_id); 
            if (cart) {
                await orderModel.removeCartItem(cart.cart_id, item.product_id);
            }
        }

        // 3. TẠO BẢN GHI THANH TOÁN (Bảng payment)
        // Nếu là COD, trạng thái mặc định là 'Pending', nếu là thanh toán online, có thể là 'Paid' sau khi cổng thanh toán xác nhận.
        const initial_payment_status = (payment_method && payment_method.toLowerCase() === 'cash') ? 'Pending' : 'Pending'; 

        const payment_id = await paymentModel.insertPayment(
            order_id, 
            payment_method, 
            initial_payment_status
        );

        res.status(201).json({ 
            message: "Order placed successfully!", 
            order_id: order_id, 
            total: final_total 
        });

    } catch (err) {
        console.error("Order creation error:", err);
        res.status(500).json({ message: "Server error during order placement." });
    }
};

export const getOrderHistory = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: "Not logged in" });
        }

        const customer_id = req.session.user.id;

        const orders = await orderModel.getOrdersByCustomerId(customer_id);

        res.json({ orders });
    } catch (err) {
        console.error("Get order history error:", err);
        res.status(500).json({ message: "Server error while fetching orders." });
    }
};

export const getOrderDetail = async (req, res) => {
    try {
        const { order_id } = req.params;

        if (!req.session.user) {
            return res.status(401).json({ message: "Not logged in" });
        }

        const customer_id = req.session.user.id;

        // Kiểm tra order có thuộc user này
        const orders = await orderModel.getOrdersByCustomerId(customer_id);
        const orderExists = orders.some(o => o.order_id == order_id);
        if (!orderExists) return res.status(403).json({ message: "Forbidden" });

        const orderDetails = await orderModel.getOrderDetailByOrderId(order_id);

        res.json({ orderDetails });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};