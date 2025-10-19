import express from "express";
import { login, checkAuth, logout, userInfo, registerUser } from "../controllers/userController.js";

const router = express.Router();


router.post("/login", login);
router.get("/checkAuth", checkAuth);
router.post("/logout", logout);
router.post("/register", registerUser)

router.get("/profile", userInfo);

export default router;
