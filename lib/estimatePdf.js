const PDFDocument = require("pdfkit");

const LABELS = {
  experience: {
    starting_out: "Starting out",
    intermediate: "Intermediate",
    professional: "Professional",
    expert: "Expert",
  },
  deadline: {
    flexible: "Flexible",
    "7_plus_days": "7+ days",
    "3_6_days": "3–6 days",
    "1_2_days": "1–2 days",
    same_day_rush: "Same day / Rush",
  },
  complexity: {
    simple: "Simple",
    medium: "Medium",
    complex: "Complex",
    very_complex: "Very complex",
  },
  clientType: {
    individual: "Individual",
    startup: "Startup",
    small_business: "Small business",
    corporate: "Corporate",
    nonprofit: "Nonprofit",
  },
};

function label(group, value) {
  return LABELS[group]?.[value] || value || "—";
}

function formatCurrency(value, currency = { code: "NGN", locale: "en-NG" }) {
  const amount = new Intl.NumberFormat(currency.locale || "en-US", {
    maximumFractionDigits: 0,
  }).format(Math.round(value));
  const prefixes = {
    USD: "$",
    GBP: "£",
    EUR: "EUR ",
    NGN: "NGN ",
    GHS: "GHS ",
    KES: "KES ",
    ZAR: "ZAR ",
    CAD: "CAD ",
    AUD: "AUD ",
  };
  return `${prefixes[currency.code] || `${currency.code || "NGN"} `}${amount}`;
}

function addRule(doc) {
  doc.moveTo(48, doc.y).lineTo(547, doc.y).strokeColor("#DDE1EB").stroke();
  doc.moveDown(1.25);
}

function sectionTitle(doc, title, x = 48, y = doc.y) {
  doc
    .fillColor("#667085")
    .font("Helvetica-Bold")
    .fontSize(8)
    .text(title.toUpperCase(), x, y, { characterSpacing: 1 });
}

function detailsRow(doc, title, value) {
  const y = doc.y;
  doc
    .fillColor("#667085")
    .font("Helvetica")
    .fontSize(10)
    .text(title, 48, y, { width: 155 });
  doc
    .fillColor("#171B28")
    .font("Helvetica-Bold")
    .fontSize(10)
    .text(value, 210, y, { width: 337 });
  doc.moveDown(0.75);
}

function createEstimatePdf(result) {
  const doc = new PDFDocument({
    size: "A4",
    margin: 48,
    info: { Title: "PriceCheck Pricing Estimate", Author: "PriceCheck" },
  });
  const { project, pricing, advice } = result;
  const currency = pricing.currency || { code: "NGN", locale: "en-NG" };

  doc
    .fillColor("#5B6EF5")
    .font("Helvetica-Bold")
    .fontSize(18)
    .text("PRICECHECK", 48, 48);
  doc
    .fillColor("#171B28")
    .font("Helvetica-Bold")
    .fontSize(25)
    .text("ESTIMATE", 390, 46, { width: 157, align: "right" });
  doc
    .fillColor("#667085")
    .font("Helvetica")
    .fontSize(9)
    .text("Planning estimate", 390, 78, { width: 157, align: "right" });
  doc.moveTo(48, 103).lineTo(547, 103).strokeColor("#DDE1EB").stroke();

  sectionTitle(doc, "Service", 48, 124);
  doc
    .fillColor("#171B28")
    .font("Helvetica-Bold")
    .fontSize(14)
    .text(pricing.category, 48, 140, { width: 220 });
  sectionTitle(doc, "Project", 330, 124);
  doc
    .fillColor("#171B28")
    .font("Helvetica-Bold")
    .fontSize(14)
    .text(project.projectType, 330, 140, { width: 217 });
  doc.moveTo(48, 190).lineTo(547, 190).strokeColor("#DDE1EB").stroke();

  doc.rect(48, 210, 499, 78).fill("#F7F8FC");
  sectionTitle(doc, "Recommended quote", 62, 226);
  doc
    .fillColor("#5B6EF5")
    .font("Helvetica-Bold")
    .fontSize(24)
    .text(formatCurrency(pricing.recommendedQuote, currency), 62, 244);
  sectionTitle(doc, "Fair range", 330, 226);
  doc
    .fillColor("#171B28")
    .font("Helvetica-Bold")
    .fontSize(12)
    .text(
      `${formatCurrency(pricing.fairRange.min, currency)} – ${formatCurrency(pricing.fairRange.max, currency)}`,
      330,
      246,
      { width: 217 },
    );

  sectionTitle(doc, "Project details", 48, 324);
  doc.rect(48, 342, 499, 208).fill("#F7F8FC");
  doc.y = 360;
  detailsRow(doc, "Service", pricing.category);
  detailsRow(doc, "Project Type", project.projectType);
  detailsRow(doc, "Experience Level", label("experience", project.experience));
  detailsRow(doc, "Deadline", label("deadline", project.deadline));
  detailsRow(doc, "Complexity", label("complexity", project.complexity));
  detailsRow(doc, "Client Type", label("clientType", project.clientType));
  detailsRow(doc, "Duration", project.duration || "—");
  detailsRow(
    doc,
    "Deliverables",
    project.deliverables.length ? project.deliverables.join(", ") : "—",
  );
  detailsRow(doc, "Revisions", String(project.revisions));
  doc.moveTo(48, 570).lineTo(547, 570).strokeColor("#DDE1EB").stroke();

  sectionTitle(doc, "Why this price?", 48, 598);
  doc.y = 616;
  advice.reasons.forEach((reason) => {
    doc
      .fillColor("#5B6EF5")
      .font("Helvetica-Bold")
      .fontSize(12)
      .text("•", 48, doc.y, { continued: true });
    doc
      .fillColor("#303746")
      .font("Helvetica")
      .fontSize(10)
      .text(`  ${reason}`, { width: 475 });
    doc.moveDown(0.35);
  });
  sectionTitle(doc, "Pricing advice", 48, doc.y + 18);
  doc.moveDown(0.55);
  doc
    .fillColor("#303746")
    .font("Helvetica")
    .fontSize(10)
    .text(advice.advice, { lineGap: 3 });
  doc.moveDown(0.9);
  doc
    .fillColor("#667085")
    .font("Helvetica-Oblique")
    .fontSize(9)
    .text(advice.negotiationTip, { lineGap: 2 });
  doc.moveDown(1.2);
  addRule(doc);
  doc
    .fillColor("#171B28")
    .font("Helvetica-Bold")
    .fontSize(10)
    .text("PriceCheck");
  doc
    .fillColor("#667085")
    .font("Helvetica-Oblique")
    .fontSize(9)
    .text("Know what to charge. Before you quote.");
  doc.moveDown(0.8);
  doc
    .fillColor("#667085")
    .font("Helvetica")
    .fontSize(8)
    .text(
      `Generated on ${new Date().toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" })}`,
    );
  doc.moveDown(0.75);
  doc
    .fontSize(8)
    .text(
      "This estimate is for planning purposes. Confirm scope, timing, payment terms, and client value before sending a final quote.",
      { lineGap: 2 },
    );
  return doc;
}

module.exports = { createEstimatePdf };
