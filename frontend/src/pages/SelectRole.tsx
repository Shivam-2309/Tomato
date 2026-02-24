import { useState } from "react"
import { useAppData } from "../context/AppProvider";
import { useNavigate } from "react-router-dom";
import { authService } from "../main";
import axios from "axios";


type Role = "Customer" | "Rider" | "Seller" | null;
const SelectRole = () => {
  const [role, setRole] = useState<Role>(null);
  const { setUser } = useAppData();
  const navigate = useNavigate();

  const roles : Role[] = ["Customer", "Rider", "Seller"];

  const addRole = async () => {
    try {
      const {data} = await axios.put(`${authService}/api/auth/add/role`, 
        { role }, 
        { 
          headers : {
            Authorization : `Bearer ${localStorage.getItem("token")}`,
          }
        })
        localStorage.setItem("token", data.token);
        setUser(data.user);
        navigate("/", {replace : true});
    } catch(err){
      alert("Something went wrong !!");
      console.log("Error: ", err);
    }
  }
  return (
    <div className="flex min-h-screen bg-white items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
          <h1 className="text-center text-lg font-bold bg-[#e23744] text-white rounded-md py-3">Choose your Role</h1>
          <div className="space-y-3">
            {
              roles.map((r) => {
                return <button onClick = {() => setRole(r)} className={`w-full text-sm rounded-xl px-2 py-3 font-medium capitalize transition
                ${role === r ? "border-[#E23744] bg-[#e23744] text-white" : 
                  "border-gray-300 bg-white text-gray-700 hover:bg-gray-500"
                 }`}>
                  Continue as {r}
                </button>
              })
            }
          </div>
          <button disabled = {!role} onClick={addRole} className={`w-full max-w-sm rounded-xl px-4 py-3 font-semibold transition
            ${!role ? "bg-gray-300 text-gray-400 cursor-not-allowed" 
              : "bg-[#E23744] text-white hover:bg[#d32f3a]"}
            `}>
              Next
          </button>
      </div>
    </div>
  )
}

export default SelectRole