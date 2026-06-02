import axios from "axios";
import { razorpay } from "../config/razorpay.js";
import { verifyRazorpaySignature } from "../config/verifyrazorpay.js";
import { publishPublishSuccess } from "../config/payment.producer.js";
export const createRazorpayOrder = async (req, res) => {
    const { orderId } = req.body;
    const { data } = await axios.get(`${process.env.RESTAURANT_SERVICE}/api/order/payment/${orderId}`, {
        headers: {
            "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
        },
    });
    const razorpayOrder = await razorpay.orders.create({
        amount: data.amount * 100,
        currency: "INR",
        receipt: orderId,
    });
    res.json({
        razorpayOrderId: razorpayOrder.id,
        key: process.env.RAZORPAY_KEY_ID,
    });
};
export const verifyRazorpayPayment = async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId, } = req.body;
    const isValid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) {
        return res.status(400).json({ message: "Payment Verification Failed" });
    }
    await publishPublishSuccess({
        orderId,
        paymentId: razorpay_payment_id,
        provider: "razorpay",
    });
    res.json({
        message: "Payment has been verified",
    });
};
