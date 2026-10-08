/**
 * config/pricing.js
 *
 * All pricing data lives here so non-developers can safely tune PriceCheck's
 * estimates without touching any app logic. Every value is in Nigerian Naira
 * (NGN) and is an MVP estimate, NOT an official market rate.
 *
 * -----------------------------------------------------------------------
 * HOW TO EDIT
 * -----------------------------------------------------------------------
 * 1. To change a category's baseline, edit CATEGORIES[<name>].basePrice,
 *    minimumPrice, or maximumPrice.
 * 2. To change how much an attribute (experience, complexity, etc.) moves
 *    the price, edit the matching multiplier in MODIFIERS.
 * 3. To add a brand-new service category, copy an existing block inside
 *    CATEGORIES and give it a unique key.
 * 4. Nothing outside this file needs to change when you update numbers here.
 * -----------------------------------------------------------------------
 */

const CATEGORIES = {
  Photography: { basePrice: 60000, minimumPrice: 25000, maximumPrice: 600000 },
  Videography: {
    basePrice: 120000,
    minimumPrice: 50000,
    maximumPrice: 1200000,
  },
  "Video Editing": {
    basePrice: 45000,
    minimumPrice: 15000,
    maximumPrice: 400000,
  },
  "Graphic Design": {
    basePrice: 30000,
    minimumPrice: 10000,
    maximumPrice: 300000,
  },
  "Brand Identity": {
    basePrice: 150000,
    minimumPrice: 60000,
    maximumPrice: 1500000,
  },
  "UI/UX Design": {
    basePrice: 180000,
    minimumPrice: 70000,
    maximumPrice: 2000000,
  },
  "Website Development": {
    basePrice: 250000,
    minimumPrice: 80000,
    maximumPrice: 3000000,
  },
  "Social Media Management": {
    basePrice: 80000,
    minimumPrice: 30000,
    maximumPrice: 500000,
  },
  Copywriting: { basePrice: 35000, minimumPrice: 10000, maximumPrice: 300000 },
  Consulting: { basePrice: 50000, minimumPrice: 20000, maximumPrice: 500000 },
};

/**
 * Every modifier is a multiplier applied to the base price.
 * 1.0 = no change. Values below 1.0 reduce the estimate,
 * values above 1.0 increase it.
 */
const MODIFIERS = {
  experience: {
    starting_out: 0.75,
    intermediate: 1.0,
    professional: 1.2,
    expert: 1.45,
  },

  complexity: {
    simple: 0.8,
    medium: 1.0,
    complex: 1.35,
    very_complex: 1.7,
  },

  deadline: {
    flexible: 0.95,
    "7_plus_days": 0.95,
    "3_6_days": 1.0,
    "1_2_days": 1.2,
    same_day_rush: 1.5,
  },

  clientType: {
    individual: 0.9,
    startup: 1.0,
    small_business: 1.1,
    corporate: 1.4,
    nonprofit: 0.85,
  },

  // Applied per-unit relative to a baseline count of 1.
  // The final multiplier is capped to avoid runaway estimates.
  deliverables: {
    unitIncrement: 0.01, // +1% per extra deliverable unit above baseline
    baselineUnits: 20,
    cap: 2.0,
  },

  // Applied per-hour relative to a baseline duration of 1 hour.
  duration: {
    unitIncrement: 0.05, // +5% per extra hour above baseline
    baselineHours: 1,
    cap: 2.0,
  },

  revisions: {
    unitIncrement: 0.03, // +3% per revision above the included baseline
    includedRevisions: 1,
    cap: 1.5,
  },
};

// Fallback values used whenever Gemini returns a field we don't recognize,
// or omits it entirely. Keeps the calculator deterministic and safe.
const DEFAULTS = {
  service: "Consulting",
  experience: "professional",
  complexity: "medium",
  deadline: "3_6_days",
  clientType: "startup",
  durationHours: 1,
  deliverableUnits: 1,
  revisions: 1,
};

const CURRENCY = {
  code: "NGN",
  symbol: "₦",
};

// Indicative MVP conversion rates from NGN. Replace with live rates before
// treating estimates as a financial or accounting source.
const CURRENCIES = {
  NGN: { code: "NGN", symbol: "₦", locale: "en-NG", fromNGN: 1 },
  USD: { code: "USD", symbol: "$", locale: "en-US", fromNGN: 0.00065 },
  EUR: { code: "EUR", symbol: "€", locale: "en-IE", fromNGN: 0.0006 },
  GBP: { code: "GBP", symbol: "£", locale: "en-GB", fromNGN: 0.0005 },
  GHS: { code: "GHS", symbol: "GH₵", locale: "en-GH", fromNGN: 0.0075 },
  KES: { code: "KES", symbol: "KSh", locale: "en-KE", fromNGN: 0.085 },
  ZAR: { code: "ZAR", symbol: "R", locale: "en-ZA", fromNGN: 0.012 },
  CAD: { code: "CAD", symbol: "CA$", locale: "en-CA", fromNGN: 0.0009 },
  AUD: { code: "AUD", symbol: "A$", locale: "en-AU", fromNGN: 0.001 },
};

module.exports = { CATEGORIES, MODIFIERS, DEFAULTS, CURRENCY, CURRENCIES };
