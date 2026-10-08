/**
 * lib/pricingEngine.js
 *
 * Deterministic pricing calculator. Gemini is only ever allowed to
 * extract/structure project details — it never sets a price directly.
 * This file takes that structured data and calculates the actual number,
 * using config/pricing.js as the single source of truth for values.
 */

const { CATEGORIES, MODIFIERS, DEFAULTS, CURRENCY } = require("../config/pricing");

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/** Round to the nearest 1,000 NGN so quotes look natural, not robotic. */
function roundToNearestThousand(value) {
  return Math.round(value / 1000) * 1000;
}

function resolveCategory(serviceName) {
  if (serviceName && CATEGORIES[serviceName]) {
    return { name: serviceName, ...CATEGORIES[serviceName] };
  }
  const fallbackName = DEFAULTS.service;
  return { name: fallbackName, ...CATEGORIES[fallbackName] };
}

function resolveModifier(table, key, fallbackKey) {
  if (key && Object.prototype.hasOwnProperty.call(table, key)) {
    return table[key];
  }
  return table[fallbackKey] ?? 1.0;
}

function parseDurationHours(durationText) {
  if (typeof durationText === "number" && !Number.isNaN(durationText)) {
    return Math.max(0, durationText);
  }
  if (typeof durationText !== "string") return DEFAULTS.durationHours;

  const text = durationText.toLowerCase();

  const dayMatch = text.match(/(\d+(\.\d+)?)\s*day/);
  if (dayMatch) return parseFloat(dayMatch[1]) * 8; // treat a day as 8 working hours

  const hourMatch = text.match(/(\d+(\.\d+)?)\s*(hour|hr)/);
  if (hourMatch) return parseFloat(hourMatch[1]);

  const weekMatch = text.match(/(\d+(\.\d+)?)\s*week/);
  if (weekMatch) return parseFloat(weekMatch[1]) * 40; // ~5 working days

  const monthMatch = text.match(/(\d+(\.\d+)?)\s*month/);
  if (monthMatch) return parseFloat(monthMatch[1]) * 160; // ~4 working weeks

  const plainNumber = text.match(/(\d+(\.\d+)?)/);
  if (plainNumber) return parseFloat(plainNumber[1]);

  return DEFAULTS.durationHours;
}

function countDeliverableUnits(deliverables) {
  if (!Array.isArray(deliverables) || deliverables.length === 0) {
    return DEFAULTS.deliverableUnits;
  }

  let total = 0;
  for (const item of deliverables) {
    if (typeof item !== "string") continue;
    const match = item.match(/(\d+(\.\d+)?)/);
    total += match ? parseFloat(match[1]) : 1; // no number mentioned -> count as one unit
  }
  return total > 0 ? total : deliverables.length;
}

function boundedIncrementMultiplier({ units, baselineUnits, unitIncrement, cap }) {
  const extraUnits = Math.max(0, units - baselineUnits);
  const multiplier = 1 + extraUnits * unitIncrement;
  return clamp(multiplier, 1, cap);
}

/**
 * @param {object} projectData - structured output from Gemini's extraction step
 * @returns {object} full pricing breakdown
 */
function calculatePrice(projectData) {
  const category = resolveCategory(projectData.service);

  const experienceMultiplier = resolveModifier(
    MODIFIERS.experience,
    projectData.experience,
    DEFAULTS.experience
  );
  const complexityMultiplier = resolveModifier(
    MODIFIERS.complexity,
    projectData.complexity,
    DEFAULTS.complexity
  );
  const deadlineMultiplier = resolveModifier(
    MODIFIERS.deadline,
    projectData.deadline,
    DEFAULTS.deadline
  );
  const clientTypeMultiplier = resolveModifier(
    MODIFIERS.clientType,
    projectData.clientType,
    DEFAULTS.clientType
  );

  const durationHours = parseDurationHours(projectData.duration);
  const durationMultiplier = boundedIncrementMultiplier({
    units: durationHours,
    baselineUnits: MODIFIERS.duration.baselineHours,
    unitIncrement: MODIFIERS.duration.unitIncrement,
    cap: MODIFIERS.duration.cap
  });

  const deliverableUnits = countDeliverableUnits(projectData.deliverables);
  const deliverablesMultiplier = boundedIncrementMultiplier({
    units: deliverableUnits,
    baselineUnits: MODIFIERS.deliverables.baselineUnits,
    unitIncrement: MODIFIERS.deliverables.unitIncrement,
    cap: MODIFIERS.deliverables.cap
  });

  const revisionsCount =
    typeof projectData.revisions === "number" ? projectData.revisions : DEFAULTS.revisions;
  const revisionsMultiplier = boundedIncrementMultiplier({
    units: revisionsCount,
    baselineUnits: MODIFIERS.revisions.includedRevisions,
    unitIncrement: MODIFIERS.revisions.unitIncrement,
    cap: MODIFIERS.revisions.cap
  });

  const combinedMultiplier =
    experienceMultiplier *
    complexityMultiplier *
    deadlineMultiplier *
    clientTypeMultiplier *
    durationMultiplier *
    deliverablesMultiplier *
    revisionsMultiplier;

  const rawQuote = category.basePrice * combinedMultiplier;
  const clampedQuote = clamp(rawQuote, category.minimumPrice, category.maximumPrice);
  const recommendedQuote = roundToNearestThousand(clampedQuote);

  const rangeSpread = 0.2; // fair range is +/- 20% around the recommended quote
  const rawMin = recommendedQuote * (1 - rangeSpread);
  const rawMax = recommendedQuote * (1 + rangeSpread);

  const fairRangeMin = roundToNearestThousand(
    clamp(rawMin, category.minimumPrice, category.maximumPrice)
  );
  const fairRangeMax = roundToNearestThousand(
    clamp(rawMax, category.minimumPrice, category.maximumPrice)
  );

  return {
    currency: CURRENCY,
    category: category.name,
    recommendedQuote,
    fairRange: { min: fairRangeMin, max: fairRangeMax },
    breakdown: {
      basePrice: category.basePrice,
      multipliers: {
        experience: experienceMultiplier,
        complexity: complexityMultiplier,
        deadline: deadlineMultiplier,
        clientType: clientTypeMultiplier,
        duration: durationMultiplier,
        deliverables: deliverablesMultiplier,
        revisions: revisionsMultiplier,
        combined: Number(combinedMultiplier.toFixed(3))
      },
      resolvedInputs: {
        durationHours,
        deliverableUnits,
        revisionsCount
      }
    }
  };
}

module.exports = { calculatePrice };
