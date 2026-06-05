import Order from "../models/Order.js";
import { getChannel } from "./rabbitmq.js";
import axios from "axios";

export const startPaymentConsumer = async () => {
  const channel = getChannel();

  channel.consume(process.env.PAYMENT_QUEUE!, async (message) => {
    if (!message) return;

    try {
      const event = JSON.parse(message.content.toString());

      if (event.type !== "PAYMENT_SUCCESS") {
        channel.ack(message);
        return;
      }

      const { orderId } = event.data;

      const order = await Order.findOneAndUpdate(
        {
          _id: orderId,
          paymentStatus: { $ne: "paid" },
        },
        {
          $set: {
            paymentStatus: "paid",
            status: "placed",
          },
          $unset: {
            expiresAt: 1,
          },
        },
        { new: true },
      );

      if (!order) {
        channel.ack(message);
        return;
      }

      console.log("✅Order placed: ", order._id);
      // socket work to tell restaurant that the order is placed

      await axios.post(
        `${process.env.REALTIME_SERVICE}/api/v1/internal/emit`,
        {
          event: "order:new",
          room: `restaurant:${order.restaurantId}`,
          payload: {
            orderId: order._id,
          },
        },
        {
          headers: {
            "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
          },
        },
      );

      channel.ack(message);
    } catch (err) {
      console.log("❌ payment consumer error: ", err);
    }
  });
};
