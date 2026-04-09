import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { IRestaurant, IMenuItem } from "../types";
import axios from "axios";
import { restaurantService } from "../main";
import RestaurantProfile from "../components/RestaurantProfile";
import MenuItems from "../components/MenuItems";

const RestaurantPage = () => {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState<IRestaurant | null>(null);
  const [menuItems, setMenuItems] = useState<IMenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMenuItems = async () => {
    try {
      const { data } = await axios.get(
        `${restaurantService}/api/item/all/${id}`,
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

  const fetchRestaurant = async () => {
    try {
      const { data } = await axios.get(
        `${restaurantService}/api/restaurant/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      setRestaurant(data || null);
    } catch (err) {
      console.log("Error: ", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      console.log("Rehit on this");
      fetchMenuItems();
      fetchRestaurant();
    }
  }, [id]);

  if (loading)
    return (
      <div className="flex min-h-screen justify-center items-center">
        <p className="text-gray-500">Loading Restaurant...</p>
      </div>
    );
  if (!restaurant)
    return (
      <div className="flex min-h-screen justify-center items-center">
        <p className="text-gray-500">No Restaurant with this id</p>
      </div>
    );
  return (
    <div className="min-h-screen bg-gray px-4 py-6 space-y-6">
      <RestaurantProfile
        restaurant={restaurant}
        onUpdate={setRestaurant}
        isSeller={false}
      />

      <div className="rounded-xl bg-white shadow-sm p-4">
        <MenuItems
          isSeller={false}
          items={menuItems}
          onItemDeleted={() => {}}
        />
      </div>
    </div>
  );
};

export default RestaurantPage;
