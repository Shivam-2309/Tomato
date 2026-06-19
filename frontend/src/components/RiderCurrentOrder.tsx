import type { IOrder } from "../types";
import axios from "axios";
import { toast } from "react-hot-toast";
import { riderService } from "../main";

interface RiderCurrentOrderProps {
  order: IOrder;
  onStatusUpdate: () => void;
}

export const RiderCurrentOrder = ({
  order,
  onStatusUpdate,
}: RiderCurrentOrderProps) => {
  const updateStatus = async () => {
    try {
      await axios.put(
        `${riderService}/api/rider/order/update/${order._id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      toast.success("Order status updated");
      onStatusUpdate();
    } catch {
      toast.error("Failed to update order status");
    }
  };

  const statusSteps = ["rider_assigned", "picked_up", "delivered"];
  const currentStep = statusSteps.indexOf(order.status);

  const stepLabels: Record<string, string> = {
    rider_assigned: "Head to Restaurant",
    picked_up: "Out for Delivery",
    delivered: "Delivered",
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-[#e23744] px-5 py-4">
        <div className="flex justify-between items-start gap-2">
          <div>
            <p className="text-xs font-semibold text-red-200 uppercase tracking-wider mb-0.5">
              Active Delivery
            </p>
            <h2 className="text-base font-bold text-white leading-tight">
              {order.restaurantName}
            </h2>
          </div>
          <span className="flex-shrink-0 bg-white/20 text-white text-xs font-mono px-2.5 py-1 rounded-full">
            #{order._id.slice(-6).toUpperCase()}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between mb-1.5">
            {statusSteps.map((step, i) => (
              <span
                key={step}
                className={`text-[10px] font-semibold uppercase tracking-wide ${
                  i <= currentStep ? "text-white" : "text-red-300"
                }`}
              >
                {stepLabels[step]}
              </span>
            ))}
          </div>
          <div className="relative h-1.5 bg-white/25 rounded-full">
            <div
              className="absolute top-0 left-0 h-full bg-white rounded-full transition-all duration-500"
              style={{
                width: `${(currentStep / (statusSteps.length - 1)) * 100}%`,
              }}
            />
            <div className="absolute top-0 left-0 w-full flex justify-between items-center h-full">
              {statusSteps.map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full border-2 transition-all ${
                    i <= currentStep
                      ? "bg-white border-white"
                      : "bg-transparent border-white/40"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Delivery Address */}
        <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 flex gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-base">
            📍
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
              Deliver To
            </p>
            <p className="text-sm text-gray-800 font-medium leading-snug">
              {order.deliveryAddress.formattedAddress}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              📞 {order.deliveryAddress.mobile}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          <StatCard
            label="Distance"
            value={`${(order.distance / 1000).toFixed(2)} km`}
            color="text-blue-600"
            bg="bg-blue-50"
          />
          <StatCard
            label="Earnings"
            value={`₹${order.riderAmount ?? 0}`}
            color="text-green-600"
            bg="bg-green-50"
          />
          <StatCard
            label="Payment"
            value={order.paymentStatus}
            color="text-amber-600"
            bg="bg-amber-50"
          />
          <StatCard
            label="Bill"
            value={`₹${order.totalAmount}`}
            color="text-[#e23744]"
            bg="bg-red-50"
          />
        </div>

        {/* Items */}
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
            Order Items
          </p>
          <div className="space-y-1.5">
            {order.items.map((item) => (
              <div
                key={item.itemId}
                className="flex justify-between items-center bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#e23744]/10 text-[#e23744] text-[10px] font-bold flex items-center justify-center">
                    {item.quantity}
                  </span>
                  <p className="text-sm font-medium text-gray-800">
                    {item.name}
                  </p>
                </div>
                <p className="text-sm font-semibold text-gray-700">
                  ₹{item.price * item.quantity}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Bill Summary */}
        <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">
            Bill Summary
          </p>
          <div className="space-y-2 text-sm">
            <BillRow label="Subtotal" value={`₹${order.subTotal}`} />
            <BillRow label="Delivery Fee" value={`₹${order.deliveryFee}`} />
            <BillRow label="Platform Fee" value={`₹${order.platformFee}`} />
            <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-900">
              <span>Total</span>
              <span>₹{order.totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Footer meta */}
        <div className="flex gap-6 text-sm pt-1">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">
              Payment
            </p>
            <p className="font-semibold capitalize text-gray-700">
              {order.paymentMethod}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">
              Ordered At
            </p>
            <p className="font-semibold text-gray-700">
              {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        {/* CTA */}
        {order.status === "rider_assigned" && (
          <button
            onClick={updateStatus}
            className="w-full bg-amber-400 hover:bg-amber-500 active:scale-95 text-white py-3 rounded-xl text-sm font-bold tracking-wide transition-all shadow-sm shadow-amber-200"
          >
            ✅ Reached Restaurant
          </button>
        )}

        {order.status === "picked_up" && (
          <button
            onClick={updateStatus}
            className="w-full bg-[#e23744] hover:bg-[#cc2f3c] active:scale-95 text-white py-3 rounded-xl text-sm font-bold tracking-wide transition-all shadow-sm shadow-red-200"
          >
            🏁 Mark as Delivered
          </button>
        )}
      </div>
    </div>
  );
};

const StatCard = ({
  label,
  value,
  color,
  bg,
}: {
  label: string;
  value: string;
  color: string;
  bg: string;
}) => (
  <div className={`rounded-xl px-2.5 py-2 ${bg}`}>
    <p className="text-[10px] text-gray-500 mb-0.5">{label}</p>
    <p className={`text-xs font-bold ${color} leading-tight`}>{value}</p>
  </div>
);

const BillRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between text-gray-600">
    <span>{label}</span>
    <span className="font-medium text-gray-800">{value}</span>
  </div>
);
