/**
 * Mock User Model
 * Sử dụng dữ liệu từ mock_data/users.json thay vì database
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Lấy đường dẫn thư mục hiện tại (ES6 modules)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MOCK_DATA_DIR = path.join(__dirname, '..', '..', 'mock_data');

// Cache data để tránh đọc file lần lần
let usersCache = null;

// Load mock data từ file
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

// Save mock data lại vào file
function saveUsers(users) {
  try {
    const filePath = path.join(MOCK_DATA_DIR, 'users.json');
    fs.writeFileSync(filePath, JSON.stringify(users, null, 2), 'utf-8');
    usersCache = users; // Update cache
    return true;
  } catch (error) {
    console.error('[MOCK] Error saving users:', error.message);
    return false;
  }
}

// Tìm user theo identifier (email hoặc username)
export const findUserByIdentifier = async (identifier) => {
  const users = loadUsers();
  const user = users.find(u => 
    u.email === identifier || u.username === identifier
  );
  return user || null;
};

// Tìm user theo Google ID
export const findUserByGoogleId = async (googleId) => {
  const users = loadUsers();
  const user = users.find(u => u.auth_id === googleId);
  if (user) {
    return {
      id: user.user_id,
      user_id: user.user_id,
      email: user.email,
      username: user.username
    };
  }
  return null;
};

// Tìm user theo ID
export const findUserById = async (id) => {
  const users = loadUsers();
  const user = users.find(u => u.user_id === id);
  if (user) {
    return {
      id: user.user_id,
      user_id: user.user_id,
      email: user.email,
      username: user.username,
      role: user.role,
      ...user
    };
  }
  return null;
};

// Tạo user mới
export const createUser = async (userData) => {
  const users = loadUsers();
  
  // Tìm ID max hiện tại
  const maxId = users.length > 0 ? Math.max(...users.map(u => u.user_id)) : 0;
  const newId = maxId + 1;
  
  const newUser = {
    user_id: newId,
    username: userData.username,
    email: userData.email,
    password_hash: userData.password_hash,
    phone: userData.phone || null,
    address: userData.address || null,
    full_name: userData.full_name || null,
    gender: userData.gender || null,
    date_of_birth: userData.date_of_birth || null,
    loyalty_points: userData.loyalty_points || 0,
    role: userData.role || 'customer',
    is_active: userData.is_active !== undefined ? userData.is_active : 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    auth_id: userData.auth_id || null
  };
  
  users.push(newUser);
  saveUsers(users);
  
  return {
    id: newUser.user_id,
    user_id: newUser.user_id,
    username: newUser.username,
    email: newUser.email,
    auth_id: newUser.auth_id
  };
};

// Update user
export const updateUser = async (userId, userData) => {
  const users = loadUsers();
  const userIndex = users.findIndex(u => u.user_id === userId);
  
  if (userIndex === -1) return null;
  
  users[userIndex] = {
    ...users[userIndex],
    ...userData,
    updated_at: new Date().toISOString()
  };
  
  saveUsers(users);
  return users[userIndex];
};

// Delete user
export const deleteUser = async (userId) => {
  const users = loadUsers();
  const newUsers = users.filter(u => u.user_id !== userId);
  
  if (newUsers.length === users.length) return false; // User không tồn tại
  
  saveUsers(newUsers);
  return true;
};

// Get all users
export const getAllUsers = async () => {
  return loadUsers();
};

export default {
  findUserByIdentifier,
  findUserByGoogleId,
  findUserById,
  createUser,
  updateUser,
  deleteUser,
  getAllUsers
};
