/**
 * Mock Cart Controller
 * Xử lý logic giỏ hàng sử dụng mock data
 */

import * as mockCartModel from '../models/mockCartModel.js';
import * as mockProductModel from '../models/mockProductModel.js';

// Get cart
export const getCart = async (req, res) => {
  try {
    const customerId = req.session.user?.id;

    if (!customerId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const cart = await mockCartModel.getOrCreateCart(customerId);
    const items = await mockCartModel.getCartItems(cart.cart_id);

    // Get product details for each item
    const cartItems = await Promise.all(items.map(async (item) => {
      const product = await mockProductModel.getProductById(item.product_id);
      return {
        ...item,
        product: product
      };
    }));

    res.json({
      message: 'Get cart successfully',
      data: {
        cart_id: cart.cart_id,
        items: cartItems
      }
    });
  } catch (error) {
    console.error('[MOCK] Get cart error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Add to cart
export const addToCart = async (req, res) => {
  try {
    const { product_id, quantity } = req.body;
    const customerId = req.session.user?.id;

    if (!customerId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!product_id || !quantity) {
      return res.status(400).json({ message: 'Product ID and quantity are required' });
    }

    // Get product to verify and get price
    const product = await mockProductModel.getProductById(product_id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Get or create cart
    const cart = await mockCartModel.getOrCreateCart(customerId);

    // Add item to cart
    const item = await mockCartModel.addToCart(
      cart.cart_id,
      product_id,
      Number.parseInt(quantity),
      product.price
    );

    res.status(201).json({
      message: 'Item added to cart',
      data: item
    });
  } catch (error) {
    console.error('[MOCK] Add to cart error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update cart item
export const updateCartItem = async (req, res) => {
  try {
    const { cart_item_id } = req.params;
    const { quantity } = req.body;

    if (!quantity) {
      return res.status(400).json({ message: 'Quantity is required' });
    }

    const updated = await mockCartModel.updateCartItem(
      Number.parseInt(cart_item_id),
      Number.parseInt(quantity)
    );

    if (!updated) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    res.json({
      message: 'Cart item updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('[MOCK] Update cart item error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Remove from cart
export const removeFromCart = async (req, res) => {
  try {
    const { cart_item_id } = req.params;

    const deleted = await mockCartModel.removeFromCart(Number.parseInt(cart_item_id));

    if (!deleted) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    res.json({
      message: 'Item removed from cart'
    });
  } catch (error) {
    console.error('[MOCK] Remove from cart error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Clear cart
export const clearCart = async (req, res) => {
  try {
    const customerId = req.session.user?.id;

    if (!customerId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const cart = await mockCartModel.getOrCreateCart(customerId);
    await mockCartModel.clearCart(cart.cart_id);

    res.json({
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    console.error('[MOCK] Clear cart error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export default {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
};
