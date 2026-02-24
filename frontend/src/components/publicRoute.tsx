import { Navigate, Outlet } from "react-router-dom";
import { useAppData } from "../context/AppProvider";
// what is Outlet ? 
// defines that in the childn route defined in this component, where would the child route display itself ? 

const PublicRoute = () => {
    const { isAuth, loading } = useAppData();

    if (loading) {
        return null;
    }
    // replace prevents the current page from getting added to browser hsitory
    if(isAuth) console.log("isAuth is recieved");
    else console.log("isAuth is not recieved");

    return isAuth ? <Navigate to = "/" replace/> : <Outlet /> 
}

export default PublicRoute;