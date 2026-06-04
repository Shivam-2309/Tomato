import express from "express";
import { getIO } from "../socket";

const router = express.Router();

router.post("/emit", (req, res) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({
      message: "forbidden",
    });
  }

  const { room, payload, event } = req.body;

  if (!room || !event) {
    return res.status(400).json({
      message: "Room and Event are required",
    });
  }

  const io = getIO();

  console.log(`📶 emitting event ${event} to ${room}`);

  io.to(room).emit(event, payload ?? []);

  return res.json({
    success: true,
  });
});

export default router;
