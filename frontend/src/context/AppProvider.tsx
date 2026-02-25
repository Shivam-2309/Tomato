import axios from "axios";
import { createContext, useEffect, useState, type ReactNode } from "react";
import { authService } from "../main";
import type { AppContextType, LocationData, User } from "../types";
import { useContext } from "react";

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
    children : ReactNode,
}

export const AppProvider = ({ children } : AppProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuth, setIsAuth] = useState(false);
    const [loading, setLoading] = useState(false);

    const [location, setLocation] = useState<LocationData | null>(null);
    const [loadingLocation, setLoadingLocation] = useState(false);
    const [city, setCity] = useState("");

    async function fetchUser() {
        try {
            const token = localStorage.getItem("token");

            // this should not fire for the first time when the user is entering because initially the token is not set for sure
            if(!token) throw new Error("token not yet recieved");
            const { data } = await axios.get(`${authService}/api/auth/me`, {
                headers : {
                    Authorization : `Bearer ${token}`,
                },
            });

            setUser(data);
            setIsAuth(true);
        } catch(err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(
        () => {
            fetchUser();
        }, []);

    useEffect(() => { 
        if(!navigator.geolocation) return alert("Please allow location to continue");
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
                setCity(locationObject.address.city || locationObject.address.town || locationObject.address.village || "Your Location");
                setLoadingLocation(false);
            } catch(err) {
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

    return <AppContext.Provider
     value = { {isAuth, loading, setIsAuth, setLoading, setUser, user, location, loadingLocation, city} }>
        { children } 
    </AppContext.Provider>
};


export const useAppData = (): AppContextType => {
    const context = useContext(AppContext);
    if(!context){
        throw new Error("useAppData must be used with App Provider");
    }
    return context;
}
