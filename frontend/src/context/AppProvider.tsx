import axios from "axios";
import { createContext, useEffect, useState, type ReactNode } from "react";
import { authService } from "../main";
import type { AppContextType, User } from "../types";
import { useContext } from "react";

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
    children : ReactNode,
}

export const AppProvider = ({ children } : AppProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuth, setIsAuth] = useState(false);
    const [loading, setLoading] = useState(false);

    const [location, setLocation] = useState(null);
    const [loadingLocation, setLoadingLocation] = useState(false);
    const [city, setCity] = useState("fetching location....");

    async function fetchUser() {
        try {
            const token = localStorage.getItem("token");

            const { data } = await axios.get(`${authService}/api/auth/me`, {
                headers : {
                    Authorization : `Bearer ${token}`,
                },
            });

            console.log("data: ", data);
            setUser(data.user);
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

    return <AppContext.Provider
     value = { {isAuth, loading, setIsAuth, setLoading, setUser, user} }>
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
