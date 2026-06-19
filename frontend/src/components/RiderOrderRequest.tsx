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

  const circumference = 2 * Math.PI * 20;
  const dashOffset = circumference * (1 - secondsLeft / 10);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-lg p-5">
      {/* Pulsing urgency bar */}
      <div
        className="absolute top-0 left-0 h-1 bg-[#e23744] transition-all duration-1000 ease-linear"
        style={{ width: `${(secondsLeft / 10) * 100}%` }}
      />

      <div className="flex items-start gap-4">
        {/* Countdown ring */}
        <div className="relative flex-shrink-0 flex items-center justify-center w-14 h-14">
          <svg
            className="absolute inset-0 w-14 h-14 -rotate-90"
            viewBox="0 0 48 48"
          >
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke="#fee2e2"
              strokeWidth="4"
            />
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke="#e23744"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <span className="text-lg font-bold text-[#e23744] z-10">
            {secondsLeft}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-block w-2 h-2 rounded-full bg-[#e23744] animate-pulse" />
            <p className="text-sm font-bold text-gray-900 uppercase tracking-wide">
              New Order
            </p>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Accept before the timer runs out
          </p>
          <p className="text-xs font-mono text-gray-400 bg-gray-50 rounded-lg px-2 py-1 inline-block">
            ID: #{orderId.slice(-6).toUpperCase()}
          </p>
        </div>
      </div>

      <button
        onClick={acceptOrder}
        disabled={accepting}
        className={`mt-4 w-full py-3 rounded-xl text-sm font-bold tracking-wide transition-all active:scale-95 ${
          accepting
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-[#e23744] hover:bg-[#cc2f3c] text-white shadow-sm shadow-red-200"
        }`}
      >
        {accepting ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z"
              />
            </svg>
            Accepting…
          </span>
        ) : (
          "Accept Order"
        )}
      </button>
    </div>
  );
};

export default RiderOrderRequest;
