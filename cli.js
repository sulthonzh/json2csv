#!/usr/bin/env node
"use strict";
const { parseArgs, convert, formatCSV, escapeCSV, flatten, getHeaders } = require("./src/index");
const fs = require("fs");
const path = require("path");

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", chunk => data += chunk);
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", reject);
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(`json2csv — Convert JSON/JSONL to CSV

Usage:
  json2csv <file>                    Convert file to CSV
  cat data.json | json2csv           Pipe JSON/JSONL via stdin
  json2csv <file> -o output.csv      Write to file

Options:
  -o, --output <file>    Write output to file instead of stdout
  -d, --delimiter <char> CSV delimiter (default: comma)
  -n, --no-header        Omit header row
  -f, --fields <list>    Comma-separated list of fields to include
  --flatten              Flatten nested objects (dot notation)
  --pretty               Align columns for terminal display
  -h, --help             Show this help
`);
    process.exit(0);
  }

  let input;
  if (args.file) {
    const filePath = path.resolve(args.file);
    if (!fs.existsSync(filePath)) {
      console.error(`Error: file not found: ${filePath}`);
      process.exit(2);
    }
    input = fs.readFileSync(filePath, "utf8");
  } else if (!process.stdin.isTTY) {
    input = await readStdin();
  } else {
    console.error("Error: provide a file or pipe input via stdin");
    process.exit(2);
  }

  const result = convert(input, {
    delimiter: args.delimiter,
    fields: args.fields,
    flatten: args.flatten,
    noHeader: args.noHeader,
    pretty: args.pretty,
  });

  if (args.output) {
    fs.writeFileSync(path.resolve(args.output), result);
  } else {
    console.log(result);
  }
}

main().catch(err => {
  console.error("Error:", err.message);
  process.exit(2);
});
