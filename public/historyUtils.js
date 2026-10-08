(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.PriceCheckHistoryUtils = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function getEditDraft(result, labels = {}) {
    const project = result?.project || {};
    const pricing = result?.pricing || {};
    const sourceDescription = result?.sourceDescription;
    const clientType =
      labels.clientType?.[project.clientType] || project.clientType;
    const details = [
      project.duration,
      project.deliverables?.length
        ? `deliver ${project.deliverables.join(", ")}`
        : "",
      clientType ? `for a ${clientType}` : "",
    ].filter(Boolean);

    return {
      description:
        typeof sourceDescription === "string" && sourceDescription.trim()
          ? sourceDescription
          : `I need help with ${project.projectType || pricing.category || "this project"}.${details.length ? ` ${details.join(" and ")}.` : ""}`,
      selections: {
        experienceLevel: project.experience,
        deadline: project.deadline,
      },
      deliverables: result?.sourceDeliverables || "",
    };
  }

  return { getEditDraft };
});
