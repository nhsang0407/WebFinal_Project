import db from "../config/database.js";

export const insertPayment = async (order_id, payment_method, payment_status = 'Pending') => {
    // Đảm bảo payment_method phải khớp với ENUM ('COD', 'BankTransfer', 'CreditCard')
    // Nếu FE gửi 'cash', bạn cần ánh xạ nó thành 'COD' trước khi chèn.
    
    // Ví dụ ánh xạ:
    const mappedMethod = mapPaymentMethod(payment_method);
    const [result] = await db.query(
        "INSERT INTO payment (order_id, payment_method, payment_status, payment_date) VALUES (?, ?, ?, NOW())",
        [order_id, mappedMethod, payment_status]
    );
    
    return result;
};

// Hàm ánh xạ phương thức thanh toán từ Frontend sang ENUM DB
const mapPaymentMethod = (feMethod) => {
    switch (feMethod.toLowerCase()) {
        case 'cash':
        case 'cod':
            return 'COD';
        case 'transfer':
        case 'banktransfer':
            return 'BankTransfer';
        case 'credit':
        case 'creditcard':
        case 'debit':
            return 'CreditCard';
        default:
            return 'COD';
    }
};