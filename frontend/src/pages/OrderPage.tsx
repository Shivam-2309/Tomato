import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import type { IOrder } from "../types";
import { restaurantService } from "../main";
import { useSocket } from "../context/SocketContext";
import { Store, Receipt, MapPin, Bike, CreditCard, Clock3 } from "lucide-react";

const ORDER_STEPS = [
  "placed",
  "accepted",
  "preparing",
  "ready_for_rider",
  "rider_assgined",
  "picked_up",
  "delivered",
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "accepted":
      return "bg-blue-100 text-blue-700";
    case "preparing":
      return "bg-yellow-100 text-yellow-700";
    case "ready_for_rider":
      return "bg-purple-100 text-purple-700";
    case "rider_assgined":
      return "bg-indigo-100 text-indigo-700";
    case "picked_up":
      return "bg-orange-100 text-orange-700";
    case "delivered":
      return "bg-green-100 text-green-700";
    case "cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const formatStatus = (status: string) =>
  status.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());

export const OrderPage = () => {
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const { socket } = useSocket();

  const [order, setOrder] = useState<IOrder | null>(null);

  const fetchOrder = async () => {
    try {
      setLoading(true);

      const { data } = await axios.get(
        `${restaurantService}/api/order/myOrder/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      setOrder(data.order);
    } catch (error) {
      console.error("Error fetching order:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  useEffect(() => {
    if (!socket) return;

    const onSocketUpdate = () => {
      fetchOrder();
    };

    socket.on("order:update", onSocketUpdate);

    return () => {
      socket.off("order:update", onSocketUpdate);
    };
  }, [socket, id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex justify-center items-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-[#E23744] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-500">Loading order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[60vh] flex justify-center items-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Order not found</h2>
        </div>
      </div>
    );
  }

  const currentStep = ORDER_STEPS.indexOf(order.status);

  const totalItems = order.items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-50 via-white to-red-50 rounded-3xl border border-red-100 p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h4 className="text-xl font-bold text-gray-800">
              Order #{order._id.slice(-6)}
            </h4>

            <div className="flex items-center gap-2 mt-2 text-gray-500">
              <Clock3 size={16} />
              <span>{new Date(order.createdAt).toLocaleString()}</span>
            </div>
          </div>

          <span
            className={`px-5 py-2 rounded-full text-sm font-semibold shadow-sm ${getStatusColor(
              order.status,
            )} ${
              order.status !== "delivered" && order.status !== "cancelled"
                ? "animate-pulse"
                : ""
            }`}
          >
            {formatStatus(order.status)}
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4 mt-5">
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
          <p className="text-sm text-gray-500">Items Ordered</p>
          <p className="text-3xl font-bold text-black">{totalItems}</p>
        </div>

        <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
          <p className="text-sm text-gray-500">Order Total</p>
          <p className="text-3xl font-bold text-black">₹{order.totalAmount}</p>
        </div>

        <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
          <p className="text-sm text-gray-500">Payment Status</p>
          <p className="text-xl font-bold text-black capitalize">
            {order.paymentStatus}
          </p>
        </div>
      </div>

      {/* Progress Tracker */}
      {order.status !== "cancelled" && (
        <div className="bg-white rounded-3xl border border-red-100 p-6 mt-5 shadow-sm">
          <h2 className="font-semibold text-lg mb-6 text-red-600">
            Order Progress
          </h2>

          <div className="relative">
            <div className="absolute top-4 left-0 right-0 h-1 bg-gray-200 rounded-full">
              <div
                className="h-full bg-red-500 rounded-full transition-all duration-700"
                style={{
                  width:
                    currentStep >= 0
                      ? `${(currentStep / (ORDER_STEPS.length - 1)) * 100}%`
                      : "0%",
                }}
              />
            </div>

            <div className="flex justify-between">
              {ORDER_STEPS.map((step, index) => (
                <div
                  key={step}
                  className="flex flex-col items-center relative z-10"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                    ${
                      index <= currentStep
                        ? "bg-[#E23744]  text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {index + 1}
                  </div>

                  <span className="text-[10px] text-center mt-2 max-w-15">
                    {formatStatus(step)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Restaurant */}
      <div className="bg-white rounded-3xl border border-[#E23744] p-5 mt-5 shadow-sm hover:shadow-md transition">
        <h2 className="flex items-center gap-2 font-semibold text-lg mb-3">
          <Store size={18} className="text-[#E23744]" />
          Restaurant
        </h2>

        <p className="text-gray-700 font-medium">{order.restaurantName}</p>
      </div>

      {/* Items */}
      <div className="bg-white rounded-3xl border border-[#E23744] p-5 mt-5 shadow-sm hover:shadow-md transition">
        <h2 className="flex items-center gap-2 font-semibold text-lg mb-4">
          <Receipt size={18} className="text-[#E23744]" />
          Order Items
        </h2>

        <div className="space-y-4">
          {order.items.map((item) => (
            <div
              key={item.itemId}
              className="flex justify-between items-center border-b last:border-b-0 pb-3"
            >
              <div>
                <p className="font-semibold">{item.name}</p>

                <span className="inline-block mt-2 px-3 py-1 text-xs bg-red-50 text-red-600 rounded-full">
                  Qty {item.quantity}
                </span>
              </div>

              <p className="font-bold text-gray-700">
                ₹{item.price * item.quantity}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Bill */}
      <div className="bg-white rounded-3xl border border-[#E23744] p-5 mt-5 shadow-sm hover:shadow-md transition">
        <h2 className="flex items-center gap-2 font-semibold text-lg mb-4">
          <Receipt size={18} className="text-[#E23744]" />
          Bill Details
        </h2>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>₹{order.subTotal}</span>
          </div>

          <div className="flex justify-between">
            <span>Delivery Fee</span>
            <span>₹{order.deliveryFee}</span>
          </div>

          <div className="flex justify-between">
            <span>Platform Fee</span>
            <span>₹{order.platformFee}</span>
          </div>

          <hr />

          <div className="flex justify-between font-bold text-2xl text-red-600 pt-2">
            <span>Total</span>
            <span>₹{order.totalAmount}</span>
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="bg-white rounded-3xl border border-[#E23744] p-5 mt-5 shadow-sm hover:shadow-md transition">
        <h2 className="flex items-center gap-2 font-semibold text-lg mb-3">
          <MapPin size={18} className="text-[#E23744]" />
          Delivery Address
        </h2>

        <p className="text-gray-700">
          {order.deliveryAddress.formattedAddress}
        </p>

        <p className="text-gray-500 mt-3">
          Mobile: {order.deliveryAddress.mobile}
        </p>
      </div>

      {/* Rider */}
      {order.riderId && (
        <div className="bg-white rounded-3xl border border-[#E23744] p-5 mt-5 shadow-sm hover:shadow-md transition">
          <h2 className="flex items-center gap-2 font-semibold text-lg mb-3">
            <Bike size={18} className="text-[#E23744]" />
            Rider Details
          </h2>

          <div className="space-y-2">
            <p>
              <span className="font-semibold">Name:</span> {order.riderName}
            </p>

            <p>
              <span className="font-semibold">Phone:</span> {order.riderPhone}
            </p>
          </div>
        </div>
      )}

      {/* Payment */}
      <div className="bg-white rounded-3xl border border-[#E23744] p-5 mt-5 shadow-sm hover:shadow-md transition">
        <h2 className="flex items-center gap-2 font-semibold text-lg mb-3">
          <CreditCard size={18} className="text-[#E23744]" />
          Payment Information
        </h2>

        <div className="space-y-2">
          <p>
            <span className="font-semibold">Method:</span> {order.paymentMethod}
          </p>

          <p>
            <span className="font-semibold">Status:</span>{" "}
            <span className="capitalize text-green-600 font-medium">
              {order.paymentStatus}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};
