/**
 * Mock Order Controller
 * Xử lý logic đơn hàng sử dụng mock data
 */

import * as mockOrderModel from '../models/mockOrderModel.js';

// Get all orders
export const getOrders = async (req, res) => {
  try {
    const { status } = req.query;
    const customerId = req.session.user?.id;

    const filters = {};
    if (status) filters.status = status;
    if (customerId) filters.customer_id = customerId;

    const orders = await mockOrderModel.getAllOrders(filters);

    res.json({
      success: true,
      message: 'Get orders successfully',
      data: orders,
      total: orders.length
    });
  } catch (error) {
    console.error('[MOCK] Get orders error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
};

// Get order detail
export const getOrderDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await mockOrderModel.getOrderById(Number.parseInt(id));

    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Order not found' 
      });
    }

    res.json({
      success: true,
      message: 'Get order successfully',
      data: order
    });
  } catch (error) {
    console.error('[MOCK] Get order detail error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
};

// Create order
export const createOrder = async (req, res) => {
  try {
    const { total_amount, shipping_address, notes, payment_method } = req.body;
    const customerId = req.session.user?.id;

    if (!customerId) {
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated' 
      });
    }

    if (!total_amount || !shipping_address) {
      return res.status(400).json({ 
        success: false,
        message: 'Total amount and shipping address are required' 
      });
    }

    const newOrder = await mockOrderModel.createOrder({
      customer_id: customerId,
      total_amount: Number.parseFloat(total_amount),
      shipping_address,
      notes: notes || '',
      payment_method: payment_method || 'pending',
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: newOrder
    });
  } catch (error) {
    console.error('[MOCK] Create order error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
};

// Update order status
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ 
        success: false,
        message: 'Status is required' 
      });
    }

    const updated = await mockOrderModel.updateOrderStatus(Number.parseInt(id), status);

    if (!updated) {
      return res.status(404).json({ 
        success: false,
        message: 'Order not found' 
      });
    }

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('[MOCK] Update order status error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
};

// Delete order
export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await mockOrderModel.deleteOrder(Number.parseInt(id));

    if (!deleted) {
      return res.status(404).json({ 
        success: false,
        message: 'Order not found' 
      });
    }

    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('[MOCK] Delete order error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
};

export default {
  getOrders,
  getOrderDetail,
  createOrder,
  updateOrderStatus,
  deleteOrder
};
