import getBuffer from "../config/datauri.js";
import { AuthenticatedRequest } from "../middlewares/isAuth.js";
import TryCatch from "../middlewares/trycatch.js";
import axios from "axios";
import { Rider } from "../model/Rider.js";

export const addRiderProfile = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (user.role !== "Rider") {
      return res.status(403).json({
        message: "Only riders can create a rider profile",
      });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({
        message: "rider image is required",
      });
    }

    /*
      When a file is submitted via FormData from the frontend, it travels across the network as a raw binary stream that cannot be parsed by standard request-body parsers. 
      To handle this, backend middleware like Multer intercepts the multipart stream, isolates the file payload, and loads it temporarily into server memory as a hexadecimal byte buffer (req.file.buffer). 
      Because external media APIs cannot directly ingest these raw bytes over standard JSON requests, a helper utility like DataUriParser is used to format the buffer and file extension into a standardized Base64 Data URI text string. 
      This text-based payload is then safely transmitted to a cloud storage provider like Cloudinary, which hosts the heavy asset and returns a lightweight, optimized secure web URL. 
      Finally, this URL string—rather than the actual data-heavy file—is persisted inside MongoDB to keep the database collection lean, fast, and scalable.
    */
    const fileBuffer = getBuffer(file);

    if (!fileBuffer || !fileBuffer?.content) {
      return res.status(500).json({
        message: "Failed to generate image buffer",
      });
    }

    const { data: uploadResult } = await axios.post(
      `${process.env.UTILS_SERVICE}/api/upload`,
      {
        buffer: fileBuffer.content,
      },
    );

    const {
      phoneNumber,
      aadharNumber,
      drivingLicenseNumber,
      latitude,
      longitude,
    } = req.body;

    if (
      !phoneNumber ||
      !aadharNumber ||
      !drivingLicenseNumber ||
      !latitude ||
      !longitude
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const existingProfile = await Rider.findOne({
      userId: user._id,
    });

    if (existingProfile) {
      return res.status(400).json({
        message: "You already have a rider profile",
      });
    }

    const riderProfile = new Rider({
      userId: user._id,
      phoneNumber,
      aadharNumber,
      drivingLicenseNumber,
      location: {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      },
      picture: uploadResult.url,
      isAvailable: false,
      isVerified: false,
    });

    await riderProfile.save();

    res.status(201).json({
      message: "Rider profile created successfully",
      riderProfile,
    });
  },
);

export const fetchMyRiderProfile = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (user.role !== "Rider") {
      return res.status(403).json({
        message: "Only riders can access their rider profile",
      });
    }

    const riderProfile = await Rider.findOne({
      userId: user._id,
    });

    if (!riderProfile) {
      return res.status(404).json({
        message: "Rider profile not found",
      });
    }

    res.status(200).json({
      message: "Rider profile fetched successfully",
      riderProfile,
    });
  },
);

export const toggleRiderAvailability = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (user.role !== "Rider") {
      return res.status(403).json({
        message: "Only riders can toggle their availability",
      });
    }

    const riderProfile = await Rider.findOne({
      userId: user._id,
    });

    if (!riderProfile) {
      return res.status(404).json({
        message: "Rider profile not found",
      });
    }

    const { isAvailable, latitude, longitude } = req.body;

    if (typeof isAvailable !== "boolean") {
      return res.status(400).json({
        message: "isAvailable must be boolean",
      });
    }

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        message: "location is required",
      });
    }

    const rider = await Rider.findOne({
      userId: user._id,
    });

    if (!rider) {
      return res.status(404).json({
        message: "Rider profile not found",
      });
    }

    if (isAvailable && !rider.isVerified) {
      return res.status(403).json({
        message: "Rider is not verified",
      });
    }

    rider.isAvailable = isAvailable;

    rider.location = {
      type: "Point",
      coordinates: [longitude, latitude],
    };
    rider.lastActiveAt = new Date();

    await rider.save();

    return res.status(200).json({
      message: isAvailable ? "Rider is now online" : "Rider is now offline ",
      rider,
    });
  },
);

export const acceptOrder = TryCatch(async (req: AuthenticatedRequest, res) => {
  const riderUserId = req.user?._id;
  const { orderId } = req.params;

  if (!riderUserId) {
    return res.status(400).json({
      message: "Please Login",
    });
  }

  const rider = await Rider.findOne({ userId: riderUserId, isAvailable: true });

  if (!rider) {
    res.status(404).json({
      message: "Rider not found",
    });
  }

  try {
    const { data } = await axios.put(
      `${process.env.RESTAURANT_SERVICE}/api/order/assign/rider`,
      {
        orderId,
        riderId: rider?._id,
        riderUserId: rider?.userId,
        riderName: rider?.picture,
        riderPhone: rider?.phoneNumber,
      },
      {
        headers: {
          "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
        },
      },
    );

    if (data.success) {
      const riderDetails = await Rider.findOneAndUpdate(
        {
          userId: riderUserId,
          isAvailable: true,
        },
        { isAvailable: false },
        {
          new: true,
        },
      );

      res.json({ message: "Order accepted" });
    }
  } catch (error) {
    res.status(400).json({
      message: "Order already taken",
    });
  }
});

export const fetchMyCurrentOrder = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const riderUserId = req.user?._id;
    if (!riderUserId) {
      return res.status(400).json({
        message: "Please Login",
      });
    }

    const rider = await Rider.findOne({
      userId: riderUserId,
      isAvailable: true,
    });

    if (!rider) {
      res.status(404).json({
        message: "Rider not found",
      });
    }

    try {
      if (!rider) throw new Error("no rider found");

      console.log("rider id", rider._id);

      const { data } = await axios.get(
        `${process.env.RESTAURANT_SERVICE}/api/order/current/rider?riderId=${rider._id}`,
        {
          headers: {
            "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
          },
        },
      );

      res.json({ order: data });
    } catch (err: any) {
      res.status(500).json({
        message: err.response.data.message,
      });
    }
  },
);

export const updateOrderStatus = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        message: "Please login",
      });
    }

    const rider = await Rider.findOne({ userId: userId });

    if (!rider) {
      return res.status(404).json({
        message: "No Rider found",
      });
    }

    const { orderId } = req.params;

    try {
      const { data } = await axios.put(
        `${process.env.RESTAURANT_SERVICE}/api/order/update/status/rider`,
        {
          orderId,
        },
        {
          headers: {
            "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
          },
        },
      );

      res.json({
        message: data.message,
      });
    } catch (err) {
      res.status(500).json({
        message: "Internal Server Error",
      });
    }
  },
);
