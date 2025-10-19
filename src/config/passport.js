// src/config/passport.js
import dotenv from "dotenv";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import bcrypt from "bcrypt";
import { findUserByGoogleId, createUser, findUserById } from "../models/userModel.js";

dotenv.config();

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: `${process.env.FRONTEND_URL}/api/users/google/callback`,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                let user = await findUserByGoogleId(profile.id);
                if (!user) {
                    user = await createUser({
                        auth_id: profile.id,
                        email: profile.emails[0].value,
                        password_hash: await bcrypt.hash("google_login", 10),
                        username: profile.displayName,
                        profile_picture: profile.photos[0].value,
                        phone: null,
                        address: null,
                        profile_picture: null,
                        gender: null,
                        date_of_birth: null,
                    });
                }
                return done(null, user);
            } catch (error) {
                return done(error, null);
            }
        }
    )
);

// Serialize user
passport.serializeUser((user, done) => {
    done(null, user);
});

// Deserialize user (MySQL)
passport.deserializeUser(async (id, done) => {
    try {
        const user = await findUserById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

export default passport;
