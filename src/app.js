import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import session from "express-session";
import productRoutes from "./routes/productRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js"

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


app.use(cors({
  origin: "http://localhost:5000",
  credentials: true
}));
app.use(express.json());

app.use(session({
  secret: "Bichnga123",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 2
  }
}));

app.use("/api/products", productRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/users", userRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
