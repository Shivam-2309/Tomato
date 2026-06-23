export const analyzeIssue = async (imageUrl, description) => {
    // Mock AI for now
    const confidence = Math.floor(Math.random() * 100);
    return {
        issueDetected: confidence > 40,
        confidence,
        severity: confidence > 80 ? "high" : confidence > 50 ? "medium" : "low",
        reason: `Mock analysis of image and description: ${description}`,
        recommendation: confidence > 80 ? "Approve issue" : "Requires manual review",
    };
};
