import { useSocket } from "../context/SocketContext";
import type { IOrder } from "../types";
import { useState, useRef, useEffect } from "react";
import audio from "../assets/SOUND1.mp3";
import axios from "axios";
import { restaurantService } from "../main";
import OrderCard from "../components/OrderCard";

const ACTIVE_STATUSES = [
  "placed",
  "accepted",
  "preparing",
  "ready_for_rider",
  "rider_assigned",
  "picked_up",
];

const RestaurantOrders = ({ restaurantId }: { restaurantId: string }) => {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  const { socket } = useSocket();

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio(audio);
    audioRef.current.load();
  }, []);

  const unlockAudio = async () => {
    if (!audioRef.current) return;

    try {
      await audioRef.current.play();

      audioRef.current.pause();
      audioRef.current.currentTime = 0;

      setAudioUnlocked(true);

      console.log("Audio unlocked");
    } catch (err) {
      console.log("Unable to unlock audio", err);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data } = await axios.get(
        `${restaurantService}/api/order/${restaurantId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      setOrders(data.orders || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [restaurantId]);

  useEffect(() => {
    if (!socket) return;

    const onNewOrder = () => {
      console.log("New order received");

      if (audioUnlocked && audioRef.current) {
        audioRef.current.currentTime = 0;

        audioRef.current.play().catch((err) => {
          console.log("Audio play failed", err);
        });
      }

      fetchOrders();
    };

    socket.on("order:new", onNewOrder);

    return () => {
      socket.off("order:new", onNewOrder);
    };
  }, [socket, audioUnlocked]);

  const activeOrders = orders.filter((order) =>
    ACTIVE_STATUSES.includes(order.status),
  );

  const completedOrders = orders.filter(
    (order) => !ACTIVE_STATUSES.includes(order.status),
  );

  if (loading) {
    return <div className="flex justify-center py-10">Loading orders...</div>;
  }

  return (
    <div className="space-y-8 p-4">
      {!audioUnlocked && (
        <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="font-semibold text-yellow-800">
                Enable Order Notifications
              </h3>

              <p className="text-sm text-yellow-700">
                Click once to enable notification sounds for new orders.
              </p>
            </div>

            <button
              onClick={unlockAudio}
              className="rounded-lg bg-yellow-500 px-4 py-2 text-white transition hover:bg-yellow-600"
            >
              Enable Sound
            </button>
          </div>
        </div>
      )}

      {audioUnlocked && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-green-700">
          🔊 Notification sound enabled
        </div>
      )}

      {/* ACTIVE ORDERS */}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-green-700">Active Orders</h2>

          <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
            {activeOrders.length}
          </span>
        </div>

        {activeOrders.length === 0 ? (
          <div className="rounded-xl border bg-white p-6 text-center text-gray-500">
            No active orders
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {activeOrders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                onStatusUpdate={fetchOrders}
              />
            ))}
          </div>
        )}
      </section>

      {/* COMPLETED ORDERS */}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-700">Completed Orders</h2>

          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700">
            {completedOrders.length}
          </span>
        </div>

        {completedOrders.length === 0 ? (
          <div className="rounded-xl border bg-white p-6 text-center text-gray-500">
            No completed orders
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {completedOrders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                onStatusUpdate={fetchOrders}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default RestaurantOrders;
