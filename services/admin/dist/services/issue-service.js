import Issue from "../models/Issue.js";
import { IssueStatus } from "../enums/issue-status.js";
export default class IssueService {
    static async createIssue(data) {
        const { orderId, customerId, issueType, description, imageUrl } = data;
        if (!orderId || !customerId || !issueType || !description || !imageUrl) {
            throw new Error("Missing required fields");
        }
        const existing = await Issue.findOne({ orderId, customerId });
        if (existing) {
            throw new Error("Issue already raised for this order");
        }
        const issue = await Issue.create({
            orderId,
            customerId,
            issueType,
            description,
            imageUrl,
            status: IssueStatus.AI_ANALYSIS_PENDING,
        });
        return issue;
    }
}
