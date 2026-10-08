const test = require("node:test");
const assert = require("node:assert/strict");
const { getEditDraft } = require("../public/historyUtils");

const labels = { clientType: { small_business: "Small Business" } };

test("history edit restores the original prompt and pricing selections", () => {
  const draft = getEditDraft({
    sourceDescription: "Photograph a birthday event for three hours.",
    project: { experience: "expert", deadline: "same_day_rush" },
  }, labels);

  assert.equal(draft.description, "Photograph a birthday event for three hours.");
  assert.deepEqual(draft.selections, { experienceLevel: "expert", deadline: "same_day_rush" });
});

test("older history entries receive an editable reconstructed prompt", () => {
  const draft = getEditDraft({
    project: {
      projectType: "Birthday Event",
      duration: "3 hours",
      deliverables: ["150 edited photos"],
      clientType: "small_business",
      experience: "professional",
      deadline: "3_6_days",
    },
    pricing: { category: "Photography" },
  }, labels);

  assert.match(draft.description, /Birthday Event/);
  assert.match(draft.description, /150 edited photos/);
  assert.deepEqual(draft.selections, { experienceLevel: "professional", deadline: "3_6_days" });
});
