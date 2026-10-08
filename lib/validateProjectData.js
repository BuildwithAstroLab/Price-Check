/**
 * lib/validateProjectData.js
 *
 * Defensive validation for whatever Gemini hands back. Even with a response
 * schema, we never trust an external API blindly. If a field is missing or
 * of the wrong shape, we fall back to a safe default rather than throwing.
 */

const {
  CATEGORIES,
  DEFAULTS,
  CURRENCY,
  CURRENCIES,
} = require("../config/pricing");

const VALID_EXPERIENCE = [
  "starting_out",
  "intermediate",
  "professional",
  "expert",
];
const VALID_COMPLEXITY = ["simple", "medium", "complex", "very_complex"];
const VALID_CLIENT_TYPE = [
  "individual",
  "startup",
  "small_business",
  "corporate",
  "nonprofit",
];
const VALID_DEADLINE = [
  "flexible",
  "7_plus_days",
  "3_6_days",
  "1_2_days",
  "same_day_rush",
];
const VALID_CONFIDENCE = ["low", "medium", "high"];
const FALLBACK_REASON = "Priced based on the scope you described.";

function pickEnum(value, validValues, fallback) {
  return typeof value === "string" && validValues.includes(value)
    ? value
    : fallback;
}

function validateSelections({ experienceLevel, deadline } = {}) {
  return {
    experience: pickEnum(
      experienceLevel,
      VALID_EXPERIENCE,
      DEFAULTS.experience,
    ),
    deadline: pickEnum(deadline, VALID_DEADLINE, DEFAULTS.deadline),
  };
}

function validateProjectData(raw) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Gemini returned an empty or non-object response.");
  }

  const service =
    typeof raw.service === "string" && CATEGORIES[raw.service]
      ? raw.service
      : DEFAULTS.service;
  const projectType =
    typeof raw.projectType === "string" && raw.projectType.trim().length > 0
      ? raw.projectType.trim()
      : "General Project";
  const experience = pickEnum(
    raw.experience,
    VALID_EXPERIENCE,
    DEFAULTS.experience,
  );
  const complexity = pickEnum(
    raw.complexity,
    VALID_COMPLEXITY,
    DEFAULTS.complexity,
  );
  const clientType = pickEnum(
    raw.clientType,
    VALID_CLIENT_TYPE,
    DEFAULTS.clientType,
  );
  const deadline = pickEnum(raw.deadline, VALID_DEADLINE, DEFAULTS.deadline);
  const confidence = pickEnum(raw.confidence, VALID_CONFIDENCE, "medium");

  const duration =
    typeof raw.duration === "string"
      ? raw.duration
      : String(raw.duration ?? "");

  const deliverables = Array.isArray(raw.deliverables)
    ? raw.deliverables.filter(
        (item) => typeof item === "string" && item.trim().length > 0,
      )
    : [];

  const revisions =
    typeof raw.revisions === "number" &&
    Number.isFinite(raw.revisions) &&
    raw.revisions >= 0
      ? Math.round(raw.revisions)
      : DEFAULTS.revisions;

  const missingInformation = Array.isArray(raw.missingInformation)
    ? raw.missingInformation.filter(
        (item) => typeof item === "string" && item.trim().length > 0,
      )
    : [];

  return {
    service,
    projectType,
    experience,
    complexity,
    clientType,
    duration,
    deliverables,
    deadline,
    revisions,
    missingInformation,
    confidence,
  };
}

function validateAdviceData(raw) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Gemini returned an empty or non-object advice response.");
  }

  const reasons = Array.isArray(raw.reasons)
    ? raw.reasons
        .filter((item) => typeof item === "string" && item.trim().length > 0)
        .slice(0, 5)
    : [];

  const advice = typeof raw.advice === "string" ? raw.advice.trim() : "";
  const negotiationTip =
    typeof raw.negotiationTip === "string" ? raw.negotiationTip.trim() : "";

  if (reasons.length < 3 || !advice || !negotiationTip) {
    throw new Error("Gemini returned incomplete pricing advice.");
  }

  return {
    reasons,
    advice,
    negotiationTip,
  };
}

function createFallbackAdviceData() {
  return {
    reasons: [FALLBACK_REASON],
    advice:
      "Use this range as your starting point and adjust based on your experience and the client's budget.",
    negotiationTip:
      "If a client pushes back, consider trimming scope rather than cutting price.",
  };
}

function validateCurrency(value) {
  return CURRENCIES[value] || CURRENCY;
}

function convertPricingResult(pricingResult, currencyCode) {
  const currency = validateCurrency(currencyCode);
  if (currency.code === CURRENCY.code) return { ...pricingResult, currency };
  const convert = (value) => Math.round(value * currency.fromNGN);
  return {
    ...pricingResult,
    currency,
    recommendedQuote: convert(pricingResult.recommendedQuote),
    fairRange: {
      min: convert(pricingResult.fairRange.min),
      max: convert(pricingResult.fairRange.max),
    },
  };
}

function validatePricingData(raw, currencyCode = CURRENCY.code) {
  if (!raw || typeof raw !== "object" || !CATEGORIES[raw.category]) {
    throw new Error("Gemini returned an invalid pricing category.");
  }

  const category = CATEGORIES[raw.category];
  const currency = validateCurrency(currencyCode);
  const convertedMinimum = Math.round(category.minimumPrice * currency.fromNGN);
  const convertedMaximum = Math.round(category.maximumPrice * currency.fromNGN);
  const recommendedQuote = raw.recommendedQuote;
  const min = raw.fairRange?.min;
  const max = raw.fairRange?.max;
  const validAmount = (value) =>
    typeof value === "number" && Number.isFinite(value) && value >= 0;
  const roundAmount = (value) =>
    currency.code === CURRENCY.code
      ? Math.round(value / 1000) * 1000
      : Math.round(value);

  if (
    !validAmount(recommendedQuote) ||
    !validAmount(min) ||
    !validAmount(max) ||
    min > recommendedQuote ||
    recommendedQuote > max ||
    min < convertedMinimum ||
    max > convertedMaximum
  ) {
    throw new Error("Gemini returned an invalid pricing range.");
  }

  return {
    currency,
    category: raw.category,
    recommendedQuote: roundAmount(recommendedQuote),
    fairRange: {
      min: roundAmount(min),
      max: roundAmount(max),
    },
    breakdown: {
      source: "gemini",
      reasoning: typeof raw.reasoning === "string" ? raw.reasoning.trim() : "",
    },
  };
}

module.exports = {
  validateProjectData,
  validateAdviceData,
  createFallbackAdviceData,
  validatePricingData,
  validateCurrency,
  convertPricingResult,
  validateSelections,
  VALID_EXPERIENCE,
  VALID_DEADLINE,
};
