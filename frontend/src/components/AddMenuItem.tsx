import { useState } from "react";
import axios from 'axios';
import { restaurantService } from "../main";
import toast from "react-hot-toast";

const AddMenuItem = ({ onItemsAdded } : { onItemsAdded : () => void }) => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [image, setImage] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    const resetForm = () => {
        setName("");
        setDescription("");
        setPrice("");
        setImage(null);
        setLoading(false);
    };

    const handleSubmit = async () => {
        if(!name || !price || !image){
            alert("Name, Price and Image are mandatory");
            return;
        };

        const formData = new FormData();

        formData.append("name", name);
        formData.append("description", description);
        formData.append("price", price);
        formData.append("file", image);

        try {
            setLoading(true);
            const addMenuItemRequest = await axios.post(`${restaurantService}/api/item/new`, formData, {
                headers : {
                    Authorization : `Bearer ${localStorage.getItem("token")}`, 
                }
            });

            toast.success("Item added successfully");
            resetForm();    
            
        } catch(err){
            console.log("The error is : ", err);
            toast.error("Failed to get item");
        } finally {
            setLoading(false);
        }
    };
  return (
    <div className="max-w-md space-y-4 m-auto">
        <h2 className="text-lg font-semibold">Add Menu Item</h2>
        <input type="text" 
        placeholder="Item name" 
        value = {name} 
        onChange={(e) => {setName(e.target.value)}}
        className="w-full rounded-lg border px-4 py-2 text-sm outline-none"/>

        <textarea
        placeholder="Item Description" 
        value = {description} 
        onChange={(e) => {setDescription(e.target.value)}}
        className="w-full rounded-lg border px-4 py-2 text-sm outline-none"/>

        <input type="number" 
        placeholder="Item Price" 
        value = {price} 
        onChange={(e) => {setPrice(e.target.value)}}
        className="w-full rounded-lg border px-4 py-2 text-sm outline-none"/>

        <label className="block text-sm font-medium text-gray-700 mb-2">
            Item Image *
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#e23744] file:text-white hover:file:bg-[#d32f3a] cursor-pointer"
        />

        <button disabled={loading} onClick={handleSubmit} className="w-full rounded-lg text-white text-sm py-3 font-semibold transition bg-red-500">{ loading ? "Adding..." : "Add Item" }</button>
    </div>
  )
}

export default AddMenuItem