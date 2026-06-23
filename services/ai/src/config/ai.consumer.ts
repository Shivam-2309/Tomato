import axios from "axios";
import { getChannel } from "./rabbitmq.js";
import { analyzeIssue } from "../services/issueAnalysis.js";

export const startIssueConsumer = async () => {
  const channel = getChannel();

  channel.consume(process.env.AI_QUEUE!, async (message) => {
    if (!message) return;

    try {
      const event = JSON.parse(message.content.toString());

      if (event.eventType !== "ISSUE_CREATED") {
        channel.ack(message);
        return;
      }

      console.log("📥 Event Received:", event);

      const aiResult = await analyzeIssue(event.imageUrl, event.description);

      console.log("🤖 AI Result:", aiResult);

      // This is an internal API make sure it is working fine
      await axios.patch(
        `${process.env.ADMIN_SERVICE_URL}/api/v1/issues/${event.issueId}/ai-result`,
        {
          aiResult,
          status: "ADMIN_REVIEW_PENDING",
        },
        {
          headers: {
            "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
          },
        },
      );

      console.log(`✅ Issue ${event.issueId} updated successfully`);

      channel.ack(message);
    } catch (error) {
      console.error("❌ AI Consumer Error:", error);
    }
  });
};
