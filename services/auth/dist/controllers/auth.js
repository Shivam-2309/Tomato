import User from "../model/user.js";
import jwt from "jsonwebtoken";
import TryCatch from "../middleware/trycatch.js";
import { oauth2client } from "../config/googleconfig.js";
import axios from "axios";
// It is wrapped in a TryCatch block because, the function body has async operations
// these operations can throw errors, and express does not inherently hndle these errors well.
// in order to protect such promise rejection i need to have a mechanism 
// one way is to mannually write try catch for every await -> but this is too code consuming
// so better alternative is to write a middleware for it so that every request that comes is first treated here only.
export const loginUser = TryCatch(async (req, res) => {
    const { code } = req.body;
    if (!code) {
        res.status(400).json({
            message: "Authorization code is required",
        });
    }
    const googleRes = await oauth2client.getToken(code);
    oauth2client.setCredentials(googleRes.tokens);
    const userRes = await axios.get(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleRes.tokens.access_token}`);
    const { email, name, picture } = userRes.data;
    var user = await User.findOne({ email });
    if (!user) {
        // create that user
        user = await User.create({
            name: name,
            email: email,
            image: picture,
        });
    }
    // sign that user 
    const token = jwt.sign({ user }, process.env.JWT_SEC, {
        expiresIn: "15d",
    });
    res.status(200).json({
        message: "Logged in successfully",
        token: token,
        user,
    });
});
const allowedRoles = ["Customer", "Rider", "Seller"];
export const addUserRole = TryCatch(async (req, res) => {
    if (!req.user?._id) {
        return res.status(401).json({
            message: "Unauthorized",
        });
    }
    const { role: role } = req.body;
    // isko
    if (!allowedRoles.includes(role)) {
        return res.status(400).json({
            message: "Invalid Role",
        });
    }
    const user = await User.findByIdAndUpdate(req.user._id, { role: role }, { new: true });
    if (!user) {
        return res.status(404).json({
            mesage: "User not found",
        });
    }
    // sign that user kyuki mera user ab update ho chuka h with the role
    const token = jwt.sign({ user }, process.env.JWT_SEC, {
        expiresIn: "15d",
    });
    res.status(200).json({
        user, token
    });
});
export const myProfile = TryCatch(async (req, res) => {
    const user = req.user;
    res.json(user);
});
