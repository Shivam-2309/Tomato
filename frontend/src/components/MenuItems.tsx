import { useState } from "react";
import type { IMenuItem } from "../types";
import { FiEyeOff } from "react-icons/fi";
import { BsEye } from "react-icons/bs";
import axios from "axios";
import { restaurantService } from "../main";
import toast from "react-hot-toast";

interface MenuItemsProps {
  items: IMenuItem[];
  onItemDeleted: () => void;
  isSeller: boolean;
}

const MenuItems = ({ items, onItemDeleted, isSeller }: MenuItemsProps) => {
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
  const handleToggleAvailability = async (itemId: string) => {
    try {
      setLoadingItemId(itemId);

      const { data } = await axios.put(
        `${restaurantService}/api/item/status/${itemId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      toast.success(data.message);
      onItemDeleted();
    } catch (err) {
      console.error(err);
      toast.error("Unable to update status");
    } finally {
      setLoadingItemId(null);
    }
  };

  const handleDelete = async (id: string) => {
    const confirm = window.confirm(
      "Are you sure you want to delete this item ?",
    );
    if (!confirm) return;
    try {
      setLoadingItemId(id);

      const result = await axios.delete(`${restaurantService}/api/item/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      toast.success("Item has been deleted successfully");
      onItemDeleted();
    } catch (err) {
      console.error(err);
      toast.error("Unable to delete the item");
    } finally {
      setLoadingItemId(null);
    }
  };

  return (
    <div className="grid grid-col-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => {
        const isLoading = loadingItemId === item._id;

        return (
          <div
            key={item._id}
            className={`relative flex gap-4 rounded-lg bg-white p-4 shadow-sm transition ${
              !item.isAvailable ? "opacity-70" : ""
            }`}
          >
            <div className="relative shrink-0">
              <img
                src={item.image}
                alt={item.name}
                className={`h-20 w-20 rounded object-cover ${
                  !item.isAvailable ? "grayscale brightness-75" : ""
                }`}
              />

              {!item.isAvailable && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-xs font-semibold text-white">
                  Not Available
                </span>
              )}
            </div>

            <div className="flex flex-1 flex-col justify-between">
              <div>
                <h3 className="font-semibold">{item.name}</h3>
                {item.description && (
                  <p className="text-sm text-gray-600">{item.description}</p>
                )}
              </div>

              <div>
                <p className="font-medium">₹ {item.price}</p>

                {isSeller && (
                  <div className="mt-2 flex gap-2">
                    <button
                      disabled={isLoading}
                      onClick={() => handleToggleAvailability(item._id)}
                      className="p-1 border rounded"
                    >
                      {item.isAvailable ? (
                        <BsEye size={18} />
                      ) : (
                        <FiEyeOff size={18} />
                      )}
                    </button>

                    <button
                      disabled={isLoading}
                      onClick={() => handleDelete(item._id)}
                      className="p-1 border rounded text-red-500"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>

            {isLoading && (
              <div className="absolute inset-0 bg-white/60 flex items-center justify-center text-sm">
                Processing...
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MenuItems;
