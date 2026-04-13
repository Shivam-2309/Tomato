import mongoose from "mongoose";
import TryCatch from "../middlewares/trycatch.js";
import cart from "../models/cart.js";
export const addToCart = TryCatch(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            message: "Login is required",
        });
    }
    const userId = req.user._id;
    const { restaurantId, itemId } = req.body;
    if (!mongoose.Types.ObjectId.isValid(restaurantId) ||
        !mongoose.Types.ObjectId.isValid(itemId)) {
        return res.status(400).json({
            message: "Invalid item or restaurantId",
        });
    }
    // vo saari cart le aao jinka bhi userId h aur restaurantId not equal to a restaurantId
    const cartFromDifferentRestaurant = await cart.findOne({
        userId,
    });
    console.log("cart from diff: ", cartFromDifferentRestaurant);
    if (cartFromDifferentRestaurant !== null &&
        cartFromDifferentRestaurant?.restaurantId.toString() !== restaurantId) {
        return res.status(400).json({
            message: "You can order from one restaurant at a time only. Please clear your cart to add items from this restaurant",
        });
    }
    const cartItem = await cart.findOneAndUpdate({ userId, restaurantId, itemId }, {
        $inc: { quantity: 1 },
        $setOnInsert: { userId, restaurantId, itemId },
    }, { upsert: true, new: true, setDefaultsOnInsert: true });
    return res.status(200).json({
        message: "Item added to cart",
        cart: cartItem,
    });
});
export const fetchMyCart = TryCatch(async (req, res) => {
    if (!req.user) {
        return res.status(400).json({
            message: "Please Login",
        });
    }
    const userId = req.user._id;
    const cartItems = await cart
        .find({ userId })
        .populate("itemId")
        .populate("restaurantId");
    // without populate, the cart item was having a reference the the user and the restaurant it has in the form of its object Id
    // but now it has the whole document and not just the object Id
    // console.log("Cart items: ", cartItems);
    let subTotal = 0;
    let totalQuantity = 0;
    for (const cartItem of cartItems) {
        const item = cartItem.itemId;
        subTotal += item.price * cartItem.quantity;
        totalQuantity += cartItem.quantity;
    }
    return res.json({
        success: true,
        totalQuantity,
        subTotal,
        cart: cartItems,
    });
});
export const incrementItem = TryCatch(async (req, res) => {
    if (!req.user) {
        return res.status(400).json({ message: "Please Login" });
    }
    const userId = req.user._id;
    const { restaurantId, itemId } = req.body;
    const cartItem = await cart.findOneAndUpdate({ userId, restaurantId, itemId }, { $inc: { quantity: 1 } }, { new: true, upsert: true });
    return res.status(200).json({
        message: "Item incremented",
        cartItem,
    });
});
export const decrementItem = TryCatch(async (req, res) => {
    if (!req.user) {
        return res.status(400).json({ message: "Please Login" });
    }
    const userId = req.user._id;
    const { restaurantId, itemId } = req.body;
    const cartItem = await cart.findOne({ userId, restaurantId, itemId });
    if (!cartItem) {
        return res.status(404).json({ message: "Item not found in cart" });
    }
    if (cartItem.quantity - 1 <= 0) {
        await cart.deleteOne({ _id: cartItem._id });
        return res.status(200).json({ message: "Item removed from cart" });
    }
    cartItem.quantity -= 1;
    await cartItem.save();
    return res.status(200).json({
        message: "Item decremented",
        cartItem,
    });
});
export const clearCart = TryCatch(async (req, res) => {
    if (!req.user) {
        return res.status(400).json({ message: "Please Login" });
    }
    await cart.deleteMany({ userId: req.user._id });
    return res.status(200).json({ message: "Cart cleared" });
});
