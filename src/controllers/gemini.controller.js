const { summarizeMeal } = require('../services/summarizeAi.service');

exports.summarize = async (req, res) => {
  try {
    if (!process.env.GEMINI_API) {
      return res.status(503).json({
        success: false,
        error: 'Gemini AI is not configured on this server.'
      });
    }

    const { mealName, mealDescription } = req.body || {};

    if (typeof mealName !== 'string' || !mealName.trim()) {
      return res.status(400).json({ success: false, error: 'Missing meal name.' });
    }

    if (typeof mealDescription !== 'string' || !mealDescription.trim()) {
      return res.status(400).json({ success: false, error: 'Missing meal description.' });
    }

    if (mealName.trim().length > 200) {
      return res.status(400).json({ success: false, error: 'Meal name is too long.' });
    }

    if (mealDescription.trim().length > 2000) {
      return res.status(400).json({
        success: false,
        error: 'Very long description. Please keep it under 2000 characters.'
      });
    }

    const summary = await summarizeMeal(mealName.trim(), mealDescription.trim());
    return res.status(200).json({ success: true, summary });
  } catch (error) {
    const errorMsg = String(error.message || '').toLowerCase();

    if (error.message === 'TIMEOUT') {
      return res.status(504).json({
        success: false,
        error: 'Request timeout. Gemini took too long to respond.'
      });
    }

    if (errorMsg.includes('api key') || errorMsg.includes('invalid') || errorMsg.includes('403')) {
      return res.status(401).json({ success: false, error: 'Invalid API key.' });
    }

    if (errorMsg.includes('429') || errorMsg.includes('rate limit') || errorMsg.includes('too many requests') || errorMsg.includes('quota')) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Please try again later.'
      });
    }

    if (errorMsg.includes('503') || errorMsg.includes('service unavailable') || errorMsg.includes('unavailable') || errorMsg.includes('overloaded')) {
      return res.status(503).json({
        success: false,
        error: 'Gemini is currently unavailable. Please try again later.'
      });
    }

    console.error('Gemini error:', error);
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred.'
    });
  }
};
