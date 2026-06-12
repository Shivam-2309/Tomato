import axios from "axios";
import { useAppData } from "../context/AppProvider";
import { useSocket } from "../context/SocketContext";
import { useEffect, useState } from "react";
import { riderService } from "../main";
import toast from "react-hot-toast";

interface IRider {
  _id: string;
  picture: string;
  phoneNumber: string;
  aadharNumber: string;
  drivingLicenseNumber: string;

  isVerified: boolean;
  isAvailable: boolean;

  location: {
    type: "Point";
    coordinates: [number, number];
  };

  lastActiveAt: string;
  createdAt: string;
  updatedAt: string;
}

const RiderDashboard = () => {
  const { user } = useAppData();
  const { socket } = useSocket();

  const [profile, setProfile] = useState<IRider | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const [phoneNumber, setPhoneNumber] = useState("");
  const [drivingLicenseNumber, setDrivingLicenseNumber] = useState("");
  const [aadharNumber, setAadharNumber] = useState("");
  const [picture, setPicture] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);

  const fetchProfile = async () => {
    try {
      const { data } = await axios.get(`${riderService}/api/rider/myprofile`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setProfile(data.riderProfile || null);
    } catch (err) {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "Rider") {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [user]);

  const toggleAvailability = async () => {
    if (!navigator.geolocation) {
      toast.error("Location Access Required");
      return;
    }

    setToggling(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await axios.patch(
            `${riderService}/api/rider/toggle`,
            {
              isAvailable: !profile?.isAvailable,
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            },
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            },
          );

          toast.success(
            profile?.isAvailable ? "You are offline" : "You are online",
          );

          fetchProfile();
        } catch (error: any) {
          toast.error(error?.response?.data?.message || "Something went wrong");
        } finally {
          setToggling(false);
        }
      },
      () => {
        toast.error("Unable to fetch location");
        setToggling(false);
      },
    );
  };

  const handleSubmit = async () => {
    if (!navigator.geolocation) {
      toast.error("Location access is required");
      return;
    }

    setSubmitting(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const formData = new FormData();

        formData.append("phoneNumber", phoneNumber);
        formData.append("aadharNumber", aadharNumber);
        formData.append("drivingLicenseNumber", drivingLicenseNumber);
        formData.append("latitude", pos.coords.latitude.toString());
        formData.append("longitude", pos.coords.longitude.toString());

        if (picture) {
          formData.append("file", picture);
        }

        try {
          const { data } = await axios.post(
            `${riderService}/api/rider/new`,
            formData,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            },
          );

          toast.success(data.message);

          setPhoneNumber("");
          setAadharNumber("");
          setDrivingLicenseNumber("");
          setPicture(null);

          fetchProfile();
        } catch (err: any) {
          toast.error(
            err?.response?.data?.message || "Failed to create profile",
          );
        } finally {
          setSubmitting(false);
        }
      },
      () => {
        toast.error("Unable to fetch location");
        setSubmitting(false);
      },
    );
  };

  if (user?.role !== "Rider") {
    return (
      <div className="flex min-h-[60vh] justify-center items-center">
        You are not a registered rider
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] justify-center items-center">
        Loading rider details...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen bg-white items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-6">
          <h1 className="text-center text-lg font-bold bg-[#e23744] text-white rounded-md py-3">
            Add Your Profile
          </h1>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aadhar Number
              </label>
              <input
                type="number"
                value={aadharNumber}
                onChange={(e) => setAadharNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e23744]"
                placeholder="Enter Aadhar number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e23744]"
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Driving License
              </label>
              <input
                type="text"
                value={drivingLicenseNumber}
                onChange={(e) => setDrivingLicenseNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e23744]"
                placeholder="Enter Driving License"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rider Photo
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPicture(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
              />
            </div>
          </div>

          <button
            disabled={
              !picture ||
              !drivingLicenseNumber ||
              !aadharNumber ||
              !phoneNumber ||
              submitting
            }
            onClick={handleSubmit}
            className={`w-full rounded-xl px-4 py-3 font-semibold text-sm transition ${
              !picture ||
              !drivingLicenseNumber ||
              !aadharNumber ||
              !phoneNumber ||
              submitting
                ? "bg-gray-300 text-gray-400 cursor-not-allowed"
                : "bg-[#e23744] text-white hover:bg-[#d32f3a]"
            }`}
          >
            {submitting ? "Adding Profile..." : "Add Rider"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto min-h-[60vh] flex items-center justify-center px-3 py-3">
      <div className="bg-white rounded-3xl shadow-lg p-8 max-w-2xl space-y-8">
        {/* Header */}
        <div className="flex flex-col items-center gap-4 border-b pb-8">
          <img
            src={profile.picture}
            alt="Rider"
            className="w-20 h-20 rounded-full object-cover border-4 border-red-100 shadow"
          />
          <h2 className="text-2xl font-bold text-gray-800">Rider Dashboard</h2>
          <div className="flex flex-wrap justify-center gap-3">
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                profile.isVerified
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {profile.isVerified ? "Verified Rider" : "Verification Pending"}
            </span>

            <span
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                profile.isAvailable
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {profile.isAvailable ? "Online" : "Offline"}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Rider ID: {profile._id.slice(-6)}
          </p>
          <div className="text-sm text-blue-300 text-justify rounded-lg p-2">
            Please be within 500m of any restaurant (which we call hotspot)
            before going online to recieve orders and get online
          </div>
        </div>

        {/* Activity */}
        <div>
          <h3 className="text-lg font-bold mb-4 text-gray-800">
            Activity Information
          </h3>

          <div className="grid md:grid-cols-3 gap-5">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-1">Last Active</p>
              <p className="font-semibold text-gray-800">
                {new Date(profile.lastActiveAt).toLocaleString()}
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-1">Account Created</p>
              <p className="font-semibold text-gray-800">
                {new Date(profile.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-1">Last Updated</p>
              <p className="font-semibold text-gray-800">
                {new Date(profile.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            disabled={toggling}
            onClick={toggleAvailability}
            className={`w-full py-4 rounded-xl font-semibold text-white transition ${
              profile.isAvailable
                ? "bg-red-500 hover:bg-red-600"
                : "bg-green-500 hover:bg-green-600"
            } disabled:opacity-70`}
          >
            {toggling
              ? "Updating Status..."
              : profile.isAvailable
                ? "Go Offline"
                : "Go Online"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RiderDashboard;
