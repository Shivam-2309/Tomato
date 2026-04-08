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
        isAvailable: true, 
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
    const items = await MenuItem.find({restaurantId : id});
    return res.status(200).json(
        items, 
    )
});

export const deleteMenuItem = TryCatch( async (req : AuthenticatedRequest, res) => {
    if(!req.user){
        return res.status(401).json({
            message : "Please login",
        });
    };

    const { itemId } = req.params;
    if(!itemId){
        return res.status(400).json({
            message : "Item Id is required",
        });
    };

    const item = await MenuItem.findById(itemId);

    if(!item){
        return res.status(400).json({
            message : "Not foud any item with this item id",
        });
    };

    // kya vo vhi restaurant h jiska item mne select kra h ?
    // vo check hua user ki owner id se right ?
    const restaurant = await Restaurant.findOne({
        _id : item.restaurantId,
        ownerId : req.user._id,
    });

    if(!restaurant){
        return res.status(404).json({
            message : "No Restaurant found",
        });
    };

    await item.deleteOne();

    return res.status(200).json({
        message : "The item has been deleted successfully",
    });
});

export const toggleMenuItemAvailability = TryCatch( async (req : AuthenticatedRequest, res) => {
    if(!req.user){
        return res.status(401).json({
            message : "Please login",
        });
    };

    const { itemId } = req.params;
    if(!itemId){
        return res.status(400).json({
            message : "Item Id is required",
        });
    };

    const item = await MenuItem.findById(itemId);

    if(!item){
        return res.status(400).json({
            message : "Not foud any item with this item id",
        });
    };

    // kya vo vhi restaurant h jiska item mne select kra h ?
    // vo check hua user ki owner id se right ?
    const restaurant = await Restaurant.findOne({
        _id : item.restaurantId,
        ownerId : req.user._id,
    });

    if(!restaurant){
        return res.status(404).json({
            message : "No Restaurant found",
        });
    };

    item.isAvailable = !item.isAvailable;
    await item.save();

    return res.status(200).json({
        message : "Item has been updated successfully",
    });
});