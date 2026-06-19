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

  return (
    <div className="max-w-2xl mx-auto rounded-2xl border border-gray-200 bg-white shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-[#e23744] text-white px-5 py-4 flex justify-between items-center flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold leading-tight">
            {order.restaurantName}
          </h2>
          <p className="text-xs opacity-80 mt-0.5">
            Order #{order._id.slice(-6).toUpperCase()}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold">{order.status}</p>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Delivery Address */}
        <section className="rounded-xl bg-gray-50 border border-gray-100 p-4 space-y-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Deliver To
          </p>
          <p className="text-sm text-gray-800 font-medium">
            {order.deliveryAddress.formattedAddress}
          </p>
          <p className="text-xs text-gray-500">
            📞 {order.deliveryAddress.mobile}
          </p>
        </section>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
          <Stat
            label="Distance"
            value={`${(order.distance / 1000).toFixed(2)} km`}
            bg="bg-blue-50"
          />
          <Stat
            label="Earnings"
            value={`₹${order.riderAmount ?? 0}`}
            bg="bg-green-50"
          />
          <Stat label="Payment" value={order.paymentStatus} bg="bg-yellow-50" />
          <Stat label="Bill" value={`₹${order.totalAmount}`} bg="bg-red-50" />
        </div>

        {/* Items */}
        <section>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Items
          </p>
          <div className="space-y-2">
            {order.items.map((item) => (
              <div
                key={item.itemId}
                className="flex justify-between items-center rounded-xl border border-gray-100 bg-gray-50 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {item.name}
                  </p>
                  <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold text-gray-700">
                  ₹{item.price * item.quantity}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Bill Summary */}
        <section className="rounded-xl bg-gray-50 border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Bill Summary
          </p>
          <div className="space-y-1.5 text-sm text-gray-600">
            <BillRow label="Subtotal" value={`₹${order.subTotal}`} />
            <BillRow label="Delivery Fee" value={`₹${order.deliveryFee}`} />
            <BillRow label="Platform Fee" value={`₹${order.platformFee}`} />
            <div className="border-t border-gray-200 pt-2 mt-1 flex justify-between font-bold text-gray-900 text-sm">
              <span>Total</span>
              <span>₹{order.totalAmount}</span>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
          <div className="flex gap-6 text-sm">
            <div>
              <p className="text-xs text-gray-400">Payment</p>
              <p className="font-semibold capitalize text-gray-700">
                {order.paymentMethod}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Ordered At</p>
              <p className="font-semibold text-gray-700">
                {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          {order.status === "rider_assigned" && (
            <button
              onClick={() => updateStatus()}
              className="bg-[#cedf19] hover:bg-[#efb230] active:scale-95 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            >
              Reached Restaurant
            </button>
          )}

          {order.status === "picked_up" && (
            <button
              onClick={() => updateStatus()}
              className="bg-[#e23744] hover:bg-[#cc2f3c] active:scale-95 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            >
              Mark as Delivered
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const Stat = ({
  label,
  value,
  bg,
}: {
  label: string;
  value: string;
  bg: string;
}) => (
  <div className={`rounded-xl px-3 py-2.5 ${bg}`}>
    <p className="text-xs text-gray-500">{label}</p>
    <p className="text-sm font-semibold text-gray-800 mt-0.5">{value}</p>
  </div>
);

const BillRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between">
    <span>{label}</span>
    <span>{value}</span>
  </div>
);
