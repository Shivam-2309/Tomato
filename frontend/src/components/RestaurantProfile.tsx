import type { IRestaurant } from "../types"
import axios from 'axios';
import { useState } from "react";
import { restaurantService } from "../main";
import toast from "react-hot-toast";
import { BiMapPin } from "react-icons/bi";

interface props {
    restaurant: IRestaurant;
    isSeller: boolean;
    onUpdate: (restaurant: IRestaurant) => void;
}

const RestaurantProfile = ({ restaurant, isSeller, onUpdate }: props) => { 
    const [editMode, setEditMode] = useState(false);
    const [name, setName] = useState(restaurant.name);
    const [description, setDescription] = useState(restaurant.description || '');
    const [isOpen, setIsOpen] = useState(restaurant.isOpen);
    const [loading, setLoading] = useState(false);

    const toggleOpenStatus = async () => {
        try {
            const { data } = await axios.put(
                `${restaurantService}/api/restaurant/status`,
                { status: !isOpen },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );
            toast.success(data.message);
            setIsOpen(data.restaurant.isOpen);
            if (onUpdate) onUpdate(data.restaurant);  
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Toggle failed');
        }
    }

    const saveChanges = async () => {
        try {
            setLoading(true);
            const { data } = await axios.put(
                `${restaurantService}/api/restaurant/edit`,
                { name, description },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );
            onUpdate(data.restaurant);
            setEditMode(false);
            toast.success(data.message);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Update failed');
            console.error("Unable to update changes", err);
        } finally {
            setLoading(false);
        }
    }

    const cancelEdit = () => {
        setName(restaurant.name);
        setDescription(restaurant.description || '');
        setEditMode(false);
    }

    return (
        <div className="mx-auto min-w-3xl rounded-xl mg-5 bg-white shadow-sm overflow-hidden">
            {restaurant.image && (
                <img
                    src={restaurant.image}
                    alt={`${restaurant.name} photo`}
                    className="h-48 w-full object-cover"
                />
            )}
            <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        {editMode ? (
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full text-2xl font-bold text-gray-900 border-none focus:ring-2 focus:ring-[#e23744] rounded-md px-2 py-1"
                                placeholder="Restaurant name"
                                autoFocus
                            />
                        ) : (
                            <h1 className="text-2xl font-bold text-gray-900">{restaurant.name}</h1>
                        )}
                    </div>
                    {isSeller && (
                        <div className="flex items-center space-x-2 ml-4">
                            {!editMode && (
                                <button
                                    onClick={() => setEditMode(true)}
                                    className="px-4 py-2 text-sm font-medium text-white bg-[#e23744] rounded-lg hover:bg-[#c82333] transition-colors"
                                >
                                    Edit
                                </button>
                            )}
                            {editMode && (
                                <>
                                    <button
                                        onClick={saveChanges}
                                        disabled={loading}
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                    >
                                        {loading ? 'Saving...' : 'Save'}
                                    </button>
                                    <button
                                        onClick={cancelEdit}
                                        disabled={loading}
                                        className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
                <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                    <BiMapPin className = "h-4 w-4 text-red-500" />
                    {restaurant.autoLocation.formattedAddress || "Location not available"}
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex justify-center items-center gap-2">
                        <span className="text-sm font-medium text-gray-500">
                            Status
                        </span>
                        <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                                isOpen
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                            }`}
                        >
                            {isOpen ? 'Open' : 'Closed'}
                        </span>
                    </div>
                    {isSeller && (
                        <button
                            onClick={toggleOpenStatus}
                            className="p-2 text-[#e23744] hover:bg-red-50 rounded-lg transition-colors"
                            title="Toggle status"
                        >
                            {isOpen ? '🔔 Close Restaurant' : '✅ Open Restaurant'}
                        </button>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">Description</label>
                    {editMode ? (
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e23744] focus:border-transparent resize-vertical"
                            placeholder="Enter restaurant description..."
                        />
                    ) : (
                        <p className="text-gray-700 leading-relaxed">{description || 'No description available.'}</p>
                    )}
                </div>

                <p className="text-xs text-gray-400">Created on : {new Date(restaurant.createdAt).toLocaleDateString()}</p>
            </div>
        </div>
    );
}

export default RestaurantProfile;
