"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
const socket_js_1 = require("./socket.js");
const internal_js_1 = __importDefault(require("./routes/internal.js"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// This API enpoint is not for frontend clients !!
app.use("/api/v1/internal", internal_js_1.default);
const server = http_1.default.createServer(app);
(0, socket_js_1.initSocket)(server);
server.listen(process.env.PORT, () => {
    console.log(`Realtime service is running on PORT ${process.env.PORT}`);
});
