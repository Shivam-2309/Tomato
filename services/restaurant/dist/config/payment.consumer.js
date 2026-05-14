import Order from "../models/Order.js";
import { getChannel } from "./rabbitmq.js";
export const startPaymentConsumer = async () => {
    const channel = getChannel();
    channel.consume(process.env.PAYMENT_QUEUE, async (message) => {
        if (!message)
            return;
        try {
            const event = JSON.parse(message.content.toString());
            if (event.type !== "PAYMENT_SUCCESS") {
                channel.ack(message);
                return;
            }
            const { orderId } = event.data;
            const order = await Order.findOneAndUpdate({
                _id: orderId,
                paymentStatus: { $ne: "paid" },
            }, {
                $set: {
                    paymentStatus: "paid",
                    status: "placed",
                },
                $unset: {
                    expiresAt: 1,
                },
            }, { new: true });
            if (!order) {
                channel.ack(message);
                return;
            }
            console.log("✅Order placed: ", order._id);
            // socket work to tell restaurant that the order is placed
            channel.ack(message);
        }
        catch (err) {
            console.log("❌ payment consumer error: ", err);
        }
    });
};
