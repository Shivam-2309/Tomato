import { Request, Response, NextFunction } from 'express';
import jwt, {JwtPayload } from 'jsonwebtoken';
import mongoose, {Schema} from "mongoose";

export interface IUSER {
    _id : string,
    name : string;
    email : string; 
    image : string; 
    role : string;
}

// this tells that the schema is of the type USER -> checkedby typescript
// and then make the schema which would be used by the model to create a collection
// also note that when a model is created, it is only only stored in emory and not reflected in my DB
// it only reflects after one operation is done
const schema : Schema<IUSER> = new Schema({
    _id : { type : String, required : true},
    name : { type : String, required : true },
    email : { type : String, required : true, unique : true },
    image : { type : String, required : true },
    role : { type : String, default : null },  
}, {                                    
    timestamps : true,
});

// model ka type btao kya h -> collection jo aaenge uska type kya h 
const User = mongoose.model<IUSER>("User", schema);
export default User;

export interface AuthenticatedRequest extends Request {
    user?: IUSER | null;
};

// this is a middleware which validated an isAuth functionality and then return a promise with no return value
export const isAuth = async (req : AuthenticatedRequest, res : Response, next : NextFunction) :
Promise<void> => {
    try {
        // 1:17:25
        const authHeader = req.headers.authorization;

        if(!authHeader || !authHeader.startsWith("Bearer ")){
            res.status(401).json({
                message: "Please login - No Auth header",
            });
            return;
        }

        const token = authHeader.split(" ")[1];

        if(!token){
            // no token found
            res.status(401).json({
                message: "Please login - Token missing",
            });
            return;
        }

        const decodedValue = jwt.verify(token, process.env.JWT_SEC as string) as JwtPayload;

        if(!decodedValue || !decodedValue.user){
            // Token found but not correct
            res.status(401).json({
                message: "Please login - Token not right",
            });
            return;
        }

        req.user = decodedValue.user;
        next();
    }catch(err){
        res.status(500).json({
            message : "Please Login - Jwt Error",
        })
    }
}