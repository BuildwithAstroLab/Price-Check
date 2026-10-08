const test = require("node:test");
const assert = require("node:assert/strict");
const { calculatePrice } = require("../lib/pricingEngine");

const project = {
  service: "Photography",
  complexity: "medium",
  clientType: "small_business",
  duration: "3 hours",
  deliverables: ["150 edited photos"],
  revisions: 2,
};

test("pricing applies experience and deadline modifiers predictably", () => {
  const startingOutFlexible = calculatePrice({ ...project, experience: "starting_out", deadline: "flexible" });
  const professionalStandard = calculatePrice({ ...project, experience: "professional", deadline: "3_6_days" });
  const expertFlexible = calculatePrice({ ...project, experience: "expert", deadline: "flexible" });
  const expertRush = calculatePrice({ ...project, experience: "expert", deadline: "same_day_rush" });

  assert.equal(professionalStandard.breakdown.multipliers.experience, 1.2);
  assert.equal(professionalStandard.breakdown.multipliers.deadline, 1);
  assert.equal(expertRush.breakdown.multipliers.deadline, 1.5);
  assert.ok(startingOutFlexible.recommendedQuote < professionalStandard.recommendedQuote);
  assert.ok(expertFlexible.recommendedQuote > professionalStandard.recommendedQuote);
  assert.ok(expertRush.recommendedQuote > expertFlexible.recommendedQuote);
  assert.ok(professionalStandard.fairRange.min < professionalStandard.recommendedQuote);
  assert.ok(professionalStandard.fairRange.max > professionalStandard.recommendedQuote);
});
