const fs = require("node:fs");
const path = require("node:path");

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    if (char === "\r") continue;
    current += char;
  }

  values.push(current);
  return values;
}

function csvEscape(value) {
  const stringValue = value == null ? "" : String(value);
  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

const filePath = path.join(__dirname, "..", "data", "user-details.csv");
if (!fs.existsSync(filePath)) {
  console.log("No user-details.csv file found.");
  process.exit(0);
}

const defaultHeaders = [
  "id",
  "email",
  "name",
  "picture",
  "given_name",
  "family_name",
  "locale",
  "newsletter_consent",
  "role",
  "last_seen_at",
];

const csvText = fs.readFileSync(filePath, "utf8").trim();
if (!csvText) {
  console.log("User CSV is empty.");
  process.exit(0);
}

const lines = csvText.split(/\r?\n/).filter(Boolean);
if (lines.length < 2) {
  console.log("CSV has no user rows to clean.");
  process.exit(0);
}

const headers = parseCsvLine(lines[0]).map((header) => header.trim());
const rows = lines.slice(1).map((line) => {
  const values = parseCsvLine(line);
  return Object.fromEntries(
    headers.map((header, index) => [header, values[index] ?? ""]),
  );
});

const deduped = new Map();
for (const row of rows) {
  const key = String(row.email || row.id || row.name || "")
    .trim()
    .toLowerCase();
  if (!key) continue;

  const current = deduped.get(key);
  if (
    !current ||
    (row.last_seen_at &&
      (!current.last_seen_at ||
        new Date(row.last_seen_at) > new Date(current.last_seen_at)))
  ) {
    deduped.set(key, row);
  }
}

const cleanedRows = Array.from(deduped.values());
const output = [headers.join(",")]
  .concat(
    cleanedRows.map((row) =>
      headers.map((header) => csvEscape(row[header] ?? "")).join(","),
    ),
  )
  .join("\n");

fs.writeFileSync(filePath, `${output}\n`, "utf8");
console.log(
  `Cleaned duplicate user rows. Remaining unique users: ${cleanedRows.length}`,
);
