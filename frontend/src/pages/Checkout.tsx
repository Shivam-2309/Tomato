import { useAppData } from "../context/AppProvider";
import { useState, useEffect } from "react";
import axios from "axios";
import { restaurantService, utilsService } from "../main";
import { useNavigate } from "react-router-dom";
import type { ICart, IMenuItem, IRestaurant } from "../types";
import toast from "react-hot-toast";

interface Address {
  _id: string;
  formattedAddress: string;
  mobile: number;
}

// Mirrors the ICart mongoose schema.
// userId stays as a raw ObjectId string (we never display it).
// restaurantId and itemId are populated refs — their types reflect
// the actual document shape returned after .populate()
const PLATFORM_FEE_RATE = 0.08;
const DELIVERY_FEE = 30;
const FREE_DELIVERY_THRESHOLD = 149;

export const Checkout = () => {
  const { cart, subTotal, quantity } = useAppData();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [loadingAddress, setLoadingAddress] = useState(true);
  const [loadingRazorpay, setLoadingRazorpay] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAddresses = async () => {
      if (!cart || cart.length === 0) {
        setLoadingAddress(false);
        return;
      }
      try {
        const { data } = await axios.get(
          `${restaurantService}/api/address/all`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );
        const list: Address[] = data || [];
        setAddresses(list);
        if (list.length > 0) setSelectedAddressId(list[0]._id);
      } catch (err) {
        console.error("Error fetching addresses:", err);
        toast.error("Could not load addresses");
      } finally {
        setLoadingAddress(false);
      }
    };
    fetchAddresses();
  }, [cart]);

  if (!cart || cart.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <span className="text-5xl">🛒</span>
        <p className="text-lg font-medium text-gray-500">Your cart is empty</p>
      </div>
    );
  }

  const restaurant = cart[0].restaurantId as IRestaurant;

  const platformFee = subTotal * PLATFORM_FEE_RATE;
  const deliveryFee = subTotal > FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const grandTotal = subTotal + platformFee + deliveryFee;

  const createOrder = async (paymentMethod: "razorpay") => {
    if (!selectedAddressId) {
      toast.error("Please select a delivery address");
      return null;
    }
    setCreatingOrder(true);
    try {
      const { data } = await axios.post(
        `${restaurantService}/api/order/new`,
        { paymentMethod, addressId: selectedAddressId },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      return data;
    } catch (err) {
      toast.error("Failed to create order");
      return null;
    } finally {
      setCreatingOrder(false);
    }
  };

  const payWithRazorpay = async () => {
    if (!selectedAddressId) {
      toast.error("Please select a delivery address");
      return;
    }
    try {
      setLoadingRazorpay(true);
      const order = await createOrder("razorpay");
      if (!order) return;

      const { orderId, amount } = order;
      const { data } = await axios.post(`${utilsService}/api/payment/create`, {
        orderId,
      });
      const { razorpayOrderId, key } = data;

      const options = {
        key,
        amount: amount * 100,
        currency: "INR",
        name: "Tomato",
        description: "Food Order Delivery",
        order_id: razorpayOrderId,
        handler: async (response: any) => {
          try {
            await axios.post(`${utilsService}/api/payment/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId,
            });
            toast.success("Payment successful 🎉");
            navigate("/paymentsuccess/" + response.razorpay_payment_id);
          } catch {
            toast.error("Payment verification failed");
          }
        },
        theme: { color: "#E23744" },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error(err);
      toast.error("Payment failed. Please refresh and try again.");
    } finally {
      setLoadingRazorpay(false);
    }
  };

  const isLoading = loadingRazorpay || creatingOrder;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Address + Cart Items */}
        <div className="lg:col-span-2 space-y-5">
          {/* Restaurant Info */}
          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-4 flex items-center gap-3">
            <div className="bg-red-50 rounded-xl p-2">
              <span className="text-2xl">🍽️</span>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">
                Ordering from
              </p>
              <h2 className="text-base font-semibold text-gray-900">
                {restaurant.name}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                {restaurant.autoLocation?.formattedAddress}
              </p>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <span className="text-red-500">📍</span> Delivery Address
              </h3>
            </div>

            {loadingAddress ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-16 rounded-xl bg-gray-100 animate-pulse"
                  />
                ))}
              </div>
            ) : addresses.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm">
                <p className="text-3xl mb-2">🏠</p>
                <p>No saved addresses. Please add one in your profile.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map((addr) => {
                  const isSelected = selectedAddressId === addr._id;
                  return (
                    <label
                      key={addr._id}
                      htmlFor={`addr-${addr._id}`}
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-150 ${
                        isSelected
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 bg-gray-50 hover:border-gray-300"
                      }`}
                    >
                      <input
                        id={`addr-${addr._id}`}
                        type="radio"
                        name="delivery-address"
                        value={addr._id}
                        checked={isSelected}
                        onChange={() => setSelectedAddressId(addr._id)}
                        className="mt-1 accent-red-500 w-4 h-4 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 leading-snug">
                          {addr.formattedAddress}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          📞 +91 {addr.mobile}
                        </p>
                      </div>
                      {isSelected && (
                        <span className="text-xs font-medium text-red-500 shrink-0 mt-0.5">
                          ✓ Selected
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cart Items */}
          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-red-500">🛒</span> Order Items
              <span className="ml-auto text-xs font-normal text-gray-400">
                {quantity} item{quantity !== 1 ? "s" : ""}
              </span>
            </h3>

            <div className="divide-y divide-gray-100">
              {cart.map((cartItem: ICart) => {
                const item = cartItem.itemId as IMenuItem;
                return (
                  <div
                    key={item._id}
                    className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    {/* Item image or fallback */}
                    <div className="w-12 h-12 rounded-lg bg-orange-50 shrink-0 overflow-hidden">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">
                          🍱
                        </div>
                      )}
                    </div>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {item?.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        ₹{item.price} x {cartItem.quantity}
                      </p>
                    </div>

                    {/* Line total */}
                    <p className="text-sm font-semibold text-gray-900 shrink-0">
                      ₹{(item.price * cartItem.quantity).toFixed(2)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column: Bill Summary + Pay Button */}
        <div className="space-y-5">
          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 space-y-4 sticky top-6">
            <h3 className="font-semibold text-gray-900">Bill Summary</h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Item total</span>
                <span>₹{subTotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-gray-600">
                <span>Delivery fee</span>
                {deliveryFee === 0 ? (
                  <span className="text-green-600 font-medium">FREE</span>
                ) : (
                  <span>₹{deliveryFee.toFixed(2)}</span>
                )}
              </div>

              <div className="flex justify-between text-gray-600">
                <span>
                  Platform fee{" "}
                  <span className="text-xs text-gray-400">(8%)</span>
                </span>
                <span>₹{platformFee.toFixed(2)}</span>
              </div>

              {deliveryFee > 0 && (
                <p className="text-xs text-green-600 bg-green-50 rounded-lg px-3 py-1.5">
                  Add ₹{(FREE_DELIVERY_THRESHOLD - subTotal + 0.01).toFixed(0)}{" "}
                  more for free delivery
                </p>
              )}

              <div className="border-t border-dashed border-gray-200 pt-3 mt-3 flex justify-between font-bold text-gray-900 text-base">
                <span>Grand Total</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Pay button */}
            <button
              onClick={payWithRazorpay}
              disabled={
                isLoading ||
                loadingAddress ||
                addresses.length === 0 ||
                !selectedAddressId
              }
              className={`w-full py-3.5 rounded-xl font-semibold text-white text-sm transition-all duration-200 flex items-center justify-center gap-2
                ${
                  isLoading ||
                  loadingAddress ||
                  addresses.length === 0 ||
                  !selectedAddressId
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-red-500 hover:bg-red-600 active:scale-95 shadow-md hover:shadow-red-200"
                }`}
            >
              {creatingOrder ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating order...
                </>
              ) : loadingRazorpay ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Opening Razorpay...
                </>
              ) : (
                <>
                  <span>💳</span>
                  Pay ₹{grandTotal.toFixed(2)}
                </>
              )}
            </button>

            <p className="text-center text-xs text-gray-400">
              Secured by Razorpay
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
