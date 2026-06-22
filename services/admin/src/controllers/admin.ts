import { ObjectId } from "mongodb";
import TryCatch from "../middlewares/trycatch.js";
import {
  getRestaurantCollection,
  getRiderCollection,
} from "../util/collection.js";
import { AuthenticatedRequest } from "../middlewares/isAuth.js";
import { Response } from "express";
import IssueService from "../services/issue-service.js";
import Issue from "../models/Issue.js";
import mongoose from "mongoose";

export const getPendingRestaurants = TryCatch(async (req, res) => {
  const restaurantCollection = await getRestaurantCollection();
  const pendingRestaurants = await restaurantCollection
    .find({ isVerified: false })
    .toArray();
  res.status(200).json({
    count: pendingRestaurants.length,
    restaurants: pendingRestaurants,
  });
});

export const getPendingRiders = TryCatch(async (req, res) => {
  const riderCollection = await getRiderCollection();
  const pendingRiders = await riderCollection
    .find({ isVerified: false })
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
    { $set: { isVerified: true, updatedAt: new Date() } },
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
    { $set: { isVerified: true, updatedAt: new Date() } },
  );
  if (result.modifiedCount === 0) {
    return res
      .status(404)
      .json({ message: "Rider not found or already verified" });
  }
  res.status(200).json({ message: "Rider verified successfully" });
});

export const createIssue = async (req: AuthenticatedRequest, res: Response) => {
  const { orderId, issueType, description, imageUrl } = req.body;
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const userId = req.user._id;

  const issue = await IssueService.createIssue({
    orderId,
    customerId: userId,
    issueType,
    description,
    imageUrl,
  });

  return res.status(201).json({
    success: true,
    issue,
  });
};

export const getIssue = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "No issue ID provided",
      });
    }

    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const issue = await Issue.findOne({
      _id: id,
      customerId: req.user._id,
    });

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    return res.status(200).json({
      success: true,
      issue,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const getAllIssues = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    let { page = 1, limit = 10 } = req.query;

    page = Number(page);
    limit = Number(limit);

    const skip = (page - 1) * limit;

    const issues = await Issue.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Issue.countDocuments();

    return res.status(200).json({
      success: true,
      data: issues,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};
