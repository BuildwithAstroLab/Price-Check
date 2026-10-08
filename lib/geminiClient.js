/**
 * lib/geminiClient.js
 *
 * Wraps all calls to Gemini. Gemini is used for two things only:
 *   1. Extracting structured project details out of free-text descriptions.
 *   2. Writing short human-readable reasons/advice AFTER we already know
 *      the calculated price.
 * Gemini never invents the price itself — see lib/pricingEngine.js.
 */

const { GoogleGenAI } = require("@google/genai");
const { CATEGORIES } = require("../config/pricing");

const MODEL_NAME = "gemini-3.5-flash-lite";
const ADVICE_MODEL_NAME = "gemini-3.5-flash-lite";
const MAX_TRANSIENT_RETRIES = 2;

let client = null;
function getClient() {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set in the environment.");
    }
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

function isTransientGeminiError(error) {
  const code = Number(error?.status || error?.code || error?.statusCode);
  if ([429, 500, 502, 503, 504].includes(code)) return true;
  const str = String(error?.status || error?.message || error?.code || "");
  return /429|500|502|503|504|RESOURCE_EXHAUSTED|UNAVAILABLE|DEADLINE_EXCEEDED/i.test(
    str,
  );
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function generateContentWithRetry(ai, request) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await ai.models.generateContent(request);
    } catch (error) {
      if (!isTransientGeminiError(error) || attempt >= MAX_TRANSIENT_RETRIES) {
        throw error;
      }
      await wait(1000 * (attempt + 1));
    }
  }
}

const SERVICE_CATEGORY_NAMES = Object.keys(CATEGORIES);

const EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    service: { type: "string", enum: SERVICE_CATEGORY_NAMES },
    projectType: { type: "string" },
    complexity: {
      type: "string",
      enum: ["simple", "medium", "complex", "very_complex"],
    },
    clientType: {
      type: "string",
      enum: [
        "individual",
        "startup",
        "small_business",
        "corporate",
        "nonprofit",
      ],
    },
    duration: { type: "string" },
    deliverables: {
      type: "array",
      items: { type: "string" },
    },
    revisions: { type: "integer" },
    missingInformation: {
      type: "array",
      items: { type: "string" },
    },
    confidence: {
      type: "string",
      enum: ["low", "medium", "high"],
    },
  },
  required: [
    "service",
    "projectType",
    "complexity",
    "clientType",
    "duration",
    "deliverables",
    "revisions",
    "missingInformation",
    "confidence",
  ],
};

const ADVICE_SCHEMA = {
  type: "object",
  properties: {
    reasons: {
      type: "array",
      items: { type: "string" },
      minItems: 3,
      maxItems: 5,
    },
    advice: { type: "string" },
    negotiationTip: { type: "string" },
  },
  required: ["reasons", "advice", "negotiationTip"],
};

const EXTRACTION_SYSTEM_PROMPT = `You are a pricing intake assistant for PriceCheck, a tool used by African freelancers and small service providers.

Your ONLY job is to read a free-text project description and extract structured facts about it. You do not calculate or suggest a price. Never invent specific numbers (durations, deliverable counts, revision counts) that are not stated or clearly implied in the text — if something is not mentioned, use a sensible neutral default and list it under "missingInformation" instead of guessing confidently.

Valid service categories are exactly: ${SERVICE_CATEGORY_NAMES.join(", ")}. Pick the closest match.

Do not infer or return an experience level or deadline. Those are explicitly selected by the person requesting the estimate.

Be conservative and honest. If the description is vague, set "confidence" to "low" and populate "missingInformation" with what would help you understand the scope better.`;

const ADVICE_SYSTEM_PROMPT = `You are a pricing coach for PriceCheck, helping African freelancers and small service providers feel confident quoting clients.

You will be given the structured project details and a price that has ALREADY been calculated by a deterministic pricing engine. Do not change or restate the price as if you calculated it — just explain it.

Write:
- "reasons": 3 to 5 short, concrete bullet-style reasons (no leading dashes or numbers, just the text) that explain why the price lands where it does, grounded in the specific project details given.
- "advice": one short, practical paragraph (2-3 sentences) telling the freelancer how to use this quote in a real conversation with a client.
- "negotiationTip": one short, actionable sentence for handling pushback on the price.

Keep the tone practical, direct, and encouraging. No fluff, no generic filler, no emojis.`;

async function extractProjectDetails(description) {
  const ai = getClient();

  const response = await generateContentWithRetry(ai, {
    model: MODEL_NAME,
    contents: [
      {
        role: "user",
        parts: [{ text: description }],
      },
    ],
    config: {
      systemInstruction: EXTRACTION_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: EXTRACTION_SCHEMA,
      temperature: 0.2,
    },
  });

  const text = String(response.text || "").trim();
  const cleanJson = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  return JSON.parse(cleanJson);
}

async function generateAdvice({ projectData, pricingResult }) {
  const ai = getClient();

  const contextPayload = {
    project: projectData,
    calculatedPricing: {
      currency: pricingResult.currency.symbol,
      recommendedQuote: pricingResult.recommendedQuote,
      fairRange: pricingResult.fairRange,
      category: pricingResult.category,
    },
  };

  const response = await generateContentWithRetry(ai, {
    model: ADVICE_MODEL_NAME,
    contents: [
      {
        role: "user",
        parts: [{ text: JSON.stringify(contextPayload) }],
      },
    ],
    config: {
      systemInstruction: ADVICE_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: ADVICE_SCHEMA,
      temperature: 0.4,
    },
  });

  const text = String(response.text || "").trim();
  const cleanJson = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  return JSON.parse(cleanJson);
}

module.exports = {
  extractProjectDetails,
  generateAdvice,
  SERVICE_CATEGORY_NAMES,
};
