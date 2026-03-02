import { AuthenticatedRequest } from "../middlewares/isAuth.js";
import TryCatch from "../middlewares/trycatch.js";
import { Response } from "express";
import getBuffer from "../config/datauri.js";
import axios from 'axios';
import Restaurant from "../models/restaurant.js";

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