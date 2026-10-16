const PDFDocument = require("pdfkit");

function formatCurrency(value, currency = { code: "NGN", locale: "en-NG" }) {
  const amount = new Intl.NumberFormat(currency.locale || "en-US", {
    maximumFractionDigits: 0,
  }).format(Math.round(value));
  const prefixes = {
    USD: "$",
    GBP: "GBP ",
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
    info: { Title: "Project Estimate", Author: "PriceCheck" },
  });
  const { project, pricing } = result;
  const currency = pricing.currency || { code: "NGN", locale: "en-NG" };
  const deliverables = project.deliverables.length
    ? project.deliverables
    : ["Project services as agreed"];

  doc
    .fillColor("#5B6EF5")
    .font("Helvetica-Bold")
    .fontSize(13)
    .text("PRICECHECK", 48, 48);
  doc
    .fillColor("#171B28")
    .font("Helvetica-Bold")
    .fontSize(24)
    .text("PROJECT ESTIMATE", 48, 86, { width: 499 });
  doc
    .fillColor("#667085")
    .font("Helvetica")
    .fontSize(10)
    .text(
      `Date: ${new Date().toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" })}`,
      48,
      120,
    );
  if (result.preparedBy) {
    doc
      .fillColor("#667085")
      .font("Helvetica")
      .fontSize(9)
      .text(`Prepared by: ${result.preparedBy}`, 48, 137, { width: 499 });
  }
  doc.moveTo(48, 158).lineTo(547, 158).strokeColor("#DDE1EB").stroke();

  sectionTitle(doc, "Service", 48, 182);
  doc
    .fillColor("#171B28")
    .font("Helvetica-Bold")
    .fontSize(14)
    .text(pricing.category, 48, 200, { width: 499 });
  sectionTitle(doc, "Project", 48, 238);
  doc
    .fillColor("#171B28")
    .font("Helvetica-Bold")
    .fontSize(12)
    .text(project.projectType, 48, 256, { width: 499 });

  let y = 290;
  sectionTitle(doc, "Scope of work", 48, y);
  y += 18;
  doc
    .fillColor("#303746")
    .font("Helvetica")
    .fontSize(10)
    .text(project.scopeDescription || project.projectType, 48, y, {
      width: 499,
      lineGap: 3,
    });
  y = doc.y + 24;

  sectionTitle(doc, "Deliverables", 48, y);
  y += 18;
  doc
    .fillColor("#303746")
    .font("Helvetica")
    .fontSize(10)
    .list(deliverables, 52, y, {
      bulletRadius: 2,
      textIndent: 14,
      bulletIndent: 0,
    });
  y = doc.y + 20;

  doc.rect(48, y, 499, 94).fill("#F7F8FC");
  sectionTitle(doc, "Your quote", 62, y + 17);
  doc
    .fillColor("#5B6EF5")
    .font("Helvetica-Bold")
    .fontSize(24)
    .text(formatCurrency(pricing.finalPrice, currency), 62, y + 38);
  doc.y = y + 118;

  if (project.duration && project.duration !== "—") {
    detailsRow(doc, "Estimated duration", project.duration);
  }
  detailsRow(doc, "Revisions included", String(project.revisions));
  doc.moveDown(0.5);
  doc.moveTo(48, doc.y).lineTo(547, doc.y).strokeColor("#DDE1EB").stroke();
  doc.moveDown(1.25);
  doc
    .fillColor("#667085")
    .font("Helvetica")
    .fontSize(9)
    .text("Thank you for the opportunity to work with you.", { lineGap: 2 });
  return doc;
}

module.exports = { createEstimatePdf };
