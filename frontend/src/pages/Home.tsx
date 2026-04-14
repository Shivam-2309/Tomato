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
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: "12px",
                    border: "6px solid #fcd5d5",
                    overflow: "hidden",
                    cursor: "pointer",
                    transition: "transform 0.15s ease, box-shadow 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform =
                      "translateY(-3px)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow =
                      "0 6px 20px rgba(192,57,43,0.12)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform =
                      "translateY(0)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow =
                      "none";
                  }}
                >
                  <div
                    style={{
                      height: "160px",
                      backgroundColor: "#fce8e8",
                      overflow: "hidden",
                      position: "relative",
                    }}
                    className={`${restaurant.isOpen ? "" : "opacity-25"}`}
                  >
                    {restaurant.image ? (
                      <img
                        src={restaurant.image}
                        alt={restaurant.name}
                        className={`w-100 h-100`}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "36px",
                        }}
                      >
                        🍴
                      </div>
                    )}

                    {/* Open / Closed badge */}
                    <span
                      style={{
                        position: "absolute",
                        top: "10px",
                        right: "10px",
                        fontSize: "11px",
                        fontWeight: 500,
                        padding: "3px 10px",
                        borderRadius: "20px",
                        backgroundColor: restaurant.isOpen
                          ? "#e8f8ef"
                          : "#fce8e8",
                        color: restaurant.isOpen ? "#1e7e45" : "#c0392b",
                      }}
                    >
                      {restaurant.isOpen ? "Open" : "Closed"}
                    </span>

                    {/* Verified badge */}
                    {restaurant.isVerified && (
                      <span
                        style={{
                          position: "absolute",
                          top: "10px",
                          left: "10px",
                          fontSize: "11px",
                          fontWeight: 500,
                          padding: "3px 10px",
                          borderRadius: "20px",
                          backgroundColor: "#fff3e0",
                          color: "#e65100",
                        }}
                      >
                        ✓ Verified
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ padding: "14px 16px 16px" }}>
                    <h3
                      style={{
                        margin: "0 0 4px",
                        fontSize: "15px",
                        fontWeight: 500,
                        color: "#1a1a1a",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {restaurant.name}
                    </h3>

                    {restaurant.description && (
                      <p
                        style={{
                          margin: "0 0 8px",
                          fontSize: "13px",
                          color: "#888",
                          overflow: "hidden",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {restaurant.description}
                      </p>
                    )}

                    {restaurant.autoLocation?.formattedAddress && (
                      <p
                        style={{
                          margin: "0 0 10px",
                          fontSize: "12px",
                          color: "#aaa",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        📍 {restaurant.autoLocation.formattedAddress}
                      </p>
                    )}

                    {/* Footer Row */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: "8px",
                        paddingTop: "10px",
                        borderTop: "1px solid #fce8e8",
                      }}
                    >
                      <span style={{ fontSize: "13px", color: "#888" }}>
                        📞 {restaurant.phone}
                      </span>

                      {distance && (
                        <span
                          style={{
                            fontSize: "12px",
                            color: "#c0392b",
                            fontWeight: 500,
                          }}
                        >
                          {distance} km away
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
