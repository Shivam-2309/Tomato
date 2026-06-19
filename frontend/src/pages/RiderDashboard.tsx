import axios from "axios";
import { useAppData } from "../context/AppProvider";
import { useSocket } from "../context/SocketContext";
import { useEffect, useRef, useState } from "react";
import { riderService } from "../main";
import toast from "react-hot-toast";
import type { IOrder } from "../types";
import audio from "../assets/SOUND2.mp3";
import RiderOrderRequest from "../components/RiderOrderRequest";
import { RiderCurrentOrder } from "../components/RiderCurrentOrder";

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
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
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
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      setCurrentOrder(data.order);
    } catch (err) {
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
          // handled
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
        if (picture) formData.append("file", picture);

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

  /* ── Guards ── */
  if (user?.role !== "Rider") {
    return (
      <div className="flex min-h-[60vh] justify-center items-center text-gray-500 text-sm">
        You are not a registered rider.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] justify-center items-center">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="animate-spin h-7 w-7 text-[#e23744]"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            />
          </svg>
          <p className="text-sm text-gray-500">Loading rider details…</p>
        </div>
      </div>
    );
  }

  /* ── Profile creation form ── */
  if (!profile) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          {/* Brand header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-[#e23744] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-100">
              <svg
                className="w-7 h-7 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              Create Rider Profile
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Fill in your details to get started
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <Field
              label="Aadhar Number"
              type="number"
              value={aadharNumber}
              onChange={setAadharNumber}
              placeholder="12-digit Aadhar number"
            />
            <Field
              label="Phone Number"
              type="number"
              value={phoneNumber}
              onChange={setPhoneNumber}
              placeholder="10-digit mobile number"
            />
            <Field
              label="Driving License"
              type="text"
              value={drivingLicenseNumber}
              onChange={setDrivingLicenseNumber}
              placeholder="e.g. DL-0420110149646"
            />

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                Rider Photo
              </label>
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#e23744] hover:bg-red-50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setPicture(e.target.files?.[0] || null)}
                />
                {picture ? (
                  <p className="text-sm font-medium text-[#e23744]">
                    {picture.name}
                  </p>
                ) : (
                  <>
                    <svg
                      className="w-6 h-6 text-gray-400 mb-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-xs text-gray-400">Tap to upload photo</p>
                  </>
                )}
              </label>
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
              className={`w-full rounded-xl py-3 text-sm font-bold tracking-wide transition-all active:scale-95 ${
                !picture ||
                !drivingLicenseNumber ||
                !aadharNumber ||
                !phoneNumber ||
                submitting
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-[#e23744] text-white hover:bg-[#d32f3a] shadow-sm shadow-red-100"
              }`}
            >
              {submitting ? "Creating Profile…" : "Add Rider Profile"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Main dashboard ── */
  const isOnline = profile.isAvailable && !currentOrder;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="min-h-screen max-w-xl mx-auto space-y-4 flex flex-col justify-center px-4 py-10">
        {/* Profile card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Cover strip */}
          <div className="h-16 bg-linear-to-r from-[#e23744] to-[#f05060]" />

          <div className="px-5 pb-5">
            <div className="flex items-end gap-4 -mt-8 mb-4">
              <img
                src={profile.picture}
                alt="Rider"
                className="w-16 h-16 rounded-2xl object-cover border-4 border-white shadow-md"
              />
              <div className="mb-1 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      profile.isVerified
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${profile.isVerified ? "bg-green-500" : "bg-amber-500"}`}
                    />
                    {profile.isVerified ? "Verified" : "Pending"}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      isOnline
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}
                    />
                    {isOnline ? "Online" : "Offline"}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs font-mono text-gray-400">
              Rider #{profile._id.slice(-6).toUpperCase()}
            </p>
          </div>
        </div>

        {/* Hotspot tip */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 flex gap-3 items-start">
          <span className="text-lg mt-0.5">💡</span>
          <p className="text-xs text-blue-700 leading-relaxed">
            Stay within <strong>500m of a restaurant hotspot</strong> before
            going online to start receiving orders.
          </p>
        </div>

        {/* Activity stats */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Activity
          </p>
          <div className="grid grid-cols-3 gap-3">
            <ActivityStat
              label="Last Active"
              value={new Date(profile.lastActiveAt).toLocaleString()}
            />
            <ActivityStat
              label="Member Since"
              value={new Date(profile.createdAt).toLocaleDateString()}
            />
            <ActivityStat
              label="Last Updated"
              value={new Date(profile.updatedAt).toLocaleString()}
            />
          </div>
        </div>

        {/* Availability toggle */}
        {!currentOrder && (
          <button
            disabled={toggling}
            onClick={toggleAvailability}
            className={`w-full py-3.5 rounded-2xl text-sm font-bold tracking-wide transition-all active:scale-95 disabled:opacity-60 ${
              profile.isAvailable
                ? "bg-gray-900 hover:bg-gray-800 text-white"
                : "bg-[#e23744] hover:bg-[#cc2f3c] text-white shadow-sm shadow-red-100"
            }`}
          >
            {toggling ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
                Updating…
              </span>
            ) : profile.isAvailable ? (
              "Go Offline"
            ) : (
              "Go Online"
            )}
          </button>
        )}

        {/* Sound prompt */}
        {!audioUnlocked ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-amber-800">
                Enable Notifications
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                Tap to hear alerts for new orders
              </p>
            </div>
            <button
              onClick={unlockAudio}
              className="shrink-0 bg-amber-400 hover:bg-amber-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all active:scale-95"
            >
              Enable 🔔
            </button>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 text-sm text-green-700 font-medium">
            🔊 Notification sound is enabled
          </div>
        )}

        {/* Incoming orders */}
        {!currentOrder && incomingOrders.length > 0 && (
          <div className="space-y-2">
            {incomingOrders.map((id) => (
              <RiderOrderRequest
                key={id}
                orderId={id}
                onAccepted={() => {
                  fetchCurrentOrder();
                  fetchProfile();
                }}
              />
            ))}
          </div>
        )}

        {/* Current order */}
        {currentOrder && (
          <RiderCurrentOrder
            order={currentOrder}
            onStatusUpdate={fetchCurrentOrder}
          />
        )}

        {/* Logout */}
        <button
          onClick={logoutHandler}
          className="w-full py-3 rounded-2xl text-sm font-semibold text-gray-500 border border-gray-200 hover:bg-gray-50 hover:text-gray-700 transition-all"
        >
          Log out
        </button>
      </div>
    </div>
  );
};

/* ── Small helpers ── */
const Field = ({
  label,
  type,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) => (
  <div>
    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e23744]/30 focus:border-[#e23744] transition-colors"
    />
  </div>
);

const ActivityStat = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-gray-50 rounded-xl p-3">
    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
      {label}
    </p>
    <p className="text-xs font-semibold text-gray-800 leading-snug">{value}</p>
  </div>
);

export default RiderDashboard;
