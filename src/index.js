"use strict";

function escapeCSV(value, delimiter = ",") {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(delimiter) || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function flatten(obj, prefix = "") {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(result, flatten(value, path));
    } else {
      result[path] = Array.isArray(value) ? JSON.stringify(value) : value;
    }
  }
  return result;
}

function getHeaders(rows, options = {}) {
  if (options.fields && options.fields.length > 0) return options.fields;
  const headerSet = new Set();
  for (const row of rows) {
    const source = options.flatten ? flatten(row) : row;
    for (const key of Object.keys(source)) {
      headerSet.add(key);
    }
  }
  return [...headerSet];
}

function parseInput(input) {
  const trimmed = input.trim();
  if (!trimmed) return [];
  // Try JSON array first
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parsed;
    return [parsed]; // single object
  } catch {}
  // Try JSONL (one JSON per line)
  const lines = trimmed.split("\n").filter(l => l.trim());
  return lines.map(line => {
    try { return JSON.parse(line); }
    catch { throw new Error(`Invalid JSON line: ${line.slice(0, 60)}`); }
  });
}

function formatCSV(rows, options = {}) {
  const delimiter = options.delimiter || ",";
  const headers = getHeaders(rows, options);
  const lines = [];

  if (!options.noHeader) {
    lines.push(headers.map(h => escapeCSV(h, delimiter)).join(delimiter));
  }

  for (const row of rows) {
    const source = options.flatten ? flatten(row) : row;
    const values = headers.map(h => {
      const val = source[h];
      return escapeCSV(val === undefined ? "" : val, delimiter);
    });
    lines.push(values.join(delimiter));
  }

  return lines.join("\n");
}

function formatPretty(rows, options = {}) {
  const headers = getHeaders(rows, options);
  if (headers.length === 0) return "";
  const delimiter = options.delimiter || ",";

  const colValues = [];
  colValues.push(headers);
  for (const row of rows) {
    const source = options.flatten ? flatten(row) : row;
    colValues.push(headers.map(h => String(source[h] ?? "")));
  }

  const widths = headers.map((_, i) =>
    Math.max(...colValues.map(r => r[i].length))
  );

  const pad = (val, i) => val.padEnd(widths[i]);
  const separator = widths.map(w => "─".repeat(w + 2)).join("┼");

  const lines = [];
  lines.push(colValues[0].map(pad).join(" │ "));
  lines.push(separator);
  for (let r = 1; r < colValues.length; r++) {
    lines.push(colValues[r].map(pad).join(" │ "));
  }
  return lines.join("\n");
}

function convert(input, options = {}) {
  const rows = parseInput(input);
  if (rows.length === 0) return "";
  if (options.pretty) return formatPretty(rows, options);
  return formatCSV(rows, options);
}

function parseArgs(argv) {
  const result = { file: null, output: null, delimiter: ",", noHeader: false, flatten: false, pretty: false, fields: null, help: false };
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "-h" || arg === "--help") { result.help = true; }
    else if (arg === "-o" || arg === "--output") { result.output = argv[++i]; }
    else if (arg === "-d" || arg === "--delimiter") { result.delimiter = argv[++i]; }
    else if (arg === "-n" || arg === "--no-header") { result.noHeader = true; }
    else if (arg === "-f" || arg === "--fields") { result.fields = argv[++i].split(","); }
    else if (arg === "--flatten") { result.flatten = true; }
    else if (arg === "--pretty") { result.pretty = true; }
    else if (!arg.startsWith("-")) { positional.push(arg); }
  }
  if (positional.length > 0) result.file = positional[0];
  return result;
}

module.exports = { escapeCSV, flatten, getHeaders, parseInput, formatCSV, formatPretty, convert, parseArgs };
