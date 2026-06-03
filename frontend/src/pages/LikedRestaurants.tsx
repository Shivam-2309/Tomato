import { useEffect, useState } from "react";
import type { IRestaurant } from "../types";
import axios from "axios";
import { restaurantService } from "../main";
import { useAppData } from "../context/AppProvider";
import { useNavigate } from "react-router-dom";

const LikedRestaurants = () => {
  const [restaurants, setRestaurants] = useState<IRestaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { user } = useAppData();

  if (!user) {
    return <div>No User found</div>;
  }

  console.log(user);

  const getRestaurants = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const response = await axios.get(
        `${restaurantService}/api/restaurant/likedRestaurant`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      console.log("response: ", response);

      setRestaurants(response.data.restaurants || []);
    } catch (err) {
      console.log("error is: ", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getRestaurants();
  }, []);
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">❤️ Liked Restaurants</h1>
          <p className="text-gray-500 mt-1">
            Restaurants you've saved for later
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div
                key={idx}
                className="h-32 bg-white rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : restaurants.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="text-5xl mb-4">💔</div>
            <h2 className="text-xl font-semibold">No liked restaurants yet</h2>
            <p className="text-gray-500 mt-2">
              Start exploring and save your favourites.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {restaurants.map((restaurant) => (
              <div
                key={restaurant._id}
                onClick={() => navigate(`/restaurant/${restaurant._id}`)}
                className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer p-4"
              >
                <div className="flex gap-5">
                  <img
                    src={restaurant.image}
                    alt={restaurant.name}
                    className="w-28 h-28 rounded-xl object-cover shrink"
                  />

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h2 className="text-xl font-semibold">
                          {restaurant.name}
                        </h2>

                        <div className="text-red-500 font-medium">
                          ❤️ {restaurant.likesCount}
                        </div>
                      </div>

                      {restaurant.description && (
                        <p className="text-gray-600 mt-2 line-clamp-2">
                          {restaurant.description}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-between items-center mt-4">
                      <div>
                        <p className="text-sm text-gray-500">
                          📍 {restaurant.autoLocation.formattedAddress}
                        </p>

                        <p className="text-sm text-gray-500 mt-1">
                          📞 {restaurant.phone}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <span
                          className={`text-sm font-medium ${
                            restaurant.isOpen
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {restaurant.isOpen ? "🟢 Open" : "🔴 Closed"}
                        </span>

                        <span className="text-xl text-gray-400">→</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LikedRestaurants;
