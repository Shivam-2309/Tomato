import express from "express";
import dotenv from "dotenv";
import { startIssueConsumer } from "./config/ai.consumer.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5007;

await connectRabbitMQ();
startIssueConsumer();

app.listen(PORT, () => {
  console.log(`AI service is running on port ${PORT}`);
});
