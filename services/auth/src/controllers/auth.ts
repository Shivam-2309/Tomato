import { Request, Response } from "express"
import User from "../model/user.js";
import jwt from "jsonwebtoken";

export const loginUser = async (req : Request, res : Response) => {
    try {
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
    }catch(err : any){
        res.status(500).json({
            message: err.message,
        })
    }
}   
