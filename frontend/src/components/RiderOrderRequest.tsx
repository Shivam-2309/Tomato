import { useState, useEffect } from "react";
import { riderService } from "../main";
import axios from "axios";
import { toast } from "react-hot-toast";

interface Props {
  orderId: string;
  onAccepted: () => void;
}

const RiderOrderRequest = ({ orderId, onAccepted }: Props) => {
  const [accepting, setAccepting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(10);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onAccepted();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onAccepted]);

  const acceptOrder = async () => {
    setAccepting(true);
    try {
      await axios.post(
        `${riderService}/api/rider/accept/${orderId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      toast.success("Order accepted successfully!");
      onAccepted();
    } catch (error: any) {
      console.error(
        "Failed to accept order:",
        error.response?.data || error.message || error,
      );
      toast.error("Failed to accept order.");
      onAccepted();
    } finally {
      setAccepting(false);
    }
  };
  return (
    <div className="bg-white p-6 rounded shadow-md text-center">
      <h2 className="text-lg font-semibold mb-4">New Order Request</h2>
      <p className="mb-4">
        You have a new order request. Please accept it within {secondsLeft}{" "}
        seconds.
      </p>
      <p className="text-sm text-gray-500 m-2">
        OrderId: {orderId.slice(0, -6)}
      </p>
      <button
        onClick={acceptOrder}
        disabled={accepting}
        className={`px-4 py-2 rounded ${accepting ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600 text-white"}`}
      >
        {accepting ? "Accepting..." : "Accept Order"}
      </button>
    </div>
  );
};

export default RiderOrderRequest;
