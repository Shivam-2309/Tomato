import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
export const analyzeIssue = async (imageUrl, description) => {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
        });
        const imageResponse = await axios.get(imageUrl, {
            responseType: "arraybuffer",
        });
        const base64Image = Buffer.from(imageResponse.data).toString("base64");
        const prompt = `
You are an AI food quality inspector.

Customer complaint:
"${description}"

Analyze the food image and determine if the complaint appears valid.

Return ONLY valid JSON.

Example:

{
  "issueDetected": true,
  "confidence": 92,
  "severity": "high",
  "reason": "Visible burn marks on food",
  "recommendation": "Approve complaint"
}

Rules:
- confidence must be between 0 and 100
- severity must be one of: low, medium, high
- return ONLY JSON
`;
        console.log("SENDING TO GEMINI");
        const result = await model.generateContent([
            {
                inlineData: {
                    data: base64Image,
                    mimeType: "image/jpeg",
                },
            },
            prompt,
        ]);
        const text = result.response.text();
        console.log("RAW GEMINI RESPONSE:");
        console.log(text);
        const cleaned = text
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();
        return JSON.parse(cleaned);
    }
    catch (error) {
        console.error("Gemini analysis failed:", error);
        return {
            issueDetected: false,
            confidence: 0,
            severity: "low",
            reason: "AI analysis failed",
            recommendation: "Manual review required",
        };
    }
};
