import { useAppData } from "../context/AppProvider"
import { Navigate } from "react-router-dom";
import { useLocation, Outlet } from "react-router-dom";

// replace removes the page from browser history
const ProtectedRoute = () => {
    const { user, loading, isAuth} = useAppData();
    const location = useLocation();
    if(loading) return null;

    if(!isAuth){
        return <Navigate to = {"/login" } replace />
    }

    if(user?.role === null && location.pathname !== '/select-role'){
        return <Navigate to = {"/select-role"} replace />
    }

    if(user?.role !== null && location.pathname === '/select-role'){
        return <Navigate to = {"/"} replace />
    }

    return <Outlet />
};

export default ProtectedRoute;