import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import type { IOrder } from "../types";
import { restaurantService, adminService } from "../main";
import { useSocket } from "../context/SocketContext";
import {
  Store,
  Receipt,
  MapPin,
  Bike,
  CreditCard,
  Clock3,
  AlertCircle,
  CheckCircle,
  XCircle,
  Hourglass,
} from "lucide-react";

const ORDER_STEPS = [
  "placed",
  "accepted",
  "preparing",
  "ready_for_rider",
  "rider_assigned",
  "picked_up",
  "delivered",
];

interface IIssue {
  _id: string;
  orderId: string;
  customerId: string;
  issueType:
    | "burnt_food"
    | "undercooked_food"
    | "missing_item"
    | "packaging_damage"
    | "other";
  description: string;
  imageUrl: string;
  status:
    | "AI_ANALYSIS_PENDING"
    | "ADMIN_REVIEW_PENDING"
    | "APPROVED"
    | "REJECTED";
  aiResult?: {
    issueDetected?: boolean;
    confidence?: number;
    severity?: "low" | "medium" | "high";
    reason?: string;
    recommendation?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "accepted":
      return "bg-blue-50 text-blue-600 border border-blue-200";
    case "preparing":
      return "bg-amber-50 text-amber-600 border border-amber-200";
    case "ready_for_rider":
      return "bg-purple-50 text-purple-600 border border-purple-200";
    case "rider_assigned":
      return "bg-indigo-50 text-indigo-600 border border-indigo-200";
    case "picked_up":
      return "bg-orange-50 text-orange-600 border border-orange-200";
    case "delivered":
      return "bg-green-50 text-green-600 border border-green-200";
    case "cancelled":
      return "bg-[#fdecea] text-[#e23744] border border-[#f5c6c2]";
    default:
      return "bg-gray-50 text-gray-600 border border-gray-200";
  }
};

const formatStatus = (status: string) =>
  status.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());

const formatIssueType = (type: IIssue["issueType"]) =>
  type.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

const IssueStatusCard = ({ issue }: { issue: IIssue }) => {
  const isPending =
    issue.status === "AI_ANALYSIS_PENDING" ||
    issue.status === "ADMIN_REVIEW_PENDING";

  return (
    <div
      className={`w-full rounded-2xl border p-5 ${
        issue.status === "APPROVED"
          ? "bg-green-50 border-green-200"
          : issue.status === "REJECTED"
            ? "bg-[#fdecea] border-[#f5c6c2]"
            : "bg-white border-[#e8e8e8]"
      }`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          {issue.status === "APPROVED" && (
            <CheckCircle size={18} className="text-green-600 shrink-0" />
          )}
          {issue.status === "REJECTED" && (
            <XCircle size={18} className="text-[#e23744] shrink-0" />
          )}
          {isPending && (
            <Hourglass size={18} className="text-[#93959f] shrink-0" />
          )}
          <h2 className="text-sm font-semibold text-[#1c1c1c]">
            {issue.status === "APPROVED" && "Issue Approved"}
            {issue.status === "REJECTED" && "Issue Rejected"}
            {isPending && "Issue Under Review"}
          </h2>
        </div>

        <span
          className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${
            issue.status === "APPROVED"
              ? "bg-green-100 text-green-700 border-green-200"
              : issue.status === "REJECTED"
                ? "bg-[#fdecea] text-[#e23744] border-[#f5c6c2]"
                : "bg-gray-100 text-[#686b78] border-[#e8e8e8]"
          }`}
        >
          {formatIssueType(issue.issueType)}
        </span>
      </div>

      {/* Divider */}
      <div className="h-px bg-black/5 mb-4" />

      {/* Description */}
      <p className="text-xs text-[#686b78] leading-relaxed mb-4">
        {issue.description}
      </p>

      {/* Outcome message */}
      {issue.status === "APPROVED" && (
        <div className="bg-green-100 border border-green-200 rounded-xl px-4 py-3 text-xs text-green-800 font-medium">
          ✅ Your complaint has been accepted. A refund or resolution will be
          processed shortly.
        </div>
      )}

      {issue.status === "REJECTED" && (
        <div className="bg-[#fdecea] border border-[#f5c6c2] rounded-xl px-4 py-3 text-xs text-[#e23744] font-medium">
          ❌ We reviewed your complaint but were unable to verify the issue at
          this time.
        </div>
      )}

      {isPending && (
        <div className="bg-gray-50 border border-[#e8e8e8] rounded-xl px-4 py-3 text-xs text-[#686b78]">
          🔍 Your complaint is being reviewed. Check back later for an update.
        </div>
      )}

      {/* Footer */}
      <p className="text-[10px] text-[#93959f] mt-3 text-right">
        Reported {new Date(issue.createdAt).toLocaleDateString()}
      </p>
    </div>
  );
};

export const OrderPage = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { id } = useParams();
  const { socket } = useSocket();

  const [order, setOrder] = useState<IOrder | null>(null);
  const [existingIssue, setExistingIssue] = useState<IIssue | null>(null);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `${restaurantService}/api/order/myOrder/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      setOrder(data.order);
    } catch (error) {
      console.error("Error fetching order:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchIssue = async () => {
      try {
        const { data } = await axios.get(
          `${adminService}/api/v1/issues/${id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );
        setExistingIssue(data.issue ?? data ?? null);
      } catch {
        // 404 means no issue filed yet — expected
        setExistingIssue(null);
      }
    };

    fetchIssue();
  }, []);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  useEffect(() => {
    if (!socket) return;

    const onSocketUpdate = () => fetchOrder();
    const onUpdateOrder = () => fetchOrder();

    socket.on("order:update", onSocketUpdate);
    socket.on("order:rider_assigned", onUpdateOrder);

    return () => {
      socket.off("order:update", onSocketUpdate);
      socket.off("order:rider_assigned", onUpdateOrder);
    };
  }, [socket, id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex justify-center items-center bg-[#f5f5f5]">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-[#e23744] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-[#686b78] text-sm">Loading order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[60vh] flex justify-center items-center bg-[#f5f5f5]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[#1c1c1c]">
            Order not found
          </h2>
          <p className="text-[#686b78] text-sm mt-1">
            We couldn't find this order.
          </p>
        </div>
      </div>
    );
  }

  const currentStep = ORDER_STEPS.indexOf(order.status);
  const totalItems = order.items.reduce((acc, item) => acc + item.quantity, 0);
  const isActive = order.status !== "delivered" && order.status !== "cancelled";

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-4">
        {/* Header Card */}
        <div className="bg-white rounded-2xl border border-[#e8e8e8] p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
            <div>
              <p className="text-xs text-[#93959f] font-medium uppercase tracking-widest mb-1">
                Order ID
              </p>
              <h1 className="text-xl font-bold text-[#1c1c1c]">
                #{order._id.slice(-6).toUpperCase()}
              </h1>
              <div className="flex items-center gap-1.5 mt-2 text-[#686b78] text-xs">
                <Clock3 size={13} />
                <span>{new Date(order.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <span
              className={`self-start px-4 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(order.status)} ${isActive ? "animate-pulse" : ""}`}
            >
              {formatStatus(order.status)}
            </span>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Items", value: totalItems, large: true },
            { label: "Total", value: `₹${order.totalAmount}`, large: true },
            { label: "Payment", value: order.paymentStatus, large: false },
          ].map(({ label, value, large }) => (
            <div
              key={label}
              className="bg-white rounded-2xl border border-[#e8e8e8] p-4 shadow-sm"
            >
              <p className="text-[10px] text-[#93959f] font-medium uppercase tracking-widest mb-1">
                {label}
              </p>
              <p
                className={`font-bold text-[#1c1c1c] capitalize ${large ? "text-2xl" : "text-base"}`}
              >
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Progress Tracker */}
        {order.status !== "cancelled" && (
          <div className="bg-white rounded-2xl border border-[#e8e8e8] p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-[#e23744] uppercase tracking-widest mb-5">
              Order Progress
            </h2>

            <div className="relative">
              <div className="absolute top-4 left-4 right-4 h-0.5 bg-[#ebebeb] rounded-full">
                <div
                  className="h-full bg-[#e23744] rounded-full transition-all duration-700"
                  style={{
                    width:
                      currentStep >= 0
                        ? `${(currentStep / (ORDER_STEPS.length - 1)) * 100}%`
                        : "0%",
                  }}
                />
              </div>

              <div className="flex justify-between relative z-10">
                {ORDER_STEPS.map((step, index) => (
                  <div key={step} className="flex flex-col items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 ${
                        index <= currentStep
                          ? "bg-[#e23744] border-[#e23744] text-white"
                          : "bg-white border-[#e8e8e8] text-[#93959f]"
                      }`}
                    >
                      {index < currentStep ? "✓" : index + 1}
                    </div>
                    <span className="text-[9px] text-center text-[#686b78] max-w-10 leading-tight">
                      {formatStatus(step)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Restaurant */}
        <SectionCard
          icon={<Store size={16} className="text-[#e23744]" />}
          title="Restaurant"
        >
          <p className="text-[#3d4152] font-medium">{order.restaurantName}</p>
        </SectionCard>

        {/* Order Items */}
        <SectionCard
          icon={<Receipt size={16} className="text-[#e23744]" />}
          title="Order Items"
        >
          <div className="divide-y divide-[#f0f0f0]">
            {order.items.map((item) => (
              <div
                key={item.itemId}
                className="flex justify-between items-center py-3 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium text-[#3d4152]">
                    {item.name}
                  </p>
                  <span className="inline-block mt-1 px-2.5 py-0.5 text-[10px] bg-[#fdecea] text-[#e23744] rounded-full font-medium">
                    Qty {item.quantity}
                  </span>
                </div>
                <p className="text-sm font-bold text-[#1c1c1c]">
                  ₹{item.price * item.quantity}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Bill Details */}
        <SectionCard
          icon={<Receipt size={16} className="text-[#e23744]" />}
          title="Bill Details"
        >
          <div className="space-y-2.5 text-sm text-[#3d4152]">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{order.subTotal}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span>₹{order.deliveryFee}</span>
            </div>
            <div className="flex justify-between">
              <span>Platform Fee</span>
              <span>₹{order.platformFee}</span>
            </div>
            <div className="h-px bg-[#ebebeb]" />
            <div className="flex justify-between font-bold text-lg text-[#e23744] pt-1">
              <span>Total</span>
              <span>₹{order.totalAmount}</span>
            </div>
          </div>
        </SectionCard>

        {/* Delivery Address */}
        <SectionCard
          icon={<MapPin size={16} className="text-[#e23744]" />}
          title="Delivery Address"
        >
          <p className="text-sm text-[#3d4152]">
            {order.deliveryAddress.formattedAddress}
          </p>
          <p className="text-xs text-[#686b78] mt-2">
            📞 {order.deliveryAddress.mobile}
          </p>
        </SectionCard>

        {/* Rider Details */}
        {order.riderId && (
          <SectionCard
            icon={<Bike size={16} className="text-[#e23744]" />}
            title="Rider Details"
          >
            <div className="space-y-1.5 text-sm text-[#3d4152]">
              {order.riderName !== null && (
                <p>
                  <span className="font-medium">Image:</span>{" "}
                  <img src={order.riderName} alt="" />
                </p>
              )}
              <p>
                <span className="font-medium">Phone:</span> {order.riderPhone}
              </p>
            </div>
          </SectionCard>
        )}

        {/* Payment Info */}
        <SectionCard
          icon={<CreditCard size={16} className="text-[#e23744]" />}
          title="Payment Information"
        >
          <div className="space-y-1.5 text-sm text-[#3d4152]">
            <p>
              <span className="font-medium">Method:</span> {order.paymentMethod}
            </p>
            <p>
              <span className="font-medium">Status:</span>{" "}
              <span className="text-green-600 font-medium capitalize">
                {order.paymentStatus}
              </span>
            </p>
          </div>
        </SectionCard>

        {/* Issue section */}
        {order.status === "delivered" &&
          (existingIssue ? (
            <IssueStatusCard issue={existingIssue} />
          ) : (
            <button
              onClick={() => navigate(`/orders/${order._id}/complaint`)}
              className="w-full flex items-center justify-center gap-2 border border-[#e23744] text-[#e23744] bg-white hover:bg-[#fdecea] transition-colors rounded-2xl py-3.5 text-sm font-semibold"
            >
              <AlertCircle size={15} />
              Report an issue
            </button>
          ))}
      </div>
    </div>
  );
};

// ── Reusable section card ─────────────────────────────────────────────────
const SectionCard = ({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="bg-white rounded-2xl border border-[#e8e8e8] p-5 shadow-sm">
    <h2 className="flex items-center gap-2 text-sm font-semibold text-[#1c1c1c] mb-3">
      {icon}
      {title}
    </h2>
    {children}
  </div>
);
