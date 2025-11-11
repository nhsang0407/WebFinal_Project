/**
 * Mock Payment Model
 * Sử dụng dữ liệu từ mock_data/payments.json
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MOCK_DATA_DIR = path.join(__dirname, '..', '..', 'mock_data');

let paymentsCache = null;

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

function savePayments(payments) {
  try {
    const filePath = path.join(MOCK_DATA_DIR, 'payments.json');
    fs.writeFileSync(filePath, JSON.stringify(payments, null, 2), 'utf-8');
    paymentsCache = payments;
    return true;
  } catch (error) {
    console.error('[MOCK] Error saving payments:', error.message);
    return false;
  }
}

// Get all payments
export const getAllPayments = async (filters = {}) => {
  let payments = loadPayments();
  
  if (filters.status) {
    payments = payments.filter(p => p.payment_status === filters.status);
  }
  if (filters.order_id) {
    payments = payments.filter(p => p.order_id === filters.order_id);
  }
  
  return payments;
};

// Get payment by ID
export const getPaymentById = async (paymentId) => {
  const payments = loadPayments();
  return payments.find(p => p.payment_id === paymentId) || null;
};

// Get payment by order ID
export const getPaymentByOrderId = async (orderId) => {
  const payments = loadPayments();
  return payments.find(p => p.order_id === orderId) || null;
};

// Create payment
export const createPayment = async (paymentData) => {
  const payments = loadPayments();
  
  const maxId = payments.length > 0 ? Math.max(...payments.map(p => p.payment_id)) : 0;
  const newId = maxId + 1;
  
  const newPayment = {
    payment_id: newId,
    order_id: paymentData.order_id,
    amount: Number.parseFloat(paymentData.amount),
    payment_method: paymentData.payment_method || 'pending',
    payment_status: paymentData.payment_status || 'pending',
    transaction_id: paymentData.transaction_id || null,
    payment_date: new Date().toISOString(),
    notes: paymentData.notes || ''
  };
  
  payments.push(newPayment);
  savePayments(payments);
  
  return newPayment;
};

// Update payment
export const updatePayment = async (paymentId, paymentData) => {
  const payments = loadPayments();
  const paymentIndex = payments.findIndex(p => p.payment_id === paymentId);
  
  if (paymentIndex === -1) return null;
  
  payments[paymentIndex] = {
    ...payments[paymentIndex],
    ...paymentData
  };
  
  savePayments(payments);
  return payments[paymentIndex];
};

// Delete payment
export const deletePayment = async (paymentId) => {
  const payments = loadPayments();
  const newPayments = payments.filter(p => p.payment_id !== paymentId);
  
  if (newPayments.length === payments.length) return false;
  
  savePayments(newPayments);
  return true;
};

export default {
  getAllPayments,
  getPaymentById,
  getPaymentByOrderId,
  createPayment,
  updatePayment,
  deletePayment
};
