import { useState, useEffect } from "react";
import type { IMenuItem, IRestaurant } from "../types";
import axios from "axios";
import { restaurantService } from "../main";
import AddRestaurant from "../components/AddRestaurant";
import RestaurantProfile from "../components/RestaurantProfile";
import MenuItems from "../components/MenuItems";
import AddMenuItem from "../components/AddMenuItem";
import toast from "react-hot-toast";
import { useAppData } from "../context/AppProvider";

type SellerTab = "menu" | "add-item" | "sales";

const Restaurant = () => {
  const [restaurant, setRestaurant] = useState<IRestaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<SellerTab>("menu");
  const [menuItems, setMenuItems] = useState<IMenuItem[]>([]);

  const fetchMyRestaurant = async () => {
    try {
      const { data } = await axios.get(
        `${restaurantService}/api/restaurant/my`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      setRestaurant(data.restaurant || null);

      if (data.token) {
        localStorage.setItem("token", data.token);
        window.location.reload();
      }
    } catch (err) {
      console.log("The error is : ", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuItems = async (restaurantId: string) => {
    try {
      const { data } = await axios.get(
        `${restaurantService}/api/item/all/${restaurantId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      setMenuItems(data);
    } catch (err) {
      console.log("Error is : ", err);
    }
  };
  useEffect(() => {
    fetchMyRestaurant();
  }, []);

  useEffect(() => {
    if (restaurant?._id) fetchMenuItems(restaurant._id);
  }, [restaurant]);

  if (loading)
    return (
      <div className="flex min-h-screen justify-center items-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );

  if (!restaurant) {
    return <AddRestaurant fetchMyRestaurant={fetchMyRestaurant} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 space-y-6">
      <RestaurantProfile
        restaurant={restaurant}
        isSeller={true}
        onUpdate={setRestaurant}
      />
      <div className="rounded-xl bg-white shadow-sm">
        <div className="flex border-b border-gray-200">
          {[
            { key: "menu", label: "Menu items" },
            { key: "add-item", label: "Add items" },
            { key: "sales", label: "Sales" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key as SellerTab);
              }}
              className={`
                flex-1 py-4 px-6 text-center font-medium text-sm transition-all duration-200 border-b-2
                ${
                  t.key === tab
                    ? "text-[#e23744] border-[#e23744] bg-red-50/50 shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent"
                }
              `}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex justify-center p-5">
          {tab === "add-item" && (
            <AddMenuItem onItemsAdded={() => fetchMenuItems(restaurant._id)} />
          )}
          {tab === "menu" && (
            <MenuItems
              items={menuItems}
              onItemDeleted={() => fetchMenuItems(restaurant._id)}
              isSeller={true}
            />
          )}
          {tab === "sales" && <p>Sales Page</p>}
        </div>
      </div>
    </div>
  );
};

export default Restaurant;
