import TryCatch from "../middlewares/trycatch.js";
import getBuffer from "../config/datauri.js";
import axios from "axios";
import Restaurant from "../models/restaurant.js";
import jwt from "jsonwebtoken";
import RestaurantLikes from "../models/RestaurantLikes.js";
export const addRestaurant = TryCatch(async (req, res) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({
            message: "Unauthorized",
        });
    }
    const existingRestaurant = await Restaurant.findOne({
        ownerId: user?._id,
    });
    if (existingRestaurant) {
        return res.status(400).json({
            message: "You already have your restaurant registered",
        });
    }
    const { name, description, latitude, longitude, formattedAddress, phone } = req.body;
    if (!name || !latitude || !longitude) {
        return res.status(400).json({
            message: "You need to give all the details",
        });
    }
    const file = req.file;
    if (!file) {
        return res.status(400).json({
            message: "Please give image",
        });
    }
    const fileBuffer = getBuffer(file);
    // console.log("The curent file buffer is : ", fileBuffer);
    if (!fileBuffer) {
        res.status(500).json({
            message: "Failed to create file buffer",
        });
    }
    const { data: uploadResult } = await axios.post(`${process.env.UTILS_SERVICE}/api/upload`, {
        buffer: fileBuffer.content,
    });
    const restaurant = await Restaurant.create({
        name,
        description,
        phone,
        image: uploadResult.url,
        ownerId: user._id,
        autoLocation: {
            type: "Point",
            coordinates: [Number(longitude), Number(latitude)],
            formattedAddress,
        },
        isVerified: false,
    });
    return res.status(201).json({
        message: "Restaurant created successfully",
        restaurant,
    });
});
export const fetchMyRestaurant = TryCatch(async (req, res) => {
    if (!req.user)
        return res.status(401).json({
            message: "please login",
        });
    const restaurant = await Restaurant.findOne({ ownerId: req.user._id });
    if (!restaurant) {
        return res.status(401).json({
            message: "No restaurant found",
        });
    }
    if (!req.user.restaurantId) {
        const token = jwt.sign({
            user: {
                ...req.user,
                restaurantId: restaurant._id,
            },
        }, process.env.JWT_SEC, {
            expiresIn: "15d",
        });
        return res.json({ restaurant, token });
    }
    res.json({ restaurant });
});
export const updateStatusRestaurant = TryCatch(async (req, res) => {
    if (!req.user)
        return res.status(401).json({
            message: "please login",
        });
    const { status } = req.body;
    if (typeof status !== "boolean") {
        return res.status(400).json({
            message: "status must be of type boolean",
        });
    }
    const restaurant = await Restaurant.findOneAndUpdate({ ownerId: req.user._id }, { isOpen: status }, { new: true });
    if (!restaurant) {
        return res.status(400).json({
            message: "Restaurant not found",
        });
    }
    return res.status(201).json({
        message: "Restaurant successfully updated",
        restaurant,
    });
});
export const updateRestaurant = async (req, res) => {
    if (!req.user) {
        return res.status(400).json({
            message: "Please Login",
        });
    }
    const { name, description } = req.body;
    const restaurant = await Restaurant.findOneAndUpdate({ ownerId: req.user._id }, { name: name, description: description }, { new: true });
    if (!restaurant) {
        return res.status(400).json({
            message: "Restaurant not found",
        });
    }
    return res.status(201).json({
        message: "Restaurant successfully updated",
        restaurant,
    });
};
export const getNearbyRestaurant = TryCatch(async (req, res) => {
    const { latitude, longitude, radius = 150000, search = "" } = req.query;
    if (!latitude || !longitude)
        return res.status(400).json({
            message: "Latitude and Longitude are required",
        });
    const query = {
        isVerified: true,
    };
    if (search && typeof search === "string") {
        query.name = { $regex: search, $options: "i" };
    }
    const restaurants = await Restaurant.aggregate([
        {
            $geoNear: {
                near: {
                    type: "Point",
                    coordinates: [Number(longitude), Number(latitude)],
                },
                distanceField: "distance",
                maxDistance: Number(radius),
                spherical: true,
                query,
                key: "autoLocation",
            },
        },
        {
            $sort: {
                isOpen: -1,
                distance: 1,
            },
        },
        {
            $addFields: {
                // for rounding off
                distanceKm: {
                    $round: [{ $divide: ["$distance", 1000] }, 2],
                },
            },
        },
    ]);
    console.log("Res: ", restaurants);
    res.json({
        success: true,
        count: restaurants.length,
        restaurants,
    });
});
export const fetchSingleRestaurant = TryCatch(async (req, res) => {
    const restaurant = await Restaurant.findById(req.params.id);
    res.json(restaurant);
});
export const fetchLikedRestaurant = TryCatch(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            message: "Authentication is Required",
        });
    }
    const userId = req.user._id;
    const likedRestaurants = await RestaurantLikes.find({
        userId,
    }).populate("restaurantId");
    return res.status(200).json({
        success: true,
        restaurants: likedRestaurants.map((like) => like.restaurantId),
    });
});
