import { getChannel } from "./rabbitmq.js";
export const publishIssueCreated = async (data) => {
    const channel = getChannel();
    channel.sendToQueue(process.env.AI_QUEUE, Buffer.from(JSON.stringify({
        eventType: "ISSUE_CREATED",
        ...data,
    })), {
        persistent: true,
    });
    console.log("📤 ISSUE_CREATED event published");
};
