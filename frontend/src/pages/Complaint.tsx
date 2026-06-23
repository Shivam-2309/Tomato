import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { adminService } from "../main";

const IssueType = {
  BURNT_FOOD: "burnt_food",
  UNDERCOOKED_FOOD: "undercooked_food",
  MISSING_ITEM: "missing_item",
  PACKAGING_DAMAGE: "packaging_damage",
  OTHER: "other",
} as const;
type IssueStatusType = (typeof IssueType)[keyof typeof IssueType];

const ISSUE_TYPES = [
  {
    value: IssueType.BURNT_FOOD,
    label: "Burnt food",
    emoji: "🔥",
    span: false,
  },
  {
    value: IssueType.UNDERCOOKED_FOOD,
    label: "Undercooked food",
    emoji: "🥩",
    span: false,
  },
  {
    value: IssueType.MISSING_ITEM,
    label: "Missing item",
    emoji: "📦",
    span: false,
  },
  {
    value: IssueType.PACKAGING_DAMAGE,
    label: "Packaging damage",
    emoji: "💢",
    span: false,
  },
  { value: IssueType.OTHER, label: "Something else", emoji: "💬", span: true },
] as const;

const Complaint = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [issueType, setIssueType] = useState<IssueStatusType | null>(null);
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImage(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!issueType || !description.trim() || !image) {
      setError("Please fill in all fields and attach a photo.");
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("orderId", id ?? "");
      formData.append("issueType", issueType);
      formData.append("description", description.trim());
      formData.append("file", image);

      await axios.post(`${adminService}/api/v1/issues`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      // Navigate after successful submission
      navigate(`/orders/${id}`);
    } catch (err) {
      setError("Something went wrong. Please try again.");
      console.error(err);
      setSubmitting(false);
    }
  };

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col items-center px-4 py-10">
      {/* Header */}
      <div className="text-center mb-7">
        <div className="w-11 h-11 bg-[#fdecea] border border-[#f5c6c2] rounded-xl flex items-center justify-center text-lg mx-auto mb-3">
          🚨
        </div>
        <h1 className="text-lg font-bold text-[#1c1c1c] tracking-tight">
          Report an issue
        </h1>
        <p className="text-xs text-[#686b78] mt-1">
          Tell us what went wrong with your order
        </p>
      </div>

      <div className="w-full max-w-sm bg-white border border-[#e8e8e8] rounded-2xl p-5 flex flex-col gap-5 shadow-sm">
        {/* Issue type */}
        <div className="flex flex-col gap-2.5">
          <span className="text-[10px] font-semibold text-[#93959f] uppercase tracking-widest">
            What went wrong?
          </span>
          <div className="grid grid-cols-2 gap-2">
            {ISSUE_TYPES.map(({ value, label, emoji, span }) => (
              <button
                key={value}
                onClick={() => setIssueType(value)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-left transition-all ${
                  span ? "col-span-2" : ""
                } ${
                  issueType === value
                    ? "border-[#e23744] bg-[#fdecea]"
                    : "border-[#e8e8e8] bg-[#f8f8f8] hover:border-[#e23744]/40"
                }`}
              >
                <span className="text-sm w-5 text-center shrink-0">
                  {emoji}
                </span>
                <span
                  className={`text-xs font-medium ${
                    issueType === value ? "text-[#e23744]" : "text-[#3d4152]"
                  }`}
                >
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-[#ebebeb]" />

        {/* Description */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-semibold text-[#93959f] uppercase tracking-widest">
            Describe what happened
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. The burger was completely burnt and the fries were missing..."
            rows={3}
            className="bg-[#f8f8f8] border border-[#e8e8e8] rounded-xl px-3 py-2.5 text-xs text-[#3d4152] placeholder-[#93959f] outline-none focus:border-[#e23744] resize-none leading-relaxed transition-colors"
          />
        </div>

        {/* Photo upload */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-semibold text-[#93959f] uppercase tracking-widest">
            Attach a photo
          </span>
          {preview ? (
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-36 object-cover rounded-xl border border-[#e8e8e8]"
              />
              <button
                onClick={clearImage}
                className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-[#e23744] text-xs px-2 py-1 rounded-md border border-[#e8e8e8] font-medium"
              >
                ✕ Remove
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="border border-dashed border-[#d4d5d9] rounded-xl py-6 flex flex-col items-center gap-1.5 hover:border-[#e23744] hover:bg-[#fdecea]/30 transition-all bg-[#f8f8f8]"
            >
              <span className="text-2xl">📷</span>
              <span className="text-xs text-[#686b78]">
                Tap to upload a photo
              </span>
              <span className="text-[10px] text-[#93959f]">
                JPG, PNG up to 10MB
              </span>
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImage}
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-[#e23744] bg-[#fdecea] border border-[#f5c6c2] rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-[#e23744] hover:bg-[#c0392b] disabled:bg-[#e8e8e8] disabled:text-[#93959f] disabled:cursor-not-allowed text-white text-sm font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit report"
          )}
        </button>

        <p className="text-[10px] text-[#93959f] text-right font-mono -mt-3">
          Order #{id}
        </p>
      </div>
    </div>
  );
};

export default Complaint;
