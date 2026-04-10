import mongoose from "mongoose";
import { AuthenticatedRequest } from "../middlewares/isAuth.js";
import TryCatch from "../middlewares/trycatch.js";
import cart from "../models/cart.js";

export const addToCart = TryCatch(async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Login is required",
    });
  }

  const userId = req.user._id;
  const { restaurantId, itemId } = req.body;

  if (
    !mongoose.Types.ObjectId.isValid(restaurantId) ||
    !mongoose.Types.ObjectId.isValid(itemId)
  ) {
    return res.status(400).json({
      message: "Invalid item or restaurantId",
    });
  }
  // vo saari cart le aao jinka bhi userId h aur restaurantId not equal to a restaurantId
  const cartFromDifferentRestaurant = await cart.findOne({
    userId,
    restaurtantId: { $ne: restaurantId },
  });

  if (cartFromDifferentRestaurant) {
    res.status(400).json({
      message:
        "You can order from one restaurant at a time only. Please clear your cart to add items from this restaurant",
    });
  }

  const cartItem = await cart.findOneAndUpdate(
    { userId, restaurantId, itemId },
    {
      $inc: { quanitity: 1 },
      $setOnInsert: { userId, restaurantId, itemId },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  return res.status(200).json({
    message: "Item added to cart",
    cart: cartItem,
  });
});

export const fetchMyCart = TryCatch(async (req: AuthenticatedRequest, res) => {
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

  let subTotal = 0;
  let totalQuantity = 0;

  for (const cartItem of cartItems) {
    const item: any = cartItem.itemId;
    subTotal += item.price * item.quanitity;
    totalQuantity += item.quanitity;
  }

  return res.json({
    success: true,
    totalQuantity,
    subTotal,
    cart: cartItems,
  });
});
