import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import PublicRoute from "./components/publicRoute";
import ProtectedRoute from "./components/protectedRoute";
import Home from "./pages/Home";
import SelectRole from "./pages/SelectRole";
import Navbar from "./components/Navbar";
import Account from "./pages/Account";
import { useAppData } from "./context/AppProvider";
import Restaurant from "./pages/Restaurant";
import RestaurantPage from "./pages/RestaurantPage";
import LikedRestaurants from "./pages/LikedRestaurants";
import Cart from "./pages/Cart";
import Address from "./pages/Address";
import { Checkout } from "./pages/Checkout";
import PaymentSuccess from "./pages/PaymentSuccess";
import Orders from "./pages/Orders";
import { OrderPage } from "./pages/OrderPage";
import RiderDashboard from "./pages/RiderDashboard";
import Admin from "./pages/Admin";
function App() {
  const { user, loading } = useAppData();

  if (loading)
    return (
      <h1 className="text-2xl font-bold text-red-500 text-center mt-56">
        Loading...
      </h1>
    );

  if (user && user?.role === "Seller") {
    return <Restaurant />;
  }
  if (user && user?.role === "Rider") {
    return <RiderDashboard />;
  }
  if (user && user?.role === "Admin") {
    return <Admin />;
  }
  return (
    <>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Home />} />
            <Route path="/restaurant/:id" element={<RestaurantPage />} />
            <Route path="/orders/:id" element={<OrderPage />} />
            <Route
              path="/paymentsuccess/:paymentId"
              element={<PaymentSuccess />}
            />
            <Route path="/addresses" element={<Address />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/likedRestaurants" element={<LikedRestaurants />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/select-role" element={<SelectRole />} />
            <Route path="/account" element={<Account />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
