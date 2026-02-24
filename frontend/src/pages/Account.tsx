import { useNavigate } from "react-router-dom";
import { useAppData } from "../context/AppProvider";
import { FiLogOut, FiPackage, FiMapPin } from "react-icons/fi";
import toast from "react-hot-toast";

const Account = () => {
    const { setIsAuth, user, setUser } = useAppData();
    const navigate = useNavigate();

    const firstLetter = user?.name?.charAt(0)?.toUpperCase() || "";

    const logoutHandler = () => {
        localStorage.setItem("token", "");
        setIsAuth(false);
        setUser(null);
        navigate("/login");
        toast.success("Logout successful");
    };

    return (
        <div className="min-h-screen bg-white">
            <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8 py-8 rounded-full">
                <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-6 md:p-8">
                    <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
                        <div className="shrink-0">
                            <div className="w-16 h-16 bg-[#E23744] rounded-full flex items-center justify-center text-xl font-bold text-white shadow-md">
                                {firstLetter}
                            </div>
                        </div>
                        <div className="min-w-0 flex-1">
                            <h1 className="text-lg md:text-xl font-bold text-gray-900 truncate">{user?.name}</h1>
                            <p className="text-sm md:text-base text-gray-600 truncate mt-1">{user?.email}</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <button
                            onClick={() => navigate("/orders")}
                            className="w-full flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-[#E23744]/50 hover:bg-[#E23744]/5 hover:shadow-sm transition-all duration-200 text-left group"
                        >
                            <FiPackage className="h-5 w-5 text-[#E23744] group-hover:scale-110 transition-transform shrink-0" />
                            <span className="font-medium text-gray-900 group-hover:text-[#E23744] truncate">Your Orders</span>
                        </button>

                        <button
                            onClick={() => navigate("/addresses")}
                            className="w-full flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-[#E23744]/50 hover:bg-[#E23744]/5 hover:shadow-sm transition-all duration-200 text-left group"
                        >
                            <FiMapPin className="h-5 w-5 text-[#E23744] group-hover:scale-110 transition-transform shrink-0" />
                            <span className="font-medium text-gray-900 group-hover:text-[#E23744] truncate">Addresses</span>
                        </button>

                        <button
                            onClick={logoutHandler}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#E23744] hover:bg-red-500 text-white font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-200 mt-4 relative group"
                        >
                            <FiLogOut className="h-5 w-5 group-hover:scale-110 transition-transform" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Account;
