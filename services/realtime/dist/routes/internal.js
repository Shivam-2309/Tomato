"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const socket_1 = require("../socket");
const router = express_1.default.Router();
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
    const io = (0, socket_1.getIO)();
    console.log(`📶 emitting event ${event} to ${room}`);
    io.to(room).emit(event, payload ?? []);
    return res.json({
        success: true,
    });
});
exports.default = router;
