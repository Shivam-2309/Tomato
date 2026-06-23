import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import adminRoutes from "./routes/admin.js";
import issueRoutes from "./routes/issues.js";
import connectDBviaMongoose from "./config/connnectDBMongoose.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

await connectRabbitMQ();

app.use("/api/v1", adminRoutes);
app.use("/api/v1/issues", issueRoutes);
app.listen(process.env.PORT, () => {
  console.log(`Admin service is running on port ${process.env.PORT || 3000}`);
  connectDBviaMongoose();
});
