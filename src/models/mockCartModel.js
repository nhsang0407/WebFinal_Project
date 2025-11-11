/**
 * Mock Cart Model
 * Sử dụng dữ liệu từ mock_data/cart.json và cart_items.json
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MOCK_DATA_DIR = path.join(__dirname, '..', '..', 'mock_data');

let cartsCache = null;
let cartItemsCache = null;

function loadCarts() {
  if (cartsCache) return cartsCache;
  try {
    const filePath = path.join(MOCK_DATA_DIR, 'cart.json');
    const data = fs.readFileSync(filePath, 'utf-8');
    cartsCache = JSON.parse(data);
    return cartsCache;
  } catch (error) {
    console.error('[MOCK] Error loading carts:', error.message);
    return [];
  }
}

function loadCartItems() {
  if (cartItemsCache) return cartItemsCache;
  try {
    const filePath = path.join(MOCK_DATA_DIR, 'cart_items.json');
    const data = fs.readFileSync(filePath, 'utf-8');
    cartItemsCache = JSON.parse(data);
    return cartItemsCache;
  } catch (error) {
    console.error('[MOCK] Error loading cart items:', error.message);
    return [];
  }
}

function saveCarts(carts) {
  try {
    const filePath = path.join(MOCK_DATA_DIR, 'cart.json');
    fs.writeFileSync(filePath, JSON.stringify(carts, null, 2), 'utf-8');
    cartsCache = carts;
    return true;
  } catch (error) {
    console.error('[MOCK] Error saving carts:', error.message);
    return false;
  }
}

function saveCartItems(items) {
  try {
    const filePath = path.join(MOCK_DATA_DIR, 'cart_items.json');
    fs.writeFileSync(filePath, JSON.stringify(items, null, 2), 'utf-8');
    cartItemsCache = items;
    return true;
  } catch (error) {
    console.error('[MOCK] Error saving cart items:', error.message);
    return false;
  }
}

// Get or create cart for user
export const getOrCreateCart = async (customerId) => {
  const carts = loadCarts();
  let cart = carts.find(c => c.customer_id === customerId);
  
  if (!cart) {
    const maxId = carts.length > 0 ? Math.max(...carts.map(c => c.cart_id)) : 0;
    cart = {
      cart_id: maxId + 1,
      customer_id: customerId,
      created_at: new Date().toISOString()
    };
    carts.push(cart);
    saveCarts(carts);
  }
  
  return cart;
};

// Get cart items
export const getCartItems = async (cartId) => {
  const items = loadCartItems();
  return items.filter(item => item.cart_id === cartId);
};

// Add item to cart
export const addToCart = async (cartId, productId, quantity = 1, price = 0) => {
  const items = loadCartItems();
  const maxId = items.length > 0 ? Math.max(...items.map(i => i.cart_item_id)) : 0;
  
  const newItem = {
    cart_item_id: maxId + 1,
    cart_id: cartId,
    product_id: productId,
    quantity: quantity,
    price: price,
    added_at: new Date().toISOString()
  };
  
  items.push(newItem);
  saveCartItems(items);
  
  return newItem;
};

// Update cart item quantity
export const updateCartItem = async (cartItemId, quantity) => {
  const items = loadCartItems();
  const itemIndex = items.findIndex(i => i.cart_item_id === cartItemId);
  
  if (itemIndex === -1) return null;
  
  items[itemIndex].quantity = quantity;
  saveCartItems(items);
  
  return items[itemIndex];
};

// Remove item from cart
export const removeFromCart = async (cartItemId) => {
  const items = loadCartItems();
  const newItems = items.filter(i => i.cart_item_id !== cartItemId);
  
  if (newItems.length === items.length) return false;
  
  saveCartItems(newItems);
  return true;
};

// Clear cart
export const clearCart = async (cartId) => {
  const items = loadCartItems();
  const newItems = items.filter(i => i.cart_id !== cartId);
  
  saveCartItems(newItems);
  return true;
};

export default {
  getOrCreateCart,
  getCartItems,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
};
