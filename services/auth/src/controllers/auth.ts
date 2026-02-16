import User from "../model/user.js";
import jwt from "jsonwebtoken";
import TryCatch from "../middleware/TryCatch.js";
import { AuthenticatedRequest } from "../middleware/isAuth.js";
import { Response, NextFunction } from "express";

// It is wrapped in a TryCatch block because, the function body has async operations
// these operations can throw errors, and express does not inherently hndle these errors well.
// in order to protect such promise rejection i need to have a mechanism 
// one way is to mannually write try catch for every await -> but this is too code consuming
// so better alternative is to write a middleware for it so that every request that comes is first treated here only.
export const loginUser = TryCatch( async (req, res) => {
    const { email, name, picture } = req.body;

    var user = await User.findOne({ email });
    if(!user){
        // create that user
        user = await User.create({
            name : name,
            email : email,
            image : picture,
        })
    }
    
    // sign that user 
    const token = jwt.sign({ user }, process.env.JWT_SEC as string, {
        expiresIn : "15d",
    });

    res.status(200).json({
        message : "Loggin in successfully",
        token : token,
        user,
    });
})

const allowedRoles = ["Customer", "Rider", "Seller"] as const; 
// as const line makes it more type safe as now the typeof(allowedRoles) is not string[] but it is exact the values in it
// this means that now typeof customers is not string but customers only
type Role = (typeof allowedRoles)[number]; // mtlb Role koi bhi ho skta h

export const addUserRole = TryCatch(async (req : AuthenticatedRequest, res : Response) => {
    if(!req.user?._id){
        return res.status(401).json({
            message : "Unauthorized",
        });
    }

    const { role : role } = req.body as { role : Role};
    // isko
    if(!allowedRoles.includes(role)){
        return res.status(400).json({
            message : "Invalid Role",
        });
    }

    const user = await User.findByIdAndUpdate(req.user._id, { role : role }, { new : true });

    if(!user){
        return res.status(404).json({
            mesage: "User not found",
        });
    }

    // sign that user kyuki mera user ab update ho chuka h with the role
    const token = jwt.sign({ user }, process.env.JWT_SEC as string, {
        expiresIn : "15d",
    });

    res.status(200).json({
        user, token
    });
});

export const myProfile = TryCatch(async (req : AuthenticatedRequest, res : Response) => {
    const user = req.user;
    res.json(user);
})