import { useState } from "react";
import type { IOrder } from "../types";
import { ORDER_ACTIONS } from "../utils/orderflow";
import { restaurantService } from "../main";
import axios from "axios";
import toast from "react-hot-toast";

const statusColors: Record<string, string> = {
  placed: "bg-blue-100 text-blue-700",
  accepted: "bg-indigo-100 text-indigo-700",
  preparing: "bg-yellow-100 text-yellow-700",
  ready_for_rider: "bg-orange-100 text-orange-700",
  picked_up: "bg-cyan-100 text-cyan-700",
  delivered: "bg-green-100 text-green-700",
};

interface Props {
  order: IOrder;
  onStatusUpdate?: () => Promise<void>;
}

const OrderCard = ({ order, onStatusUpdate }: Props) => {
  const [loading, setLoading] = useState(false);

  const actions = ORDER_ACTIONS[order.status] || [];

  const updateStatus = async (status: string) => {
    try {
      setLoading(true);

      await axios.put(
        `${restaurantService}/api/order/${order._id}`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      toast.success("Order Updated Successfully");

      await onStatusUpdate?.();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to update order status",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">
            Order #{order._id.slice(-6).toUpperCase()}
          </h3>

          <p className="text-sm text-gray-500">
            {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            statusColors[order.status] || "bg-gray-100 text-gray-700"
          }`}
        >
          {order.status.replaceAll("_", " ").toUpperCase()}
        </span>
      </div>

      {/* Items */}
      <div className="mb-4">
        <h4 className="mb-2 text-sm font-semibold text-gray-700">Items</h4>

        <div className="space-y-2">
          {order.items?.map((item: any, index: number) => (
            <div
              key={index}
              className="flex items-center justify-between text-sm"
            >
              <span>
                {item.quantity} × {item.name}
              </span>

              <span className="font-medium">₹{item.price * item.quantity}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Total */}
      <div className="mb-4 flex justify-between border-t pt-3">
        <span className="font-medium text-gray-700">Total</span>

        <span className="font-bold text-gray-900">₹{order.totalAmount}</span>
      </div>

      {/* Actions */}
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {actions.map((action: any) => (
            <button
              key={action.nextStatus}
              disabled={loading}
              onClick={() => updateStatus(actions[0])}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Updating..." : action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderCard;
