import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import productRoutes from "./routes/productRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { apiLogger, errorHandler } from "./middleware/authMiddleware.js";
import "./config/passport.js";

dotenv.config();
const app = express();

app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "frame-ancestors 'self' https://www.chatbase.co;"
  );
  next();
});


// using public file in frontend
app.use(express.static("public"));

// API Logger middleware
app.use(apiLogger);

app.use(cors({
  origin: ["http://localhost:5000", "http://localhost:3000", "127.0.0.1"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept']
}));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || "Bichnga123",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false, 
    sameSite: 'Lax',
    maxAge: 1000 * 60 * 60 * 2
  }
}));

// 🔧 Debug session middleware
app.use((req, res, next) => {
  console.log(`[SESSION] ${req.method} ${req.path} | SID: ${req.sessionID} | Has user: ${!!req.session?.user}`);
  next();
});

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/api/products", productRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/users", userRoutes);
app.use("/api/cart", cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use("/admin/images", express.static("public/images"));

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
