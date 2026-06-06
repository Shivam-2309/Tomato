import type { IOrder } from "../types";

const statusColors: Record<string, string> = {
  placed: "bg-blue-100 text-blue-700",
  accepted: "bg-indigo-100 text-indigo-700",
  preparing: "bg-yellow-100 text-yellow-700",
  ready_for_rider: "bg-orange-100 text-orange-700",
  rider_assigned: "bg-purple-100 text-purple-700",
  picked_up: "bg-cyan-100 text-cyan-700",

  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const OrderCard = ({ order }: { order: IOrder }) => {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Order #{order._id.slice(-6)}</h3>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            statusColors[order.status] || "bg-gray-100 text-gray-700"
          }`}
        >
          {order.status.replaceAll("_", " ").toUpperCase()}
        </span>
      </div>

      <div className="mt-4 space-y-2 text-sm text-gray-600">
        <p>
          <span className="font-medium">Customer:</span> {order.userId || "N/A"}
        </p>

        <p>
          <span className="font-medium">Items:</span> {order.items?.length || 0}
        </p>

        <p>
          <span className="font-medium">Amount:</span> ₹{order.totalAmount}
        </p>
      </div>
    </div>
  );
};

export default OrderCard;
