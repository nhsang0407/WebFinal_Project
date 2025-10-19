import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import session from "express-session";
import productRoutes from "./routes/productRoutes.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();
const app = express();

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
app.use("/api/users", userRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
