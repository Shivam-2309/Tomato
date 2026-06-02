import { AuthenticatedRequest } from "../middlewares/isAuth.js";
import TryCatch from "../middlewares/trycatch.js";

import Address from "../models/Address.js";
import cart from "../models/cart.js";
import { IMenuItem } from "../models/menuitems.js";
import Order from "../models/Order.js";
import Restaurant, { IRestaurant } from "../models/restaurant.js";

const getDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const createOrder = TryCatch(async (req: AuthenticatedRequest, res) => {
  const DELIVERY_FEE = 30;

  const user = req.user;

  if (!user) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  const { paymentMethod, addressId } = req.body;

  if (!addressId) {
    return res.status(400).json({
      message: "Address is required",
    });
  }

  if (!paymentMethod) {
    return res.status(400).json({
      message: "Payment method is required",
    });
  }

  const address = await Address.findOne({
    _id: addressId,
    userId: user._id,
  });

  if (!address) {
    return res.status(404).json({
      message: "Address not found",
    });
  }

  const cartItems = await cart
    .find({
      userId: user._id,
    })
    .populate<{ itemId: IMenuItem }>("itemId")
    .populate<{ restaurantId: IRestaurant }>("restaurantId");

  if (cartItems.length === 0) {
    return res.status(400).json({
      message: "Cart is empty",
    });
  }

  const firstCartItem = cartItems[0];

  if (!firstCartItem || !firstCartItem.restaurantId) {
    return res.status(400).json({
      message: "Invalid cart data",
    });
  }

  const restaurantId = firstCartItem.restaurantId._id;

  const restaurant = await Restaurant.findById(restaurantId);

  if (!restaurant) {
    return res.status(404).json({
      message: "Restaurant not found",
    });
  }

  if (!restaurant.isOpen) {
    return res.status(400).json({
      message: "Restaurant is currently closed",
    });
  }

  const distance = getDistanceKm(
    address.location.coordinates[1],
    address.location.coordinates[0],
    restaurant.autoLocation.coordinates[1],
    restaurant.autoLocation.coordinates[0],
  );

  let subTotal = 0;

  const orderItems = cartItems.map((cartItem) => {
    const item = cartItem.itemId;

    if (!item) {
      throw new Error("Invalid cart item");
    }

    const itemTotal = cartItem.quantity * item.price;

    subTotal += itemTotal;

    return {
      itemId: item._id.toString(),
      name: item.name,
      quantity: cartItem.quantity,
      price: item.price,
    };
  });

  const deliveryFee = subTotal > 149 ? 0 : DELIVERY_FEE;
  const platformFee = Number((0.08 * subTotal).toFixed(2));
  const totalAmount = Number((subTotal + deliveryFee + platformFee).toFixed(2));
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  const [longitude, latitude] = address.location.coordinates;

  const riderAmount = Math.ceil(distance) * 17;

  const order = await Order.create({
    userId: user._id.toString(),
    restaurantId: restaurantId.toString(),
    restaurantName: restaurant.name,
    riderId: null,
    distance,
    riderAmount,
    items: orderItems,
    subTotal,
    deliveryFee,
    platformFee,
    totalAmount,
    addressId: address._id.toString(),

    deliveryAddress: {
      formattedAddress: address.formattedAddress,
      mobile: address.mobile,
      latitude,
      longitude,
    },

    paymentMethod,
    paymentStatus: "pending",
    status: "placed",
    expiresAt,
  });

  await cart.deleteMany({
    userId: user._id,
  });

  return res.status(201).json({
    message: "Order created successfully",
    orderId: order._id.toString(),
    amount: totalAmount,
  });
});

export const fetchOrderForPayment = TryCatch(async (req, res) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({
      message: "forbidden",
    });
  }
  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(400).json({ message: "No Order Found" });
  }

  if (order.paymentStatus !== "pending") {
    return res.status(200).json({
      message: "Order is Paid already",
    });
  }

  res.json({
    orderId: order._id,
    amount: order.totalAmount,
    currency: "INR",
  });
});
