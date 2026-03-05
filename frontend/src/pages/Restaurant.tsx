import { useState, useEffect } from "react";
import type { IRestaurant } from '../types';
import axios from 'axios';
import { restaurantService } from "../main";
import AddRestaurant from "../components/AddRestaurant";
import RestaurantProfile from "../components/RestaurantProfile";

const Restaurant = () => {
  const [restaurant, setRestaurant] = useState<IRestaurant | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMyRestaurant = async () => {
    try {
      const { data } = await axios.get(`${restaurantService}/api/restaurant/my`, {
        headers : {
          Authorization : `Bearer ${localStorage.getItem("token")}`,
        },
      })

      setRestaurant(data.restaurant || null);
      
      if(data.token){
        localStorage.setItem("token", data.token);
        window.location.reload();
      }
    } catch(err){
      console.log("The error is : ", err);
    } finally{
      setLoading(false);
    }
  }
  useEffect(() => {
        fetchMyRestaurant();
      }, []);
  if(loading) return <div className="flex min-h-screen justify-center items-center">
                        <p className="text-gray-500">Loading...</p>
                     </div>

  if(!restaurant){
    return <AddRestaurant fetchMyRestaurant={fetchMyRestaurant} />
  }               

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-50 px-4 py-6 space-y-6">
      <RestaurantProfile restaurant={restaurant} isSeller={true} onUpdate={setRestaurant}/>
    </div>
  )
}

export default Restaurant