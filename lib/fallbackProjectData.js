const SERVICE_MATCHERS = [
  [
    "Photography",
    /\b(photo|photos|photograph|photography|photoshoot|shooting|shoot)\b/i,
  ],
  ["Videography", /\b(videograph|filming|film a|video shoot)\b/i],
  ["Video Editing", /\b(video edit|edit.*video|reel|motion graphics)\b/i],
  ["Brand Identity", /\b(brand identity|brand kit|logo and brand|branding)\b/i],
  ["Graphic Design", /\b(graphic design|flyer|poster|banner|logo)\b/i],
  ["UI/UX Design", /\b(ui\/?ux|user interface|prototype|figma)\b/i],
  [
    "Website Development",
    /\b(website|web app|landing page|wordpress|shopify)\b/i,
  ],
  [
    "Social Media Management",
    /\b(social media|content calendar|instagram management)\b/i,
  ],
  ["Copywriting", /\b(copywriting|copywriter|website copy|sales copy)\b/i],
  ["Consulting", /\b(consult|strategy session|advisory)\b/i],
];

function firstMatch(text, expression) {
  const match = text.match(expression);
  return match ? match[1] : null;
}

function fallbackProjectData(description) {
  const service =
    SERVICE_MATCHERS.find(([, expression]) =>
      expression.test(description),
    )?.[0] || "Consulting";
  const durationValue = firstMatch(
    description,
    /(\d+(?:\.\d+)?)[\s-]*(hours?|hrs?|days?|weeks?|months?)/i,
  );
  const durationUnit = description.match(
    /\d+(?:\.\d+)?[\s-]*(hours?|hrs?|days?|weeks?|months?)/i,
  )?.[1];
  const deliverableValue = firstMatch(
    description,
    /(\d+)\s+(?:edited\s+)?(photos?|images?|videos?|reels?|pages?|posts?|designs?)/i,
  );
  const deliverableName = description.match(
    /\d+\s+((?:edited\s+)?(?:photos?|images?|videos?|reels?|pages?|posts?|designs?))/i,
  )?.[1];
  const revisionValue = firstMatch(description, /(\d+)\s+revisions?/i);
  const namedProject = description.match(
    /\b(birthday event|wedding|corporate event|product launch|brand identity|landing page|website)\b/i,
  )?.[1];
  const projectType = namedProject
    ? namedProject.replace(/\b\w/g, (letter) => letter.toUpperCase())
    : description.split(/[.!?]/)[0].trim().slice(0, 120) || "General Project";

  return {
    service,
    projectType: projectType.charAt(0).toUpperCase() + projectType.slice(1),
    complexity: /\b(complex|advanced|multi[- ]page|full[- ]scale)\b/i.test(
      description,
    )
      ? "complex"
      : "medium",
    clientType: /\b(corporate|company|enterprise)\b/i.test(description)
      ? "corporate"
      : /\b(small business|business|startup)\b/i.test(description)
        ? "small_business"
        : "individual",
    duration:
      durationValue && durationUnit ? `${durationValue} ${durationUnit}` : "",
    deliverables:
      deliverableValue && deliverableName
        ? [`${deliverableValue} ${deliverableName}`]
        : [],
    revisions: revisionValue ? Number(revisionValue) : 1,
    missingInformation: [
      ...(durationValue ? [] : ["Project duration"]),
      ...(deliverableValue ? [] : ["Deliverables"]),
    ],
    confidence: "low",
  };
}

module.exports = { fallbackProjectData };
