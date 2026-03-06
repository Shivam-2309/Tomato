import getBuffer from "../config/datauri.js";
import { AuthenticatedRequest } from "../middlewares/isAuth.js"
import TryCatch from "../middlewares/trycatch.js"
import Restaurant from "../models/restaurant.js";
import axios from "axios";
import MenuItem from "../models/menuitems.js";

export const addMenuItem = TryCatch(async (req : AuthenticatedRequest, res) => {
    if(!req.user){
        return res.status(401).json({
            message : "Please login",
        });
    };

    const restaurant = await Restaurant.findOne(
        {ownerId : req.user._id},
    );

    if(!restaurant) return res.status(404).json({ message : "No restaurant found" });

    const { name, description, price } = req.body;
    
    if(!name || !price){
        return res.status(400).json({
            message : "Name and Price are required",
        })
    };

    const file = req.file;

    const fileBuffer = getBuffer(file);
    if(!fileBuffer){
        res.status(500).json({
            message: "Failed to create file buffer",
        });
    }
    const { data : uploadResult } = await axios.post(`${process.env.UTILS_SERVICE}/api/upload`,
        {
            buffer : fileBuffer.content,
        });
    
    const item = await MenuItem.create({
        name, 
        description, 
        price, 
        restaurantId : restaurant._id, 
        image: uploadResult.url,
    })

    return res.status(200).json({
        message : "Item added successfully",
        item, 
    });
});

export const getAllItems = TryCatch( async (req : AuthenticatedRequest, res) => {
    if(!req.params.id){
        return res.status(401).json({
            message : "Please Provide a correct Restaurant Id",
        });
    };

    const { id } = req.params;
    const items = MenuItem.find({restaurantId : id});
    return res.status(200).json({
        items, 
    })
});