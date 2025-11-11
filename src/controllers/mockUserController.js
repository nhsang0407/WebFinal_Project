/**
 * Mock User Controller
 * Xử lý logic authentication sử dụng mock data
 */

import bcrypt from 'bcrypt';
import * as mockUserModel from '../models/mockUserModel.js';

// Mock users array for fallback login
const MOCK_USERS = [
  {
    user_id: 1,
    user_name: 'admin2203',
    email: 'admin@webfinal.com',
    password_hash: '$2b$10$Bk8u8WPNXL2u6WL5.fsmXOmP6L5C8D5Z.F8Q2N7O8P9Q0R1S2T3U4V5',
    role: 'super_admin'
  },
  {
    user_id: 2,
    user_name: 'staff',
    email: 'staff@webfinal.com',
    password_hash: '$2b$10$Bk8u8WPNXL2u6WL5.fsmXOmP6L5C8D5Z.F8Q2N7O8P9Q0R1S2T3U4V5',
    role: 'staff'
  },
  {
    user_id: 3,
    user_name: 'customer1',
    email: 'customer@webfinal.com',
    password_hash: '$2b$10$Bk8u8WPNXL2u6WL5.fsmXOmP6L5C8D5Z.F8Q2N7O8P9Q0R1S2T3U4V5',
    role: 'customer'
  }
];

// Login controller
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    let user;
    try {
      // Try to find user from mock data
      user = await mockUserModel.findUserByIdentifier(email);
    } catch (error) {
      console.warn('[MOCK LOGIN] Error loading mock user:', error.message);
      // Fallback to hardcoded mock users
      user = MOCK_USERS.find(u => u.email === email || u.user_name === email);
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Wrong password' });
    }

    // Set session
    req.session.user = {
      id: user.user_id,
      user_name: user.user_name || user.username,
      email: user.email,
      role: user.role
    };

    console.log('[MOCK LOGIN] User logged in:', user.user_name || user.username);
    res.json({ 
      message: 'Login success', 
      user: req.session.user
    });
  } catch (err) {
    console.error('[MOCK LOGIN] Error:', err);
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
};

// Check auth controller
export const checkAuth = (req, res) => {
  if (req.session.user) {
    res.json({ 
      loggedIn: true, 
      user: req.session.user
    });
  } else {
    res.json({ loggedIn: false });
  }
};

// Logout controller
export const logout = (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ message: 'Logout failed' });
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out' });
  });
};

// Register controller
export const registerUser = async (req, res) => {
  try {
    const {
      fullName,
      dob,
      gender,
      phone,
      email,
      address,
      username,
      password
    } = req.body;
    console.log('[MOCK] Register request:', { username, email });

    if (!username || !password || !fullName || !email) {
      return res.status(400).json({ message: 'Username, password, fullName, email are required' });
    }

    // Check if user already exists
    const existingUser = await mockUserModel.findUserByIdentifier(username);
    const existingMail = await mockUserModel.findUserByIdentifier(email);
    
    if (existingUser || existingMail) {
      const field = existingUser ? 'Username' : 'Email';
      return res.status(400).json({ message: `${field} already exists` });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = {
      username,
      email,
      password_hash,
      phone: phone || null,
      address: address || null,
      full_name: fullName || null,
      gender: gender || null,
      date_of_birth: dob || null,
      auth_id: null
    };

    // Save to mock data
    const result = await mockUserModel.createUser(newUser);

    res.status(201).json({
      message: 'User registered successfully',
      user_id: result.id
    });

  } catch (error) {
    console.error('[MOCK] Register Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get user info
export const userInfo = async (req, res) => {
  try {
    const email = req.query.email;
    const user = await mockUserModel.findUserByIdentifier(email);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const profile = {
      id: user.user_id,
      email: user.email,
      role: user.role
    };

    return res.json({ message: 'Method success', profile });
  } catch (error) {
    console.error('[MOCK] Get user error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Change password
export const changePassword = async (req, res) => {
  const { username, newPassword } = req.body;

  try {
    const user = await mockUserModel.findUserByIdentifier(username);

    if (!user) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // Hash new password
    const newHashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user
    await mockUserModel.updateUser(user.user_id, {
      password_hash: newHashedPassword
    });

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('[MOCK] Change password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export default {
  login,
  checkAuth,
  logout,
  registerUser,
  userInfo,
  changePassword
};
