import axios from "axios";
import { useAppData } from "../context/AppProvider";
import { useSocket } from "../context/SocketContext";
import { useEffect, useRef, useState } from "react";
import { riderService } from "../main";
import toast from "react-hot-toast";
import type { IOrder } from "../types";
import audio from "../assets/SOUND2.mp3";
import RiderOrderRequest from "../components/RiderOrderRequest";

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

  const [incomingOrders, setIncomingOrders] = useState<string[]>([]);
  const [currentOrder, setCurrentOrder] = useState<IOrder | null>(null);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const { setIsAuth, setUser } = useAppData();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    audioRef.current = new Audio(audio);
    // ets the HTML5 Audio preload property to instruct
    // the browser to download the entire audio file immediately
    audioRef.current.preload = "auto";
  }, []);

  const logoutHandler = () => {
    localStorage.setItem("token", "");
    setIsAuth(false);
    setUser(null);
    toast.success("Logout successful");
  };

  const unlockAudio = async () => {
    try {
      if (!audioRef.current) return;
      await audioRef.current.play();
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setAudioUnlocked(true);
      toast.success("Sound Enabled");
    } catch (err) {
      toast.error("Tap again to enable sound");
    }
  };

  useEffect(() => {
    if (!socket) return;

    const onOrderAvailable = ({ orderId }: { orderId: string }) => {
      setIncomingOrders((prev) =>
        prev.includes(orderId) ? prev : [...prev, orderId],
      );
      if (audioUnlocked && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }

      setTimeout(() => {
        setIncomingOrders((prev) => prev.filter((id) => id != orderId));
      }, 10000);
    };

    socket.on("order:available", onOrderAvailable);

    return () => {
      socket.off("order:available", onOrderAvailable);
    };
  }, [socket, audioUnlocked]);

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

  const fetchCurrentOrder = async () => {
    try {
      const { data } = await axios.get(
        `${riderService}/api/rider/order/current`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      setCurrentOrder(data.order);
    } catch (err) {
      // toast.error("Failed to fetch order details");
      setCurrentOrder(null);
    }
  };

  useEffect(() => {
    fetchCurrentOrder();
  }, []);

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
          // toast.error(error?.response?.data?.message || "Something went wrong");
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
    <div className="max-w-4xl mx-auto min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-3xl bg-white rounded-[32px] border border-gray-100 shadow-xl p-8 space-y-8">
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
              {profile.isAvailable && !currentOrder ? "Online" : "Offline"}
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
        {!currentOrder && (
          <div className="pt-2 flex gap-2">
            <button
              disabled={toggling}
              onClick={toggleAvailability}
              className={`w-full p-4 rounded-xl font-semibold text-white transition ${
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
        )}

        <button
          disabled={toggling}
          onClick={logoutHandler}
          className={
            "w-full p-4 rounded-xl font-semibold text-white transition bg-red-500 hover:bg-red-600"
          }
        >
          Logout
        </button>
        {!audioUnlocked && (
          <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="font-semibold text-yellow-800">
                  Enable Order Notifications
                </h3>

                <p className="text-sm text-yellow-700">
                  Click once to enable notification sounds for new orders.
                </p>
              </div>

              <button
                onClick={unlockAudio}
                className="rounded-lg bg-yellow-500 px-4 py-2 text-white transition hover:bg-yellow-600"
              >
                Enable Sound
              </button>
            </div>
          </div>
        )}
        {audioUnlocked && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-green-700">
            🔊 Notification sound enabled
          </div>
        )}

        {!currentOrder && incomingOrders.length > 0 && (
          <div className="rounded-xl border border-blue-300 bg-blue-50 p-4">
            {incomingOrders.map((id) => (
              <div key={id} className="mb-2 last:mb-0">
                <p className="text-sm text-blue-700">
                  <RiderOrderRequest
                    orderId={id}
                    onAccepted={() => {
                      fetchCurrentOrder();
                      fetchProfile();
                    }}
                  />
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RiderDashboard;
