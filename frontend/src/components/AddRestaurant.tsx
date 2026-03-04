import { useState } from "react"
import { useAppData } from "../context/AppProvider";
import toast from "react-hot-toast";
import { restaurantService } from "../main";
import axios from 'axios'

interface props {
  fetchMyRestaurant : () => Promise<void>;
}

const AddRestaurant = ({ fetchMyRestaurant } : props) => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [phone, setPhone] = useState("");
    const [image, setImage] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const {location, loadingLocation} = useAppData();

    const handleSubmit = async () => {
        if(!name || !image || !location){
            alert("All fields are necessary");
            return;
        }

        const formData = new FormData();
        formData.append("name", name);
        formData.append("description", description);
        formData.append("latitude", String(location.latitude));
        formData.append("longitude", String(location.longitude));
        formData.append("formattedAddress", location.formattedAddress);
        formData.append("file", image);
        formData.append("phone", phone);

        try {
            setSubmitting(true);
            await axios.post(`${restaurantService}/api/restaurant/new`, formData, {
                headers : {
                    Authorization : `Bearer ${localStorage.getItem("token")}`,
                },
            });

            toast.success("Restaurant is successfully added");
            fetchMyRestaurant();
        }catch(err : any){
            toast.error(err.response.data.message);
        } finally{
            setSubmitting(false);
        }
    } 

  return (
    <div className="flex min-h-screen bg-white items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-center text-lg font-bold bg-[#e23744] text-white rounded-md py-3">
          Add New Restaurant
        </h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Restaurant Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e23744] focus:border-transparent"
              placeholder="Enter restaurant name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e23744] focus:border-transparent resize-none"
              placeholder="Enter restaurant description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e23744] focus:border-transparent"
              placeholder="Enter phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Restaurant Image *
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#e23744] file:text-white hover:file:bg-[#d32f3a] cursor-pointer"
            />
          </div>

          {!loadingLocation && location && (
            <div className="bg-gray-50 p-3 rounded-xl">
              <p className="text-xs text-gray-600 mb-1">Selected Location:</p>
              <p className="text-sm font-medium text-gray-900">
                {location.formattedAddress}
              </p>
            </div>
          )}
        </div>

        <button 
          disabled={!name || !image || !location || submitting || loadingLocation} 
          onClick={handleSubmit}
          className={`w-full rounded-xl px-4 py-3 font-semibold text-sm transition ${
            !name || !image || !location || submitting || loadingLocation
              ? "bg-gray-300 text-gray-400 cursor-not-allowed" 
              : "bg-[#e23744] text-white hover:bg-[#d32f3a]"
          }`}
        >
          {submitting ? "Adding Restaurant..." : "Add Restaurant"}
        </button>
      </div>
    </div>
  )
}

export default AddRestaurant
