/**
 * Mock Order Model
 * Sử dụng dữ liệu từ mock_data/orders.json, order_details.json, payments.json, shipping.json, products.json, users.json
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MOCK_DATA_DIR = path.join(__dirname, '..', '..', 'mock_data');

let ordersCache = null;
let orderDetailsCache = null;
let paymentsCache = null;
let shippingCache = null;
let productsCache = null;
let usersCache = null;

function loadOrders() {
  if (ordersCache) return ordersCache;
  try {
    const filePath = path.join(MOCK_DATA_DIR, 'orders.json');
    const data = fs.readFileSync(filePath, 'utf-8');
    ordersCache = JSON.parse(data);
    return ordersCache;
  } catch (error) {
    console.error('[MOCK] Error loading orders:', error.message);
    return [];
  }
}

function loadOrderDetails() {
  if (orderDetailsCache) return orderDetailsCache;
  try {
    const filePath = path.join(MOCK_DATA_DIR, 'order_details.json');
    const data = fs.readFileSync(filePath, 'utf-8');
    orderDetailsCache = JSON.parse(data);
    return orderDetailsCache;
  } catch (error) {
    console.error('[MOCK] Error loading order details:', error.message);
    return [];
  }
}

function loadPayments() {
  if (paymentsCache) return paymentsCache;
  try {
    const filePath = path.join(MOCK_DATA_DIR, 'payments.json');
    const data = fs.readFileSync(filePath, 'utf-8');
    paymentsCache = JSON.parse(data);
    return paymentsCache;
  } catch (error) {
    console.error('[MOCK] Error loading payments:', error.message);
    return [];
  }
}

function loadShipping() {
  if (shippingCache) return shippingCache;
  try {
    const filePath = path.join(MOCK_DATA_DIR, 'shipping.json');
    const data = fs.readFileSync(filePath, 'utf-8');
    shippingCache = JSON.parse(data);
    return shippingCache;
  } catch (error) {
    console.error('[MOCK] Error loading shipping:', error.message);
    return [];
  }
}

function loadProducts() {
  if (productsCache) return productsCache;
  try {
    const filePath = path.join(MOCK_DATA_DIR, 'products.json');
    const data = fs.readFileSync(filePath, 'utf-8');
    productsCache = JSON.parse(data);
    return productsCache;
  } catch (error) {
    console.error('[MOCK] Error loading products:', error.message);
    return [];
  }
}

function loadUsers() {
  if (usersCache) return usersCache;
  try {
    const filePath = path.join(MOCK_DATA_DIR, 'users.json');
    const data = fs.readFileSync(filePath, 'utf-8');
    usersCache = JSON.parse(data);
    return usersCache;
  } catch (error) {
    console.error('[MOCK] Error loading users:', error.message);
    return [];
  }
}

function saveOrders(orders) {
  try {
    const filePath = path.join(MOCK_DATA_DIR, 'orders.json');
    fs.writeFileSync(filePath, JSON.stringify(orders, null, 2), 'utf-8');
    ordersCache = orders;
    return true;
  } catch (error) {
    console.error('[MOCK] Error saving orders:', error.message);
    return false;
  }
}

/**
 * Enrich order with details, customer, and product info
 */
function enrichOrder(order) {
  const orderDetails = loadOrderDetails().filter(d => d.order_id === order.order_id);
  const products = loadProducts();
  const users = loadUsers();
  const customer = users.find(u => u.user_id === order.customer_id);

  // Enrich items with product details
  const items = orderDetails.map(detail => {
    const product = products.find(p => p.product_id === detail.product_id);
    return {
      order_detail_id: detail.order_detail_id,
      product_id: detail.product_id,
      product_name: product?.product_name || 'Unknown Product',
      image: product?.image_url || '/images/raw/raw/default.png',
      price: detail.price,
      quantity: detail.quantity,
      subtotal: detail.subtotal
    };
  });

  // Get payment and shipping info
  const payment = loadPayments().find(p => p.order_id === order.order_id);
  const shipping = loadShipping().find(s => s.order_id === order.order_id);

  // Get payment method (from payment data or default)
  const paymentMethods = ['Tiền mặt', 'Chuyển khoản', 'Thẻ tín dụng', 'Ví điện tử'];
  const paymentMethod = payment?.payment_method || paymentMethods[order.order_id % paymentMethods.length];

  return {
    order_id: order.order_id,
    order_code: `PTH${String(order.order_id).padStart(4, '0')}`,
    customer_id: order.customer_id,
    customer: customer?.username || 'Khách hàng',
    customer_name: customer?.full_name || 'Khách hàng',
    phone: customer?.phone || '0976 106 992',
    address: shipping?.shipping_address || 'Hoàng Diệu 2, TP. Thủ Đức',
    order_date: order.order_date,
    created_at: order.order_date,
    total_amount: order.total_amount,
    status: order.status,
    payment_method: paymentMethod,
    items: items,
    shipping_fee: 30000,
    discount: -25000,
    subtotal: items.reduce((sum, item) => sum + item.subtotal, 0)
  };
}

// Get all orders with enriched data
export const getAllOrders = async (filters = {}) => {
  let orders = loadOrders();
  
  if (filters.status) {
    orders = orders.filter(o => o.status.toLowerCase() === filters.status.toLowerCase());
  }
  if (filters.customer_id) {
    orders = orders.filter(o => o.customer_id === filters.customer_id);
  }
  
  // Enrich all orders
  return orders.map(order => enrichOrder(order));
};

// Get order by ID with enriched data
export const getOrderById = async (orderId) => {
  const orders = loadOrders();
  const order = orders.find(o => o.order_id === orderId);
  
  if (!order) return null;
  
  return enrichOrder(order);
};

// Create order
export const createOrder = async (orderData) => {
  const orders = loadOrders();
  
  const maxId = orders.length > 0 ? Math.max(...orders.map(o => o.order_id)) : 0;
  const newId = maxId + 1;
  
  const newOrder = {
    order_id: newId,
    customer_id: orderData.customer_id,
    order_date: new Date().toISOString(),
    total_amount: orderData.total_amount || 0,
    status: orderData.status || 'pending',
    shipping_address: orderData.shipping_address || '',
    notes: orderData.notes || '',
    payment_method: orderData.payment_method || 'pending'
  };
  
  orders.push(newOrder);
  saveOrders(orders);
  
  return enrichOrder(newOrder);
};

// Update order status
export const updateOrderStatus = async (orderId, status) => {
  const orders = loadOrders();
  const orderIndex = orders.findIndex(o => o.order_id === orderId);
  
  if (orderIndex === -1) return null;
  
  orders[orderIndex].status = status;
  saveOrders(orders);
  
  return enrichOrder(orders[orderIndex]);
};

// Delete order
export const deleteOrder = async (orderId) => {
  const orders = loadOrders();
  const newOrders = orders.filter(o => o.order_id !== orderId);
  
  if (newOrders.length === orders.length) return false;
  
  saveOrders(newOrders);
  return true;
};

export default {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  deleteOrder
};
