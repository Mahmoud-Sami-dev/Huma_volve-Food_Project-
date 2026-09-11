const { summarizeMeal } = require("../services/summarizeAi.service");

exports.summarize = async (req, res) => {
  try {
    // Missing API key
    if (!process.env.GEMINI_API) {
      return res
        .status(500)
        .json({ error: "GEMINI_API environment variable is not set." });
    }

    const { mealName, mealDescription } = req.body || {};

    // Missing meal name
    if (!mealName || typeof mealName !== "string" || mealName.trim() === "") {
      return res.status(400).json({
        error: "Missing meal name.",
      });
    }

    // Missing meal description
    if (
      !mealDescription ||
      typeof mealDescription !== "string" ||
      mealDescription.trim() === ""
    ) {
      return res.status(400).json({ error: "Missing meal description." });
    }

    // Very long meal name
    if (mealName.length > 200) {
      return res.status(400).json({
        error: "Meal name is too long.",
      });
    }

    // Very long description
    if (mealDescription.length > 2000) {
      return res.status(400).json({
        error: "Very long description. Please keep it under 2000 characters.",
      });
    }

    const result = await summarizeMeal(mealName.trim(), mealDescription.trim());

    return res.status(200).json({
      success: true,
      summary: result,
    });
  } catch (error) {
    // Message returned by Gemini API
    const errorMsg = (error.message || "").toLowerCase();

    // Timeout Error Catch
    if (error.message === "TIMEOUT") {
      return res
        .status(504)
        .json({ error: "Request timeout. Gemini took too long to respond." });
    }

    // Invalid API key
    if (
      errorMsg.includes("api key") ||
      errorMsg.includes("invalid") ||
      errorMsg.includes("403")
    ) {
      return res.status(401).json({ error: "Invalid API key." });
    }

    // Rate limit exceeded
    if (
      errorMsg.includes("429") ||
      errorMsg.includes("rate limit") ||
      errorMsg.includes("too many requests") ||
      errorMsg.includes("quota")
    ) {
      return res
        .status(429)
        .json({ error: "Rate limit exceeded. Please try again later." });
    }

    // Gemini API service unavailable
    if (
      errorMsg.includes("503") ||
      errorMsg.includes("service unavailable") ||
      errorMsg.includes("unavailable") ||
      errorMsg.includes("overloaded")
    ) {
      return res.status(503).json({
        error: "Gemini is currently unavailable. Please try again later.",
      });
    }

    // Other errors
    return res
      .status(500)
      .json({ error: "An unexpected error occurred.", error: error.message });
  }
};
