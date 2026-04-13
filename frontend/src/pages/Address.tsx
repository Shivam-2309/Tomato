import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { restaurantService } from "../main";
import L from "leaflet";
import {
  LuLocateFixed,
  LuMapPin,
  LuPhone,
  LuTrash2,
  LuNavigation,
} from "react-icons/lu";
import { BiLoaderAlt, BiPlus } from "react-icons/bi";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface Address {
  _id: string;
  formattedAddress: string;
  mobile: number;
}

const LocationPicker = ({
  setLocation,
}: {
  setLocation: (lat: number, lng: number) => void;
}) => {
  useMapEvents({
    click(e) {
      setLocation(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const LocateMeButton = ({
  onLocate,
}: {
  onLocate: (lat: number, lng: number) => void;
}) => {
  const map = useMap();

  const locateUser = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        map.flyTo([latitude, longitude], 16, { animate: true });
        onLocate(latitude, longitude);
      },
      () => toast.error("Location permission denied"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <button
      type="button"
      onClick={locateUser}
      className="absolute right-3 top-3 z-1000 flex items-center gap-2 rounded-xl border border-red-100 bg-white/95 px-3 py-2 text-sm font-medium text-[#E23744] shadow-md backdrop-blur transition hover:bg-red-50"
    >
      <LuLocateFixed size={16} />
      Use current location
    </button>
  );
};

const AddAddressPage = () => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [fetchingAddress, setFetchingAddress] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [mobile, setMobile] = useState("");
  const [formattedAddress, setFormattedAddress] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const isValidMobile = /^[6-9]\d{9}$/.test(mobile);
  const canSave =
    isValidMobile &&
    !!formattedAddress &&
    latitude !== null &&
    longitude !== null &&
    !adding;

  const fetchFormattedAddress = async (lat: number, lng: number) => {
    try {
      setFetchingAddress(true);

      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      );
      const data = await res.json();
      setFormattedAddress(data.display_name || "");
    } catch {
      toast.error("Failed to fetch address");
    } finally {
      setFetchingAddress(false);
    }
  };

  const setLocation = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    fetchFormattedAddress(lat, lng);
  };

  const fetchAddresses = async () => {
    try {
      const { data } = await axios.get(`${restaurantService}/api/address/all`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setAddresses(data || []);
    } catch {
      toast.error("Failed to load addresses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const addAddress = async () => {
    if (!latitude || !longitude || !formattedAddress) {
      toast.error("Please select a location on the map");
      return;
    }

    if (!isValidMobile) {
      toast.error("Enter a valid 10-digit mobile number");
      return;
    }

    try {
      setAdding(true);
      console.log("LAT: ", latitude);
      console.log("LON: ", longitude);
      await axios.post(
        `${restaurantService}/api/address/add-address`,
        {
          formattedAddress,
          mobile,
          latitude,
          longitude,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      toast.success("Address added successfully");
      setMobile("");
      setFormattedAddress("");
      setLatitude(null);
      setLongitude(null);

      fetchAddresses();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to add address");
    } finally {
      setAdding(false);
    }
  };

  const deleteAddress = async (id: string) => {
    try {
      setDeletingId(id);

      await axios.delete(`${restaurantService}/api/address/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      toast.success("Address deleted");
      setAddresses((prev) => prev.filter((addr) => addr._id !== id));
    } catch {
      toast.error("Failed to delete address");
    } finally {
      setDeletingId(null);
    }
  };

  const mapCenter = useMemo(
    () => [latitude || 28.6139, longitude || 77.209] as [number, number],
    [latitude, longitude],
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Select Delivery Address
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Pin your delivery location, confirm the address, and save it for
          faster checkout.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="overflow-hidden rounded-2xl border border-red-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-red-50 px-4 py-3">
            <div>
              <h2 className="font-semibold text-gray-900">Choose on map</h2>
              <p className="text-xs text-gray-500">
                Click anywhere on the map to drop a pin
              </p>
            </div>
            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-[#E23744]">
              {latitude && longitude ? "Location selected" : "Waiting for pin"}
            </span>
          </div>

          <div className="relative h-full w-full">
            <MapContainer
              center={mapCenter}
              zoom={13}
              className="h-full w-full"
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              <LocationPicker setLocation={setLocation} />
              <LocateMeButton onLocate={setLocation} />
              {latitude !== null && longitude !== null && (
                <Marker position={[latitude, longitude]} />
              )}
            </MapContainer>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-red-100 bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Address details
            </h2>

            <div className="mb-4 rounded-xl border border-dashed border-red-200 bg-red-50/40 p-4">
              <div className="mb-2 flex items-center gap-2 text-[#E23744]">
                <LuMapPin size={16} />
                <span className="text-sm font-semibold">Selected address</span>
              </div>

              {fetchingAddress ? (
                <p className="text-sm text-gray-500">Fetching address...</p>
              ) : formattedAddress ? (
                <p className="text-sm leading-6 text-gray-700">
                  {formattedAddress}
                </p>
              ) : (
                <p className="text-sm text-gray-500">
                  Tap on the map or use your current location to autofill the
                  address.
                </p>
              )}
            </div>

            <label className="mb-2 block text-sm font-medium text-gray-700">
              Mobile number
            </label>
            <div className="relative">
              <LuPhone
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="Enter 10-digit mobile number"
                value={mobile}
                onChange={(e) =>
                  setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))
                }
                className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 outline-none transition focus:border-[#E23744] focus:ring-4 focus:ring-red-100"
              />
            </div>

            {mobile && !isValidMobile && (
              <p className="mt-2 text-xs text-red-500">
                Please enter a valid 10-digit Indian mobile number.
              </p>
            )}

            <button
              disabled={!canSave}
              onClick={addAddress}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#E23744] px-4 py-3 font-medium text-white transition hover:bg-[#d32f3a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {adding ? (
                <BiLoaderAlt className="animate-spin" size={18} />
              ) : (
                <BiPlus size={18} />
              )}
              {adding ? "Saving..." : "Save address"}
            </button>
          </div>

          <div className="rounded-2xl border border-red-100 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Saved addresses
              </h2>
              <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-[#E23744]">
                {addresses.length}
              </span>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-20 animate-pulse rounded-xl border border-gray-100 bg-gray-50"
                  />
                ))}
              </div>
            ) : addresses.length === 0 ? (
              <div className="rounded-xl border border-dashed border-red-200 bg-red-50/30 px-4 py-8 text-center">
                <LuNavigation
                  className="mx-auto mb-3 text-[#E23744]"
                  size={22}
                />
                <p className="font-medium text-gray-800">
                  No addresses saved yet
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Add your first delivery address to make checkout faster.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <div
                    key={addr._id}
                    className="group flex items-start justify-between rounded-xl border border-gray-100 bg-white p-4 transition hover:border-red-200 hover:shadow-sm"
                  >
                    <div className="pr-3">
                      <p className="text-sm font-medium leading-6 text-gray-800">
                        {addr.formattedAddress}
                      </p>
                      <p className="mt-2 text-xs text-gray-500">
                        📞 {addr.mobile}
                      </p>
                    </div>

                    <button
                      onClick={() => deleteAddress(addr._id)}
                      disabled={deletingId === addr._id}
                      className="rounded-lg p-2 text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                      aria-label="Delete address"
                    >
                      {deletingId === addr._id ? (
                        <BiLoaderAlt size={18} className="animate-spin" />
                      ) : (
                        <LuTrash2 size={18} />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddAddressPage;
