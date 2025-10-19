import express from "express";
import { login, checkAuth, logout, userInfo, registerUser } from "../controllers/userController.js";
import passport from "../config/passport.js";

const router = express.Router();


router.post("/login", login);
router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);
router.get('/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/login',
        session: true
    }),
    (req, res) => {
        // Lưu user vào session
        req.session.user = {
            id: req.user.user_id || req.user._id,
            user_name: req.user.name,
            email: req.user.email,
            role: req.user.role || 'user'
        };

        // Redirect về frontend
        res.redirect(`${process.env.FRONTEND_URL}`);
    }
);

router.get("/checkAuth", checkAuth);
router.post("/logout", logout);
router.post("/register", registerUser)

router.get("/profile", userInfo);

export default router;
