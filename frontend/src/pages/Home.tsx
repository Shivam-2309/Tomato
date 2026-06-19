import { useSearchParams, useNavigate } from "react-router-dom";
import { useAppData } from "../context/AppProvider";
import { useState, useEffect } from "react";
import type { IRestaurant } from "../types";
import axios from "axios";
import { restaurantService } from "../main";

const Home = () => {
  const { location } = useAppData();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const search = searchParams.get("search") || "";
  const [restaurants, setRestaurants] = useState<IRestaurant[]>([]);
  const [loading, setLoading] = useState(true);

  const handleLike = async (e: React.MouseEvent, restaurantId: string) => {
    e.stopPropagation();

    try {
      const { data } = await axios.post(
        `${restaurantService}/api/restaurant/${restaurantId}/like`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      console.log("Data: ", data);

      setRestaurants((prev) =>
        prev.map((r) =>
          String(r._id) === String(restaurantId)
            ? {
                ...r,
                likesCount:
                  data.likesCount ??
                  data.restaurant?.likesCount ??
                  r.likesCount + 1,
              }
            : r,
        ),
      );
    } catch (err) {
      console.log("Like error:", err);
    }
  };
  const getDistanceKm = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number => {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const fetchRestaurants = async () => {
    if (!location?.latitude || !location.longitude) {
      return;
    }
    try {
      setLoading(true);
      const { data } = await axios.get(
        `${restaurantService}/api/restaurant/all`,
        {
          params: {
            latitude: location.latitude,
            longitude: location.longitude,
            search: search,
          },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      setRestaurants(data.restaurants ?? []);
    } catch (err) {
      console.log("Error : ", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, [location, search]);

  const skeletonCards = Array.from({ length: 5 });

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "white" }}>
      <div
        style={{
          backgroundColor: "#c0392b",
          padding: "24px 32px",
          color: "#fff",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 500 }}>
          {search ? `Results for "${search}"` : "Restaurants near you"}
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: "14px", opacity: 0.85 }}>
          {loading
            ? "Finding restaurants..."
            : `${restaurants.length} restaurant${restaurants.length !== 1 ? "s" : ""} found`}
        </p>
      </div>

      <div style={{ padding: "24px 32px" }}>
        {loading && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "20px",
            }}
          >
            {skeletonCards.map((_, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: "#fff",
                  borderRadius: "12px",
                  border: "1px solid #fcd5d5",
                  overflow: "hidden",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              >
                <div style={{ height: "160px", backgroundColor: "#fce8e8" }} />
                <div style={{ padding: "16px" }}>
                  <div
                    style={{
                      height: "14px",
                      backgroundColor: "#fce8e8",
                      borderRadius: "6px",
                      marginBottom: "10px",
                      width: "70%",
                    }}
                  />
                  <div
                    style={{
                      height: "12px",
                      backgroundColor: "#fce8e8",
                      borderRadius: "6px",
                      width: "50%",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && restaurants.length === 0 && (
          <div
            style={{ textAlign: "center", padding: "80px 20px", color: "#888" }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🍽️</div>
            <h2
              style={{
                fontSize: "18px",
                fontWeight: 500,
                color: "#c0392b",
                margin: "0 0 8px",
              }}
            >
              No restaurants found
            </h2>
            <p style={{ fontSize: "14px", margin: 0 }}>
              Try a different search or check your location.
            </p>
          </div>
        )}

        {!loading && restaurants.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "20px",
            }}
          >
            {restaurants.map((restaurant) => {
              const [lng, lat] = restaurant.autoLocation?.coordinates ?? [];
              const distance =
                location?.latitude && location?.longitude && lat && lng
                  ? getDistanceKm(
                      location.latitude,
                      location.longitude,
                      lat,
                      lng,
                    ).toFixed(1)
                  : null;

              return (
                <div
                  key={String(restaurant._id)}
                  onClick={() => navigate(`/restaurant/${restaurant._id}`)}
                  className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 flex flex-col h-full"
                >
                  {/* Image Container */}
                  <div className="relative h-44 w-full overflow-hidden bg-gray-100">
                    {restaurant.image ? (
                      <img
                        src={restaurant.image}
                        alt={restaurant.name}
                        className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                          !restaurant.isOpen && "grayscale opacity-60"
                        }`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl bg-rose-50">
                        🍴
                      </div>
                    )}

                    {/* Top Badges Overlay */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      {restaurant.isVerified && (
                        <span className="bg-white/90 backdrop-blur-sm text-orange-600 text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-md shadow-sm">
                          ✓ Verified
                        </span>
                      )}
                    </div>

                    {/* Like Button - Positioned Top Right for a "clean" feel */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card click
                        handleLike(e, String(restaurant._id));
                      }}
                      className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-md rounded-full shadow-md hover:bg-white transition-colors group/like"
                    >
                      <div className="flex items-center gap-1">
                        <span className="text-red-500 group-active/like:scale-125 transition-transform">
                          ❤️
                        </span>
                        <span className="text-xs font-bold text-gray-700">
                          {restaurant.likesCount ?? 0}
                        </span>
                      </div>
                    </button>

                    {/* Open/Closed Overlay for Closed Restaurants */}
                    {!restaurant.isOpen && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="bg-white px-4 py-1 rounded-full text-sm text-gray-900 shadow-lg">
                          Closed
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info Section */}
                  <div className="p-4 flex flex-col grow">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-md font-bold text-gray-900 truncate pr-2">
                        {restaurant.name}
                      </h3>
                      {distance && (
                        <span className="shrink-0 text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg">
                          {distance} km
                        </span>
                      )}
                    </div>

                    {restaurant.description && (
                      <p className="text-sm text-gray-500 line-clamp-1 mb-2">
                        {restaurant.description}
                      </p>
                    )}

                    {restaurant.autoLocation?.formattedAddress && (
                      <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
                        <span className="truncate shrink">
                          📍 {restaurant.autoLocation.formattedAddress}
                        </span>
                      </div>
                    )}

                    {/* Card Footer */}
                    <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between text-xs font-medium text-gray-600">
                      <span className="flex items-center gap-1">
                        <span className="text-gray-400">📞</span>{" "}
                        {restaurant.phone}
                      </span>

                      {restaurant.isOpen && (
                        <span className="flex items-center gap-1 text-green-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          Open Now
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default Home;
