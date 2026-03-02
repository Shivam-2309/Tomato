import User, { AuthenticatedRequest } from "../middlewares/isAuth.js";
import TryCatch from "../middlewares/trycatch.js";
import { response, Response } from "express";
import getBuffer from "../config/datauri.js";
import axios from 'axios';
import Restaurant from "../models/restaurant.js";
import jwt from 'jsonwebtoken';

export const addRestaurant = TryCatch(async (req : AuthenticatedRequest, res : Response) => {
    const user = req.user;

    if(!user) {
        return res.status(401).json({
            message: "Unauthorized",
        })
    }

    const existingRestaurant = await Restaurant.findOne({
        ownerId : user?._id,
    });    

    if(existingRestaurant){
        return res.status(400).json({
            message : "You already have your restaurant registered",
        });
    }

    const { name, description, latitude, longitude, formattedAddress, phone } = req.body;

    if(!name || !latitude || !longitude){
        return res.status(400).json({
            message : "You need to give all the details",
        });
    }

    const file = req.file;

    if(!file){
        return res.status(400).json({
            message : "Please give image",
        });
    }

    const fileBuffer = getBuffer(file);

    if(!fileBuffer){
        res.status(500).json({
            message: "Failed to create file buffer",
        });
    }

    const { data : uploadResult } = await axios.post(`${process.env.UTILS_SERVICE}`,
        {
            buffer : fileBuffer.content,
        }
    );

    const restaurant = await Restaurant.create({
        name, 
        description,
        phone,
        image: uploadResult.url, 
        ownerId: user._id,
        autoLocation:{
            type: "Point", 
            coordinates: [Number(longitude), Number(latitude)],
            formattedAddress,
        },
    });

    return res.status(201).json({
        message : "Restaurant created successfully",
    })

});


export const fetchMyRestaurant = TryCatch(async (req : AuthenticatedRequest, res) => {
    if(!req.user) return res.status(401).json({
        message: "please login",
    })

    const restaurant = await Restaurant.findOne( { ownerId : req.user._id } );

    if(!restaurant){
        return res.status(401).json({
            message: "Invalid user",
        });
    }

    if(!req.user.restaurantId){
        const token = jwt.sign(
            {
                user: {
                    ...req.user,
                    restaurantId: restaurant._id,
                },
            },
            process.env.JWT_SEC as string, 
            {
                expiresIn : "15",
            }
        );

        return res.json({ restaurant, token });
    }

    res.json( { restaurant });
});