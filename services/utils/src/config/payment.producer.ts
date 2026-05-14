import { getChannel } from "./rabbitmq.js";

// publish a message when payment is successfull
export const publishPublishSuccess = (payload: {
  orderId: string;
  paymentId: string;
  provider: "razorpay" | "stripe";
}) => {
  const channel = getChannel();

  channel.sendToQueue(
    process.env.PAYMENT_QUEUE!,
    Buffer.from(
      JSON.stringify({
        type: "PAYMENT_SUCCESS",
        data: payload,
      }),
    ),
    { persistent: true },
  );
};
