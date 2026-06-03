import TryCatch from "../middlewares/trycatch.js";
import RestaurantLikes from "../models/RestaurantLikes.js";
import Restaurant from "../models/restaurant.js";
export const updateRestaurantLikeCount = TryCatch(async (req, res) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({
            message: "Unauthorized",
        });
    }
    try {
        const userId = user._id;
        const { restaurantId } = req.params;
        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).json({
                message: "Restaurant not found",
            });
        }
        if (!restaurantId) {
            return res.status(400).json({
                message: "Restaurant id required",
            });
        }
        const existingLike = await RestaurantLikes.findOne({
            userId,
            restaurantId,
        });
        // Unlike
        if (existingLike) {
            await RestaurantLikes.deleteOne({
                _id: existingLike._id,
            });
            const updatedRestaurant = await Restaurant.findByIdAndUpdate(restaurantId, {
                $inc: { likesCount: -1 },
            }, {
                new: true,
            });
            return res.json({
                liked: false,
                likesCount: updatedRestaurant?.likesCount ?? 0,
            });
        }
        // Like
        await RestaurantLikes.create({
            userId,
            restaurantId,
        });
        const updatedRestaurant = await Restaurant.findByIdAndUpdate(restaurantId, {
            $inc: { likesCount: 1 },
        }, {
            new: true,
        });
        return res.json({
            liked: true,
            likesCount: updatedRestaurant?.likesCount ?? 1,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Failed to toggle like",
        });
    }
});
