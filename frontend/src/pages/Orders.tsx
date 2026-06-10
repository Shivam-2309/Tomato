import axios from "axios";
import { useEffect, useState } from "react";
import { restaurantService } from "../main";
import toast from "react-hot-toast";
import type { IOrder } from "../types";
import { useSocket } from "../context/SocketContext";
import { useNavigate } from "react-router-dom";

const ACTIVE_STATUSES = [
  "placed",
  "accepted",
  "preparing",
  "ready_for_rider",
  "rider_assigned",
  "picked_up",
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "accepted":
      return "bg-blue-100 text-blue-700";
    case "preparing":
      return "bg-yellow-100 text-yellow-700";
    case "ready_for_rider":
      return "bg-purple-100 text-purple-700";
    case "rider_assigned":
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

const OrderCard = ({ order }: { order: IOrder }) => {
  const navigate = useNavigate();

  const totalItems = order.items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div
      onClick={() => navigate(`/orders/${order._id}`)}
      className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex justify-between items-start gap-4">
        <div>
          <h3 className="font-semibold text-lg">{order.restaurantName}</h3>
          <p className="text-sm text-gray-500">Order #{order._id.slice(-6)}</p>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
            order.status,
          )}`}
        >
          {formatStatus(order.status)}
        </span>
      </div>

      <div className="mt-3 text-sm text-gray-600">
        <p>
          {totalItems} item{totalItems > 1 ? "s" : ""}
        </p>

        <p className="truncate mt-1">
          {order.items
            .slice(0, 2)
            .map((item) => `${item.name} x${item.quantity}`)
            .join(", ")}
          {order.items.length > 2 && ` +${order.items.length - 2} more`}
        </p>
      </div>

      <div className="mt-4 flex justify-between items-center">
        <div>
          <p className="text-xs text-gray-500">Total Amount</p>
          <p className="font-bold text-lg">₹{order.totalAmount}</p>
        </div>

        <div className="text-right">
          <p className="text-xs text-gray-500">Ordered On</p>
          <p className="text-sm font-medium">
            {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
};

const Orders = () => {
  const [loading, setLoading] = useState(false);
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [currentPageActiveOrder, setCurrentPageActiveOrder] = useState(0);
  const [currentPageCompletedOrder, setCurrentPageCompletedOrder] = useState(0);

  const fetchMyOrders = async () => {
    try {
      setLoading(true);

      const { data } = await axios.get(`${restaurantService}/api/order/my`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setOrders(data.orders || []);
    } catch (err) {
      toast.error("Unable to get your orders currently");
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyOrders();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const onSocketUpdate = () => {
      fetchMyOrders();
    };

    socket.on("order:update", onSocketUpdate);

    return () => {
      socket.off("order:update", onSocketUpdate);
    };
  }, [socket]);

  if (loading) {
    return <p className="text-center text-lg py-10">Loading orders...</p>;
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-xl font-semibold">No Orders Yet</h2>
        <p className="text-gray-500 mt-2">
          Looks like you haven't placed any orders.
        </p>

        <button
          onClick={() => navigate("/")}
          className="mt-5 px-5 py-2 rounded-lg bg-black text-white"
        >
          Explore Restaurants
        </button>
      </div>
    );
  }

  const activeOrders = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const completedOrders = orders.filter(
    (o) => !ACTIVE_STATUSES.includes(o.status),
  );
  const PAGE_SIZE = 4;

  const totalPagesActiveOrder = Math.ceil(activeOrders.length / PAGE_SIZE);
  const startActiveOrder = currentPageActiveOrder * PAGE_SIZE;
  const endActiveOrder = startActiveOrder + PAGE_SIZE;

  const totalPagesCompletedOrder = Math.ceil(
    completedOrders.length / PAGE_SIZE,
  );
  const startCompletedOrder = currentPageCompletedOrder * PAGE_SIZE;
  const endCompletedOrder = startCompletedOrder + PAGE_SIZE;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>

      {activeOrders.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4">
            Active Orders ({activeOrders.length})
          </h2>

          <div className="flex gap-2 mb-6">
            <button
              disabled={startActiveOrder === 0}
              onClick={() =>
                setCurrentPageActiveOrder((prev) => Math.max(0, prev - 1))
              }
              className="p-2 rounded-lg"
            >
              ⬅️
            </button>
            {[...Array(totalPagesActiveOrder).keys()].map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPageActiveOrder(page)}
                className={`px-4 py-2 rounded-lg ${
                  currentPageActiveOrder === page
                    ? "bg-black text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {page + 1}
              </button>
            ))}
            <button
              onClick={() =>
                setCurrentPageActiveOrder((prev) =>
                  Math.min(totalPagesActiveOrder - 1, prev + 1),
                )
              }
              className="p-2 rounded-lg"
            >
              ➡️
            </button>
          </div>

          <div className="grid gap-4">
            {activeOrders
              .slice(startActiveOrder, endActiveOrder)
              .map((order) => (
                <OrderCard key={order._id} order={order} />
              ))}
          </div>
        </section>
      )}

      {completedOrders.length > 0 && (
        <section className="mt-10">
          <button
            disabled={startCompletedOrder === 0}
            onClick={() => {
              setCurrentPageCompletedOrder((prev) => Math.max(0, prev - 1));
            }}
            className="rounded-lg px-2"
          >
            ⬅️
          </button>
          {[...Array(totalPagesCompletedOrder).keys()].map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPageCompletedOrder(page)}
              className={`px-4 py-2 rounded-lg ${
                currentPageCompletedOrder === page
                  ? "bg-black text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {page + 1}
            </button>
          ))}
          <button
            disabled={startCompletedOrder === totalPagesCompletedOrder - 1}
            onClick={() => {
              setCurrentPageCompletedOrder((prev) => Math.min(0, prev + 1));
            }}
            className="rounded-lg px-2"
          >
            ➡️
          </button>
          <h2 className="text-xl font-semibold mb-4">
            Previous Orders ({completedOrders.length})
          </h2>

          <div className="grid gap-4">
            {completedOrders
              .slice(startCompletedOrder, endCompletedOrder)
              .map((order) => (
                <OrderCard key={order._id} order={order} />
              ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Orders;
