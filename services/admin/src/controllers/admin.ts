import { ObjectId } from "mongodb";
import TryCatch from "../middlewares/trycatch.js";
import {
  getRestaurantCollection,
  getRiderCollection,
} from "../util/collection.js";

export const getPendingRestaurants = TryCatch(async (req, res) => {
  const restaurantCollection = await getRestaurantCollection();
  const pendingRestaurants = await restaurantCollection
    .find({ isVerified: "false" })
    .toArray();
  res.status(200).json({
    count: pendingRestaurants.length,
    restaurants: pendingRestaurants,
  });
});

export const getPendingRiders = TryCatch(async (req, res) => {
  const riderCollection = await getRiderCollection();
  const pendingRiders = await riderCollection
    .find({ isVerified: "false" })
    .toArray();
  res.status(200).json({
    count: pendingRiders.length,
    riders: pendingRiders,
  });
});

export const verifyRestaurant = TryCatch(async (req, res) => {
  const { id } = req.params;

  if (typeof id !== "string") {
    return res.status(400).json({ message: "Invalid restaurant id" });
  }
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid restaurant id" });
  }

  const restaurantCollection = await getRestaurantCollection();
  const result = await restaurantCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { isVerified: "true" }, updatedAt: new Date() },
  );

  if (result.modifiedCount === 0) {
    return res
      .status(404)
      .json({ message: "Restaurant not found or already verified" });
  }
  res.status(200).json({ message: "Restaurant verified successfully" });
});

export const verifyRider = TryCatch(async (req, res) => {
  const { id } = req.params;

  if (typeof id !== "string") {
    return res.status(400).json({ message: "Invalid rider id" });
  }
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid rider id" });
  }

  const riderCollection = await getRiderCollection();
  const result = await riderCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { isVerified: "true" }, updatedAt: new Date() },
  );

  if (result.modifiedCount === 0) {
    return res
      .status(404)
      .json({ message: "Rider not found or already verified" });
  }
  res.status(200).json({ message: "Rider verified successfully" });
});
