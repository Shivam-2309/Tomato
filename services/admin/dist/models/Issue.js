import mongoose, { Schema } from "mongoose";
import { IssueType } from "../enums/issue-type.js";
import { IssueStatus } from "../enums/issue-status.js";
const schema = new Schema({
    orderId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "Order",
    },
    customerId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "User",
    },
    issueType: {
        type: String,
        enum: Object.values(IssueType),
        required: true,
    },
    status: {
        type: String,
        enum: Object.values(IssueStatus),
        default: IssueStatus.AI_ANALYSIS_PENDING,
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000,
    },
    imageUrl: {
        type: String,
        required: true,
    },
    aiResult: {
        issueDetected: Boolean,
        confidence: Number,
        severity: {
            type: String,
            enum: ["low", "medium", "high"],
        },
        reason: String,
        recommendation: String,
    },
}, {
    timestamps: true,
});
export default mongoose.model("Issue", schema);
