import axios from "axios";
import { createContext, useEffect, useState, type ReactNode } from "react";
import { authService, restaurantService } from "../main";
import type { AppContextType, ICart, LocationData, User } from "../types";
import { useContext } from "react";
import { Toaster } from "react-hot-toast";

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [city, setCity] = useState("");
  const [cart, setCart] = useState<ICart[]>([]);
  const [subTotal, setSubTotal] = useState(0);
  const [quantity, setQuantity] = useState(0);

  async function fetchUser() {
    try {
      const token = localStorage.getItem("token");

      // this should not fire for the first time when the user is entering because initially the token is not set for sure
      if (!token) throw new Error("token not yet recieved");
      const { data } = await axios.get(`${authService}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUser(data);
      setIsAuth(true);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCart() {
    if (!user || user.role !== "Customer") return;

    try {
      const { data } = await axios.get(`${restaurantService}/api/cart/all`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setCart(data.cart || []);
      setSubTotal(data.subTotal || 0);
      setQuantity(data.totalQuantity);
    } catch (err) {
      console.log("The error is: ", err);
    }
  }

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user && user.role === "Customer") {
      fetchCart();
    }
  }, [user]);

  useEffect(() => {
    if (!navigator.geolocation)
      return alert("Please allow location to continue");
    setLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
        const locationResponse = await fetch(url);
        const locationObject = await locationResponse.json();

        setLocation({
          latitude,
          longitude,
          formattedAddress: locationObject.display_name || "current location",
        });
        setCity(
          locationObject.address.city ||
            locationObject.address.town ||
            locationObject.address.village ||
            "Your Location",
        );
        setLoadingLocation(false);
      } catch (err) {
        console.log("Error: ", err);
        setLocation({
          latitude,
          longitude,
          formattedAddress: "Current Address",
        });
        setLoadingLocation(false);
      }
    });
  }, []);

  return (
    <AppContext.Provider
      value={{
        isAuth,
        loading,
        setIsAuth,
        setLoading,
        setUser,
        user,
        location,
        loadingLocation,
        city,
        cart,
        fetchCart,
        subTotal,
        quantity,
      }}
    >
      {children}
      <Toaster />
    </AppContext.Provider>
  );
};

export const useAppData = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppData must be used with App Provider");
  }
  return context;
};
