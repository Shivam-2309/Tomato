import { useState, useEffect } from "react";
import axios from "axios";
import { adminService } from "../main";
import type { IIssue, IRestaurant, IRider } from "../types";

const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

const Admin = () => {
  const [restaurants, setRestaurants] = useState<IRestaurant[]>([]);
  const [riders, setRiders] = useState<IRider[]>([]);
  const [issues, setIssues] = useState<IIssue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<IIssue | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<
    "restaurant" | "rider" | "verify-restaurant" | "verify-rider" | "issues"
  >("restaurant");
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<IRestaurant | null>(null);
  const [selectedRider, setSelectedRider] = useState<IRider | null>(null);
  const [verifying, setVerifying] = useState(false);

  const fetchData = async () => {
    try {
      const { data: restaurantData } = await axios.get(
        `${adminService}/api/v1/admin/restaurant/pending`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      const { data: ridersData } = await axios.get(
        `${adminService}/api/v1/admin/rider/pending`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      const { data: IssueData } = await axios.get(
        `${adminService}/api/v1/issues/admin/all`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );

      setIssues(IssueData.issues);
      setRestaurants(restaurantData.restaurants);
      setRiders(ridersData.riders);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const verifyRestaurant = async (id: string) => {
    setVerifying(true);
    try {
      await axios.get(`${adminService}/api/v1/verify/restaurant/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setRestaurants((prev) => prev.filter((r) => r._id !== id));
      setTab("restaurant");
      setSelectedRestaurant(null);
    } catch (error) {
      console.error("Error verifying restaurant:", error);
    } finally {
      setVerifying(false);
    }
  };

  const verifyRider = async (id: string) => {
    setVerifying(true);
    try {
      await axios.get(
        `${adminService}/api/v1/verify/rider/${id}`,
        authHeader(),
      );
      setRiders((prev) => prev.filter((r) => r._id !== id));
      setTab("rider");
      setSelectedRider(null);
    } catch (error) {
      console.error("Error verifying rider:", error);
    } finally {
      setVerifying(false);
    }
  };

  const approveIssue = async (id: string) => {
    setVerifying(true);
    try {
      await axios.patch(
        `${adminService}/api/v1/issues/admin/${id}/approve`,
        {},
        authHeader(),
      );
      setIssues((prev) => prev.filter((i) => i._id !== id));
      setSelectedIssue(null);
    } catch (error) {
      console.error("Error approving issue:", error);
    } finally {
      setVerifying(false);
    }
  };

  const rejectIssue = async (id: string) => {
    setVerifying(true);
    try {
      await axios.patch(
        `${adminService}/api/v1/issues/admin/${id}/reject`,
        {},
        authHeader(),
      );
      setIssues((prev) => prev.filter((i) => i._id !== id));
      setSelectedIssue(null);
    } catch (error) {
      console.error("Error rejecting issue:", error);
    } finally {
      setVerifying(false);
    }
  };

  const openVerifyRestaurant = (restaurant: any) => {
    setSelectedRestaurant(restaurant);
    setTab("verify-restaurant");
  };

  const openVerifyRider = (rider: any) => {
    setSelectedRider(rider);
    setTab("verify-rider");
  };

  return (
    <div className="min-h-screen bg-white-200 text-zinc-100">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-red-900 px-6 py-4 flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-red-500" />
        <h1 className="text-sm font-semibold tracking-widest uppercase text-zinc-300">
          Admin Panel
        </h1>
        <div className="ml-auto text-xs text-zinc-500 font-mono">
          {restaurants.length} restaurants · {riders.length} riders pending
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 bg-zinc-900 px-6">
        <button
          onClick={() => setTab("restaurant")}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === "restaurant" || tab === "verify-restaurant"
              ? "border-red-500 text-red-400"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Restaurants
          {restaurants.length > 0 && (
            <span className="ml-2 bg-red-500/20 text-red-400 text-xs font-mono px-1.5 py-0.5 rounded">
              {restaurants.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("rider")}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === "rider" || tab === "verify-rider"
              ? "border-red-500 text-red-400"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Riders
          {riders.length > 0 && (
            <span className="ml-2 bg-red-500/20 text-red-400 text-xs font-mono px-1.5 py-0.5 rounded">
              {riders.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("issues")}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === "issues"
              ? "border-red-500 text-red-400"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Issues
          {issues.length > 0 && (
            <span className="ml-2 bg-red-500/20 text-red-400 text-xs font-mono px-1.5 py-0.5 rounded">
              {issues.length}
            </span>
          )}
        </button>
        {tab === "verify-restaurant" && selectedRestaurant && (
          <div className="flex items-center gap-2 ml-2 px-5 py-3 text-sm border-b-2 border-red-500 text-red-400">
            <span className="text-zinc-600">/</span>
            <span className="truncate max-w-40">{selectedRestaurant.name}</span>
          </div>
        )}
        {tab === "verify-rider" && selectedRider && (
          <div className="flex items-center gap-2 ml-2 px-5 py-3 text-sm border-b-2 border-red-500 text-red-400">
            <span className="text-zinc-600">/</span>
            <span className="truncate max-w-40">
              {selectedRider.phoneNumber}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-24 gap-3 text-zinc-500">
            <div className="w-5 h-5 rounded-full border-2 border-zinc-700 border-t-red-500 animate-spin" />
            <span className="text-sm">Loading...</span>
          </div>
        ) : (
          <>
            {/* ── Restaurant List ── */}
            {tab === "restaurant" && (
              <div>
                <p className="text-xs text-black mb-4 uppercase tracking-widest font-mono">
                  Pending approval — {restaurants.length} restaurants
                </p>
                {restaurants.length === 0 ? (
                  <div className="text-center py-20 text-zinc-600 text-sm">
                    No pending restaurants
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {restaurants.map((r) => (
                      <div
                        key={r._id}
                        className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-lg px-5 py-4 hover:border-zinc-700 transition-colors"
                      >
                        <img
                          src={r.image}
                          alt={r.name}
                          className="w-12 h-12 rounded-md object-cover border border-zinc-700 shrink-0"
                          onError={(e) =>
                            (e.currentTarget.src =
                              "https://placehold.co/48x48/27272a/ef4444?text=R")
                          }
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-zinc-100 truncate">
                            {r.name}
                          </p>
                          <p className="text-xs text-zinc-500 truncate mt-0.5">
                            {r.autoLocation?.formattedAddress ?? "No address"}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span
                            className={`text-xs font-mono px-2 py-0.5 rounded ${
                              r.isOpen
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-red-500/10 text-red-400 border border-red-500/20"
                            }`}
                          >
                            {r.isOpen ? "OPEN" : "CLOSED"}
                          </span>
                          <span className="text-xs font-mono text-zinc-500">
                            +{r.phone}
                          </span>
                          <button
                            onClick={() => openVerifyRestaurant(r)}
                            className="text-xs font-medium bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded transition-colors"
                          >
                            Review →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Rider List ── */}
            {tab === "rider" && (
              <div>
                <p className="text-xs text-black mb-4 uppercase tracking-widest font-mono">
                  Pending approval — {riders.length} riders
                </p>
                {riders.length === 0 ? (
                  <div className="text-center py-20 text-zinc-600 text-sm">
                    No pending riders
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {riders.map((r) => (
                      <div
                        key={r._id}
                        className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-lg px-5 py-4 hover:border-zinc-700 transition-colors"
                      >
                        <img
                          src={r.picture}
                          alt="Rider"
                          className="w-12 h-12 rounded-md object-cover border border-zinc-700 shrink-0"
                          onError={(e) =>
                            (e.currentTarget.src =
                              "https://placehold.co/48x48/27272a/ef4444?text=R")
                          }
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-zinc-100 font-mono text-sm">
                            {r.phoneNumber}
                          </p>
                          <p className="text-xs text-zinc-500 mt-0.5 font-mono">
                            DL: {r.drivingLicenseNumber}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span
                            className={`text-xs font-mono px-2 py-0.5 rounded ${
                              r.isAvailable
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }`}
                          >
                            {r.isAvailable ? "AVAILABLE" : "NOT AVAILABLE"}
                          </span>
                          <button
                            onClick={() => openVerifyRider(r)}
                            className="text-xs font-medium bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded transition-colors"
                          >
                            Review →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === "issues" && (
              <div>
                {selectedIssue ? (
                  <div className="max-w-md max-h-md">
                    <button
                      onClick={() => setSelectedIssue(null)}
                      className="text-xs text-zinc-500 hover:text-zinc-300 mb-6 flex items-center gap-1 transition-colors"
                    >
                      ← Back to issues
                    </button>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                      {/* Issue image */}
                      <div className="relative h-48 bg-zinc-800">
                        <img
                          src={selectedIssue.imageUrl}
                          alt="Issue"
                          className="w-full h-full object-cover opacity-80"
                          onError={(e) =>
                            (e.currentTarget.src =
                              "https://placehold.co/700x200/27272a/ef4444?text=No+Image")
                          }
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-zinc-900 via-transparent to-transparent" />
                        <div className="absolute bottom-4 left-5">
                          <h2 className="text-xl font-bold text-white capitalize">
                            {selectedIssue.issueType.replace(/_/g, " ")}
                          </h2>
                          <p className="text-sm text-zinc-400 mt-0.5 font-mono">
                            #{selectedIssue.orderId}
                          </p>
                        </div>
                      </div>

                      {/* Basic details */}
                      <div className="p-5 grid grid-cols-2 gap-4">
                        <Field
                          label="Issue type"
                          value={selectedIssue.issueType.replace(/_/g, " ")}
                        />
                        <Field
                          label="Status"
                          value={selectedIssue.status.replace(/_/g, " ")}
                        />
                        <Field
                          label="Order ID"
                          value={selectedIssue.orderId}
                          mono
                        />
                        <Field
                          label="Customer ID"
                          value={selectedIssue.customerId}
                          mono
                          truncate
                        />
                        <Field
                          label="Reported"
                          value={new Date(
                            selectedIssue.createdAt,
                          ).toLocaleString("en-IN")}
                          className="col-span-2"
                        />
                        <Field
                          label="Description"
                          value={selectedIssue.description}
                          className="col-span-2"
                        />
                      </div>

                      {/* AI result panel */}
                      {selectedIssue.aiResult && (
                        <div className="mx-5 mb-5 bg-[#0d0d14] border border-indigo-900/60 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-4">
                            <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs">
                              ✦
                            </div>
                            <span className="text-xs font-semibold tracking-widest uppercase text-indigo-400 font-mono">
                              AI Analysis Result
                            </span>
                          </div>

                          <div className="space-y-2">
                            <AiRow
                              label="Issue detected"
                              value={
                                selectedIssue.aiResult.issueDetected
                                  ? "Yes"
                                  : "No"
                              }
                            />
                            <AiRow
                              label="Severity"
                              value={selectedIssue.aiResult.severity ?? "—"}
                            />
                            <AiRow
                              label="Confidence"
                              value={
                                selectedIssue.aiResult.confidence != null
                                  ? `${Math.round(selectedIssue.aiResult.confidence)}%`
                                  : "—"
                              }
                              extra={
                                selectedIssue.aiResult.confidence != null ? (
                                  <div className="w-24 h-1 bg-indigo-950 rounded-full overflow-hidden mr-2">
                                    <div
                                      className="h-full bg-indigo-500 rounded-full"
                                      style={{
                                        width: `${Math.round(selectedIssue.aiResult.confidence * 100)}%`,
                                      }}
                                    />
                                  </div>
                                ) : null
                              }
                            />
                            <AiRow
                              label="Recommendation"
                              value={
                                selectedIssue.aiResult.recommendation ?? "—"
                              }
                            />
                          </div>

                          {selectedIssue.aiResult.reason && (
                            <p className="text-xs text-indigo-300 mt-4 pt-4 border-t border-indigo-900/50 leading-relaxed">
                              {selectedIssue.aiResult.reason}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="px-5 pb-5 flex gap-3">
                        <button
                          onClick={() => {
                            approveIssue(selectedIssue._id);
                          }}
                          className="flex items-center gap-2 bg-emerald-400 text-white text-sm font-semibold px-5 py-2.5 rounded-lg"
                        >
                          ✓ Approve issue
                        </button>
                        <button
                          onClick={() => {
                            rejectIssue(selectedIssue._id);
                          }}
                          className="text-sm text-zinc-400 px-4 py-2.5 rounded-lg border border-zinc-700"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-black mb-4 uppercase tracking-widest font-mono">
                      Pending review — {issues.length} issues
                    </p>
                    {issues.length === 0 ? (
                      <div className="text-center py-20 text-zinc-600 text-sm">
                        No pending issues
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {issues.map((issue) => (
                          <div
                            key={issue._id}
                            onClick={() => setSelectedIssue(issue)}
                            className="flex items-start gap-4 bg-zinc-900 border border-zinc-800 rounded-lg px-5 py-4 hover:border-zinc-700 transition-colors cursor-pointer"
                          >
                            <img
                              src={issue.imageUrl}
                              alt="Issue"
                              className="w-14 h-14 rounded-md object-cover border border-zinc-700 shrink-0"
                              onError={(e) =>
                                (e.currentTarget.src =
                                  "https://placehold.co/56x56/27272a/ef4444?text=!")
                              }
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <p className="font-medium text-zinc-100 capitalize">
                                  {issue.issueType.replace(/_/g, " ")}
                                </p>
                                {issue.aiResult?.severity && (
                                  <span
                                    className={`text-xs font-mono px-2 py-0.5 rounded border ${
                                      issue.aiResult.severity === "high"
                                        ? "bg-red-500/10 text-red-400 border-red-500/20"
                                        : issue.aiResult.severity === "medium"
                                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                          : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                                    }`}
                                  >
                                    {issue.aiResult.severity} severity
                                  </span>
                                )}
                                {issue.aiResult?.confidence != null && (
                                  <span className="text-xs font-mono px-2 py-0.5 rounded border bg-zinc-800 text-zinc-400 border-zinc-700">
                                    {issue.aiResult.confidence}%
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-zinc-500 truncate">
                                {issue.description}
                              </p>
                              <p className="text-xs text-zinc-600 font-mono mt-1.5">
                                Order #{issue.orderId} ·{" "}
                                {new Date(issue.createdAt).toLocaleDateString(
                                  "en-IN",
                                )}
                              </p>
                            </div>
                            <button className="text-xs font-medium bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded transition-colors shrink-0 self-center">
                              Review →
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Verify Restaurant ── */}
            {tab === "verify-restaurant" && selectedRestaurant && (
              <div className="max-w-2xl">
                <button
                  onClick={() => {
                    setTab("restaurant");
                    setSelectedRestaurant(null);
                  }}
                  className="text-xs text-zinc-500 hover:text-zinc-300 mb-6 flex items-center gap-1 transition-colors"
                >
                  ← Back to restaurants
                </button>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                  {/* Restaurant image hero */}
                  <div className="relative h-48 bg-zinc-800">
                    <img
                      src={selectedRestaurant.image}
                      alt={selectedRestaurant.name}
                      className="w-full h-full object-cover opacity-80"
                      onError={(e) =>
                        (e.currentTarget.src =
                          "https://placehold.co/700x200/27272a/ef4444?text=No+Image")
                      }
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-zinc-900 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-5">
                      <h2 className="text-xl font-bold text-white">
                        {selectedRestaurant.name}
                      </h2>
                      {selectedRestaurant.description && (
                        <p className="text-sm text-zinc-400 mt-0.5">
                          {selectedRestaurant.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-5 grid grid-cols-2 gap-4">
                    <Field
                      label="Phone"
                      value={`+${selectedRestaurant.phone}`}
                      mono
                    />
                    <Field
                      label="Status"
                      value={selectedRestaurant.isOpen ? "Open" : "Closed"}
                      badge={selectedRestaurant.isOpen ? "green" : "red"}
                    />
                    <Field
                      label="Address"
                      value={
                        selectedRestaurant.autoLocation?.formattedAddress ?? "—"
                      }
                      className="col-span-2"
                    />
                    <Field
                      label="Coordinates"
                      value={
                        selectedRestaurant.autoLocation?.coordinates
                          ? `${selectedRestaurant.autoLocation.coordinates[1].toFixed(5)}, ${selectedRestaurant.autoLocation.coordinates[0].toFixed(5)}`
                          : "—"
                      }
                      mono
                      className="col-span-2"
                    />
                    <Field
                      label="Likes"
                      value={String(selectedRestaurant.likesCount ?? 0)}
                      mono
                    />
                    <Field
                      label="Owner ID"
                      value={selectedRestaurant.ownerId}
                      mono
                      truncate
                    />
                    <Field
                      label="Joined"
                      value={new Date(
                        selectedRestaurant.createdAt,
                      ).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    />
                  </div>

                  {/* Action */}
                  <div className="px-5 pb-5 flex gap-3">
                    <button
                      onClick={() => verifyRestaurant(selectedRestaurant._id)}
                      disabled={verifying}
                      className="flex items-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
                    >
                      {verifying ? (
                        <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      ) : (
                        <svg
                          className="w-4 h-4"
                          viewBox="0 0 16 16"
                          fill="none"
                        >
                          <path
                            d="M8 2L14 5v5c0 2.76-2.69 4.73-6 5C2.69 14.73 2 12.76 2 10V5l6-3z"
                            stroke="currentColor"
                            strokeWidth="1.4"
                          />
                          <path
                            d="M5.5 8l2 2 3-3"
                            stroke="currentColor"
                            strokeWidth="1.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                      Verify Restaurant
                    </button>
                    <button
                      onClick={() => {
                        setTab("restaurant");
                        setSelectedRestaurant(null);
                      }}
                      className="text-sm text-zinc-400 hover:text-zinc-200 px-4 py-2.5 rounded-lg border border-zinc-700 hover:border-zinc-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Verify Rider ── */}
            {tab === "verify-rider" && selectedRider && (
              <div className="max-w-2xl">
                <button
                  onClick={() => {
                    setTab("rider");
                    setSelectedRider(null);
                  }}
                  className="text-xs text-zinc-500 hover:text-zinc-300 mb-6 flex items-center gap-1 transition-colors"
                >
                  ← Back to riders
                </button>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                  {/* Rider hero */}
                  <div className="flex items-center gap-5 p-5 border-b border-zinc-800">
                    <img
                      src={selectedRider.picture}
                      alt="Rider"
                      className="w-20 h-20 rounded-xl object-cover border border-zinc-700 shrink-0"
                      onError={(e) =>
                        (e.currentTarget.src =
                          "https://placehold.co/80x80/27272a/ef4444?text=R")
                      }
                    />
                    <div>
                      <h2 className="text-xl font-bold text-white font-mono">
                        {selectedRider.phoneNumber}
                      </h2>
                      <p className="text-xs text-zinc-500 mt-1 font-mono">
                        {selectedRider.userId}
                      </p>
                      <span
                        className={`inline-block mt-2 text-xs font-mono px-2 py-0.5 rounded ${
                          selectedRider.isAvailable
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {selectedRider.isAvailable
                          ? "AVAILABLE"
                          : "NOT AVAILABLE"}
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-5 grid grid-cols-2 gap-4">
                    <Field
                      label="Phone"
                      value={selectedRider.phoneNumber}
                      mono
                    />
                    <Field
                      label="Aadhaar"
                      value={`••••••••${selectedRider.aadharNumber.slice(-4)}`}
                      mono
                    />
                    <Field
                      label="Driving License"
                      value={selectedRider.drivingLicenseNumber}
                      mono
                      className="col-span-2"
                    />
                    <Field
                      label="Last Active"
                      value={new Date(
                        selectedRider.lastActiveAt,
                      ).toLocaleString("en-IN")}
                    />
                    <Field
                      label="Joined"
                      value={new Date(
                        selectedRider.createdAt,
                      ).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    />
                    {selectedRider.location?.coordinates && (
                      <Field
                        label="Last Location"
                        value={`${selectedRider.location.coordinates[1].toFixed(5)}, ${selectedRider.location.coordinates[0].toFixed(5)}`}
                        mono
                        className="col-span-2"
                      />
                    )}
                  </div>

                  {/* Action */}
                  <div className="px-5 pb-5 flex gap-3">
                    <button
                      onClick={() => verifyRider(selectedRider._id)}
                      disabled={verifying}
                      className="flex items-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
                    >
                      {verifying ? (
                        <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      ) : (
                        <svg
                          className="w-4 h-4"
                          viewBox="0 0 16 16"
                          fill="none"
                        >
                          <path
                            d="M8 2L14 5v5c0 2.76-2.69 4.73-6 5C2.69 14.73 2 12.76 2 10V5l6-3z"
                            stroke="currentColor"
                            strokeWidth="1.4"
                          />
                          <path
                            d="M5.5 8l2 2 3-3"
                            stroke="currentColor"
                            strokeWidth="1.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                      Verify Rider
                    </button>
                    <button
                      onClick={() => {
                        setTab("rider");
                        setSelectedRider(null);
                      }}
                      className="text-sm text-zinc-400 hover:text-zinc-200 px-4 py-2.5 rounded-lg border border-zinc-700 hover:border-zinc-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const Field = ({
  label,
  value,
  mono,
  badge,
  truncate,
  className = "",
}: {
  label: string;
  value: string;
  mono?: boolean;
  badge?: "green" | "red";
  truncate?: boolean;
  className?: string;
}) => (
  <div className={className}>
    <p className="text-xs text-zinc-600 uppercase tracking-widest font-mono mb-1">
      {label}
    </p>
    {badge ? (
      <span
        className={`text-xs font-mono px-2 py-0.5 rounded ${
          badge === "green"
            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            : "bg-red-500/10 text-red-400 border border-red-500/20"
        }`}
      >
        {value}
      </span>
    ) : (
      <p
        className={`text-sm text-zinc-200 ${mono ? "font-mono" : ""} ${
          truncate ? "truncate" : ""
        }`}
      >
        {value}
      </p>
    )}
  </div>
);

const AiRow = ({
  label,
  value,
  extra,
}: {
  label: string;
  value: string;
  extra?: React.ReactNode;
}) => (
  <div className="flex items-center justify-between py-1.5 border-b border-indigo-900/30 last:border-0">
    <span className="text-xs text-indigo-500 font-mono">{label}</span>
    <div className="flex items-center">
      {extra}
      <span className="text-xs text-indigo-200 font-mono capitalize">
        {value}
      </span>
    </div>
  </div>
);

export default Admin;
