import axios from "axios";
import toast from "react-hot-toast";
import { useState } from "react";
import { restaurantService } from "../main";
import { useAppData } from "../context/AppProvider";
import type { IMenuItem, IRestaurant } from "../types";
import { useNavigate } from "react-router-dom";
import { TbTrash } from "react-icons/tb";

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem("token")}` };
}

export default function Cart() {
  const { cart, fetchCart, subTotal, quantity } = useAppData();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const navigate = useNavigate();
  const PLATFORM_FEE_RATE = 0.08;
  const DELIVERY_FEE = 30;

  const platformFee = subTotal * PLATFORM_FEE_RATE;
  const deliveryFee = subTotal > 149 ? 0 : DELIVERY_FEE;
  const total = subTotal + platformFee + deliveryFee;

  if (!cart || cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <svg
          className="w-16 h-16 mb-4 opacity-40"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6h11M10 19a1 1 0 11-2 0 1 1 0 012 0zm8 0a1 1 0 11-2 0 1 1 0 012 0z"
          />
        </svg>
        <p className="text-lg font-medium">Your cart is empty</p>
        <p className="text-sm mt-1">
          Add items from a restaurant to get started
        </p>
      </div>
    );
  }

  const restaurant = cart[0].restaurantId as IRestaurant;

  async function handleIncrement(item: IMenuItem) {
    const key = `inc-${item._id}`;
    setLoadingId(key);
    try {
      await axios.post(
        `${restaurantService}/api/cart/inc`,
        { restaurantId: item.restaurantId, itemId: item._id },
        { headers: authHeaders() },
      );
      await fetchCart();
    } catch {
      toast.error("Failed to update item");
    } finally {
      setLoadingId(null);
    }
  }

  async function handleDecrement(item: IMenuItem) {
    const key = `dec-${item._id}`;
    setLoadingId(key);
    try {
      await axios.post(
        `${restaurantService}/api/cart/dec`,
        { restaurantId: item.restaurantId, itemId: item._id },
        { headers: authHeaders() },
      );
      await fetchCart();
    } catch {
      toast.error("Failed to update item");
    } finally {
      setLoadingId(null);
    }
  }

  async function handleClearCart() {
    setLoadingId("clear");
    try {
      await axios.delete(`${restaurantService}/api/cart/clear`, {
        headers: authHeaders(),
      });
      await fetchCart();
      toast.success("Cart cleared");
    } catch {
      toast.error("Failed to clear cart");
    } finally {
      setLoadingId(null);
    }
  }

  const checkout = () => {
    navigate("/checkout");
  };

  return (
    <div className="flex flex-col gap-4 p-4 max-w-lg mx-auto">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Your Cart
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({quantity} {quantity === 1 ? "item" : "items"})
            </span>
          </h2>
        </div>
        <p className="text-sm text-gray-500">
          You are ordering from {restaurant?.name ?? "Restaurant"}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {cart.map((cartItem) => {
          const isIncLoading = loadingId === `inc-${cartItem.itemId}`;
          const isDecLoading = loadingId === `dec-${cartItem.itemId}`;

          const item = cartItem.itemId as IMenuItem;
          return (
            <div
              key={item._id}
              className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl p-3 shadow-sm"
            >
              {item?.image ? (
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <svg
                    className="w-6 h-6 text-gray-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {item?.name ?? "Unknown Item"}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  ₹{item?.price ?? 0} each
                </p>
                {item && !item.isAvailable && (
                  <span className="text-xs text-red-500 font-medium">
                    Currently unavailable
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleDecrement(item)}
                  disabled={isDecLoading || isIncLoading}
                  className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  {isDecLoading ? (
                    <Spinner size={12} />
                  ) : (
                    <span className="text-lg leading-none">−</span>
                  )}
                </button>

                <span className="w-6 text-center font-semibold text-gray-900 tabular-nums">
                  {cartItem.quantity}
                </span>

                <button
                  onClick={() => handleIncrement(item)}
                  disabled={isIncLoading || isDecLoading}
                  className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  {isIncLoading ? (
                    <Spinner size={12} />
                  ) : (
                    <span className="text-lg leading-none">+</span>
                  )}
                </button>
              </div>

              <p className="text-sm font-semibold text-gray-900 w-16 text-right shrink-0">
                ₹{((item?.price ?? 0) * cartItem.quantity).toFixed(0)}
              </p>
            </div>
          );
        })}
      </div>

      <div className="border-t border-gray-100 pt-4 mt-1 flex flex-col gap-2">
        <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-3">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Order summary
          </p>

          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-medium text-gray-900">
              ₹{subTotal.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500 flex items-center gap-1.5">
              Platform fee
              <span className="text-xs bg-white border border-gray-200 text-gray-400 px-1.5 py-0.5 rounded">
                8%
              </span>
            </span>
            <span className="font-medium text-gray-900">
              ₹{platformFee.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500 flex items-center gap-1.5">
              Delivery fee
              {deliveryFee === 0 && (
                <span className="text-xs bg-green-50 border border-green-100 text-green-600 px-1.5 py-0.5 rounded">
                  Free
                </span>
              )}
            </span>
            {deliveryFee === 0 ? (
              <span className="font-medium text-gray-400 line-through text-xs">
                ₹{DELIVERY_FEE}
              </span>
            ) : (
              <span className="font-medium text-gray-900">
                ₹{deliveryFee.toFixed(2)}
              </span>
            )}
          </div>

          <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
            <span className="font-semibold text-gray-900">Total</span>
            <span className="font-semibold text-gray-900">
              ₹{total.toFixed(2)}
            </span>
          </div>
        </div>

        {deliveryFee > 0 && (
          <p className="text-xs text-center text-gray-400">
            Add ₹{(149 - subTotal + 0.01).toFixed(0)} more for free delivery
          </p>
        )}

        <button
          className={`w-full mt-1 bg-[#E23744] hover:bg-red-600 active:scale-[0.98] text-white font-semibold py-3 rounded-xl transition-all ${!restaurant.isOpen ? "opacity-50" : ""}`}
          onClick={checkout}
          disabled={!restaurant.isOpen}
        >
          {!restaurant.isOpen
            ? "Restaurant is currently not accepting orders"
            : `Proceed to Checkout · ₹${total.toFixed(2)}`}
        </button>
        <button
          className="w-full mt-2 bg-[#7b7979] hover:bg-gray-600 active:scale-[0.98] text-white font-semibold py-3 rounded-xl transition-all flex justify-center items-center"
          onClick={handleClearCart}
        >
          Clear Cart
          <TbTrash size={18} />
        </button>
      </div>
    </div>
  );
}

function Spinner({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      className="animate-spin"
    >
      <circle cx="12" cy="12" r="10" strokeOpacity={0.25} />
      <path d="M12 2a10 10 0 0110 10" />
    </svg>
  );
}
