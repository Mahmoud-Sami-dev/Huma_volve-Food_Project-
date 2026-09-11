import { describe, it, expect, vi, beforeEach } from "vitest";

process.env.GEMINI_API = "test-api-key";

const mockGenerateContent = vi.hoisted(() => vi.fn());

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    constructor() {
      this.models = {
        generateContent: mockGenerateContent,
      };
    }
  },
}));

import service from "../src/services/summarizeAi.service.js";

const { summarizeMeal } = service;

describe("summarizeMeal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return the AI generated summary", async () => {
    // Mock the AI response
    mockGenerateContent.mockResolvedValue({
      text: "This is a delicious meal with fresh ingredients.",
    });

    // Call the summarizeMeal function
    const result = await summarizeMeal(
      "Grilled Chicken",
      "Grilled chicken served with rice and vegetables.",
    );

    // Verify that the AI generated summary is returned
    expect(result).toBe("This is a delicious meal with fresh ingredients.");

    // Verify that the AI generateContent function was called
    expect(mockGenerateContent).toHaveBeenCalledOnce();

    // Verify that the correct model was used
    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gemini-3.5-flash",
      }),
    );

    // Verify that the correct prompt was used
    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        contents: expect.stringContaining(
          "Grilled chicken served with rice and vegetables.",
        ),
      }),
    );
  });

  it("should throw EMPTY_AI_RESPONSE when Gemini returns empty text", async () => {
    mockGenerateContent.mockResolvedValue({
      text: "",
    });

    await expect(
      summarizeMeal(
        "Creamy Pasta",
        "Pasta with cream sauce and parmesan cheese.",
      ),
    ).rejects.toThrow("EMPTY_AI_RESPONSE");
  });

  it("should forward Gemini API errors", async () => {
    mockGenerateContent.mockRejectedValue(new Error("429 limit exceeded"));

    await expect(
      summarizeMeal(
        "Spicy Tacos",
        "Tacos filled with spicy beef, lettuce, and cheese.",
      ),
    ).rejects.toThrow(new Error("429 limit exceeded"));
  });

  it("should trim the returned summary", async () => {
    mockGenerateContent.mockResolvedValue({
      text: "   A delightful meal with a perfect blend of flavors.   ",
    });

    const result = await summarizeMeal(
      "Spicy Tacos",
      "Tacos filled with spicy beef, lettuce, and cheese.",
    );

    expect(result).toBe("A delightful meal with a perfect blend of flavors.");
  });

  it("should throw TIMEOUT error if Gemini takes too long", async () => {
    // Simulate a long delay in the AI response
    mockGenerateContent.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              text: "This is a delayed response.",
            });
          }, 15000); // 15 seconds delay
        }),
    );

    await expect(
      summarizeMeal(
        "Spicy Tacos",
        "Tacos filled with spicy beef, lettuce, and cheese.",
      ),
    ).rejects.toThrow("TIMEOUT");
  }, 12000);
});
