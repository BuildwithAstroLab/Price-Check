const PDFDocument = require("pdfkit");

function formatCurrency(value, currency = { code: "NGN", locale: "en-NG" }) {
  const amount = new Intl.NumberFormat(currency.locale || "en-US", {
    maximumFractionDigits: 0,
  }).format(Math.round(value));
  const prefixes = {
    USD: "$",
    GBP: "£",
    EUR: "EUR ",
    NGN: "₦",
    GHS: "GHS ",
    KES: "KES ",
    ZAR: "ZAR ",
    CAD: "CAD ",
    AUD: "AUD ",
  };
  return `${prefixes[currency.code] || `${currency.code || "NGN"} `}${amount}`;
}

function addRule(doc, y = doc.y) {
  doc.moveTo(48, y).lineTo(547, y).strokeColor("#DDE1EB").stroke();
}

function sectionLabel(doc, text, x = 48, y = doc.y) {
  doc
    .fillColor("#667085")
    .font("Helvetica-Bold")
    .fontSize(8)
    .text(text.toUpperCase(), x, y, { characterSpacing: 1 });
}

function bodyText(doc, text, x = 48, y = doc.y, options = {}) {
  doc
    .fillColor("#303746")
    .font("Helvetica")
    .fontSize(10)
    .text(text, x, y, options);
}

function createInvoicePdf(invoice) {
  const doc = new PDFDocument({
    size: "A4",
    margin: 48,
    info: { Title: "PriceCheck Invoice", Author: invoice.fromName },
  });
  const currency = invoice.currency;

  doc
    .fillColor("#5B6EF5")
    .font("Helvetica-Bold")
    .fontSize(18)
    .text("PRICECHECK", 48, 48);
  doc
    .fillColor("#171B28")
    .font("Helvetica-Bold")
    .fontSize(25)
    .text("INVOICE", 390, 46, { width: 157, align: "right" });
  doc
    .fillColor("#667085")
    .font("Helvetica")
    .fontSize(9)
    .text(invoice.invoiceNumber, 390, 78, { width: 157, align: "right" });
  addRule(doc, 103);

  const partyY = 124;
  sectionLabel(doc, "From", 48, partyY);
  doc
    .fillColor("#171B28")
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(invoice.fromName, 48, partyY + 16, { width: 220 });
  sectionLabel(doc, "Bill to", 330, partyY);
  doc
    .fillColor("#171B28")
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(invoice.clientName, 330, partyY + 16, { width: 217 });
  if (invoice.clientEmail) {
    bodyText(doc, invoice.clientEmail, 330, partyY + 34, { width: 217 });
  }
  addRule(doc, 190);

  doc.rect(48, 210, 499, 58).fill("#F7F8FC");
  sectionLabel(doc, "Invoice date", 62, 224);
  bodyText(doc, invoice.issueDate, 62, 240);
  sectionLabel(doc, "Due date", 220, 224);
  bodyText(doc, invoice.dueDate || "Upon receipt", 220, 240);
  sectionLabel(doc, "Project", 378, 224);
  bodyText(doc, invoice.projectTitle, 378, 240, { width: 155 });

  sectionLabel(doc, "Services and amount", 48, 302);
  doc.rect(48, 322, 499, 32).fill("#EEF1FF");
  doc
    .fillColor("#667085")
    .font("Helvetica-Bold")
    .fontSize(8)
    .text("DESCRIPTION", 62, 334, { characterSpacing: 0.8 });
  const currencyLabel =
    currency.code === "USD" || currency.code === "GBP"
      ? currency.symbol
      : currency.code;
  doc.text(`AMOUNT (${currencyLabel || currency.code})`, 395, 334, {
    width: 135,
    align: "right",
    characterSpacing: 0.8,
  });
  doc
    .fillColor("#171B28")
    .font("Helvetica-Bold")
    .fontSize(10)
    .text(invoice.projectTitle, 62, 374, { width: 320 });
  bodyText(doc, invoice.deliverables || "Project services", 62, 392, {
    width: 320,
    lineGap: 2,
  });
  doc
    .fillColor("#171B28")
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(formatCurrency(invoice.amount, currency), 395, 374, {
      width: 135,
      align: "right",
    });
  addRule(doc, 438);

  doc
    .fillColor("#667085")
    .font("Helvetica-Bold")
    .fontSize(10)
    .text("TOTAL DUE", 360, 458, { width: 90, align: "right" });
  doc
    .fillColor("#5B6EF5")
    .font("Helvetica-Bold")
    .fontSize(21)
    .text(formatCurrency(invoice.amount, currency), 450, 452, {
      width: 97,
      align: "right",
    });

  if (invoice.notes) {
    sectionLabel(doc, "Notes", 48, 510);
    bodyText(doc, invoice.notes, 48, 528, { width: 499, lineGap: 2 });
  }

  const paymentY = invoice.notes ? 590 : 520;
  doc.roundedRect(48, paymentY, 499, 135, 6).fill("#F1F3FF");
  sectionLabel(doc, "Payment details", 66, paymentY + 18);
  bodyText(
    doc,
    "Please transfer the total due to the account below:",
    66,
    paymentY + 37,
    { width: 450 },
  );
  doc.fillColor("#171B28").font("Helvetica-Bold").fontSize(10);
  doc.text(`Bank: ${invoice.bankName}`, 66, paymentY + 58);
  doc.text(`Account name: ${invoice.accountName}`, 66, paymentY + 75);
  doc.text(`Account number: ${invoice.accountNumber}`, 66, paymentY + 92);
  doc
    .fillColor("#667085")
    .font("Helvetica-Oblique")
    .fontSize(8.5)
    .text(
      `Use ${invoice.invoiceNumber} as the transfer reference and share the confirmation once payment is complete.`,
      66,
      paymentY + 111,
      { width: 450 },
    );

  doc
    .fillColor("#667085")
    .font("Helvetica")
    .fontSize(8)
    .text(
      "Please contact the recipient if any payment details differ from the information shown on this invoice.",
      48,
      735,
      { width: 499, align: "center" },
    );
  doc
    .fillColor("#667085")
    .font("Helvetica")
    .fontSize(8.5)
    .text("Thank you for your business.", 48, 755, {
      width: 499,
      align: "center",
    });
  return doc;
}

module.exports = { createInvoicePdf };
