import { getChannel } from "./rabbitmq.js";

export const publishIssueCreated = async (data: {
  issueId: string;
  orderId: string;
  customerId: string;
  imageUrl: string;
  description: string;
  issueType: string;
}) => {
  const channel = getChannel();

  channel.sendToQueue(
    process.env.AI_QUEUE!,
    Buffer.from(
      JSON.stringify({
        eventType: "ISSUE_CREATED",
        ...data,
      }),
    ),
    {
      persistent: true,
    },
  );

  console.log("📤 ISSUE_CREATED event published");
};
