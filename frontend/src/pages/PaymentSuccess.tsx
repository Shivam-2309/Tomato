import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppData } from "../context/AppProvider";

const PaymentSuccess = () => {
  const { paymentId } = useParams<{ paymentId: string }>();
  const navigate = useNavigate();
  const { fetchCart } = useAppData();

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-green-100 bg-white p-8 shadow-lg text-center">
        {/* Success Icon */}
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <span className="text-4xl">✅</span>
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-gray-900">Payment Successful</h1>

        <p className="mt-2 text-gray-500">
          Your order has been placed successfully and is now being processed.
        </p>

        {/* Payment ID */}
        {paymentId && (
          <div className="mt-6 rounded-xl bg-gray-50 p-4 border border-gray-100">
            <p className="text-xs uppercase tracking-wide text-gray-400">
              Payment ID
            </p>
            <p className="mt-1 break-all font-mono text-sm text-gray-700">
              {paymentId}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={() => navigate("/")}
            className="w-full rounded-xl bg-red-500 py-3 font-semibold text-white transition hover:bg-red-600"
          >
            Order More
          </button>

          <button
            onClick={() => navigate("/orders")}
            className="w-full rounded-xl border border-gray-200 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            View Orders
          </button>
        </div>

        <p className="mt-4 text-xs text-gray-400">
          Thank you for ordering with us ❤️
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccess;
