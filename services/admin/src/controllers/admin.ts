import { Auth, ObjectId } from "mongodb";
import TryCatch from "../middlewares/trycatch.js";
import {
  getRestaurantCollection,
  getRiderCollection,
} from "../util/collection.js";
import { AuthenticatedRequest } from "../middlewares/isAuth.js";
import { Response } from "express";
import IssueService from "../services/issue-service.js";
import Issue from "../models/Issue.js";
import axios from "axios";
import getBuffer from "../config/datauri.js";
import { publishIssueCreated } from "../config/issue.publish.js";

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
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const file = req.file;
  if (!file) {
    return res.status(400).json({ message: "Issue image is required" });
  }

  const fileBuffer = getBuffer(file);
  if (!fileBuffer?.content) {
    return res.status(500).json({ message: "Failed to generate image buffer" });
  }

  const { data: uploadResult } = await axios.post(
    `${process.env.UTILS_SERVICE}/api/upload`,
    { buffer: fileBuffer.content },
  );

  const imageUrl = uploadResult.url;
  if (!imageUrl) {
    return res.status(500).json({ message: "Image upload failed" });
  }

  const { orderId, issueType, description } = req.body;

  console.log("Request: ", req);
  console.log("orderId", orderId);
  console.log("issueType", issueType);
  console.log("description", description);

  if (!orderId || !issueType || !description) {
    return res
      .status(400)
      .json({ message: "orderId, issueType and description are required" });
  }

  const issue = await IssueService.createIssue({
    orderId,
    customerId: req.user._id,
    issueType,
    description,
    imageUrl,
  });

  console.log("Issue created:", issue);
  console.log("Publishing issue created event to RabbitMQ...");

  await publishIssueCreated({
    issueId: issue._id.toString(),
    orderId: issue.orderId.toString(),
    customerId: issue.customerId.toString(),
    imageUrl: issue.imageUrl,
    description: issue.description,
    issueType: issue.issueType,
  });

  console.log("Issue created event published to RabbitMQ");

  return res.status(201).json({ success: true, issue });
};

export const getIssue = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    console.log("ID: ", id);

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
      orderId: id,
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
    // Abhi ke liye pagination is not added
    // abhi sirf raw request aaegi, default values hi use kro
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
      issues: issues,
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

export const updateAIResult = TryCatch(async (req, res) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({
      message: "forbidden",
    });
  }
  try {
    const { issueId } = req.params;

    const { aiResult, status } = req.body;

    console.log("AI RESULT: ", aiResult);

    const issue = await Issue.findByIdAndUpdate(
      issueId,
      {
        aiResult,
        status,
      },
      {
        new: true,
      },
    );

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    console.log("YAHAN TK AAGYA N FINALLY, AI HAS DONE ITS WORK");

    return res.status(200).json({
      success: true,
      issue,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export const approveIssue = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { id } = req.params;

    const issue = await Issue.findByIdAndUpdate(
      id,
      { status: "APPROVED", updatedAt: new Date() },
      { new: true },
    );

    if (!issue) {
      return res
        .status(404)
        .json({ success: false, message: "Issue not found" });
    }

    return res.status(200).json({ success: true, issue });
  } catch (error) {
    console.error("Error approving issue:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const rejectIssue = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const issue = await Issue.findByIdAndUpdate(
      id,
      { status: "REJECTED", updatedAt: new Date() },
      { new: true },
    );

    if (!issue) {
      return res
        .status(404)
        .json({ success: false, message: "Issue not found" });
    }

    return res.status(200).json({ success: true, issue });
  } catch (error) {
    console.error("Error rejecting issue:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
