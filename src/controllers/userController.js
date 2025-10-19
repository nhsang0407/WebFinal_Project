import bcrypt from "bcrypt";
import { findUserByIdentifier, createUser } from "../models/userModel.js";

// logic process when Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await findUserByIdentifier(email);
    console.log(user);

    if (!user) return res.status(404).json({ message: "User not found" });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: "Wrong password" });

    req.session.user = {
      id: user.user_id,
      user_name: user.user_name,
      email: user.email,
      role: user.role
    };

    res.json({ message: "Login success", user: req.session.user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// check Logged
export const checkAuth = (req, res) => {
  if (req.session.user) res.json({ loggedIn: true, user: req.session.user });
  else res.json({ loggedIn: false });
};

// process logout method
export const logout = (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ message: "Logout failed" });
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out" });
  });
};

// process logic register user
export const registerUser = async (req, res) => {
  try {
    const {
      username,
      password
    } = req.body;

    // check empty ?
    if (!username || !password) {
      return res.status(400).json({ message: "Username, password are required" });
    }

    // check isset  (bằng username hoặc email)
    const existingUser = await findUserByIdentifier(username);
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // Hash password 
    const password_hash = await bcrypt.hash(password, 10);

    // build dât to create User
    const newUser = {
      username,
      email: username,
      password_hash,
      phone: null,
      address: null,
      profile_picture: null,
      gender: null,
      date_of_birth: null,
      auth_id: null
    };

    //Call model để insert user mới
    const newUserId = await createUser(newUser);

    // respone
    res.status(201).json({
      message: "User registered successfully",
      user_id: newUserId,
    });

  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// get info User
export const userInfo = async (req, res) => {
  try {
    const user = await findUserByIdentifier('dev@gmail.com');
    //console.log(user);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const profile = {
      id: user.user_id,
      email: user.email,
      role: user.role
    };

    return res.json({ message: "Method success", profile });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

