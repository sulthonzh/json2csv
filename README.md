# json2csv

Convert JSON and JSONL to CSV from the command line. Zero dependencies.

## Why

You've got JSON data and need CSV. Maybe a quick export, maybe feeding data into a spreadsheet, maybe pipeline glue. You don't need a 50-dependency library for that.

## Install

```bash
npm install -g json2csv
```

## Usage

```bash
# Convert a JSON file
json2csv data.json

# Pipe JSONL
cat logs.jsonl | json2csv

# Write to file
json2csv data.json -o output.csv

# Custom delimiter (for Excel regions)
json2csv data.json -d ";"

# Pick specific fields
json2csv data.json -f name,email,city

# Flatten nested objects
json2csv data.json --flatten

# Pretty table in terminal
json2csv data.json --pretty

# Omit header row
json2csv data.json -n
```

## Input Formats

**JSON array:**
```json
[{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}]
```

**Single object:**
```json
{"name": "Alice", "age": 30}
```

**JSONL (one JSON per line):**
```
{"name": "Alice", "age": 30}
{"name": "Bob", "age": 25}
```

## Nested Objects

With `--flatten`, nested objects get dot-notation keys:

```bash
$ echo '{"user":{"name":"Alice","email":"a@b.com"}}' | json2csv --flatten
user.name,user.email
Alice,a@b.com
```

## Pretty Output

```bash
$ json2csv data.json --pretty
name   │ age
───────┼────
Alice  │ 30
Bob    │ 25
```

## Programmatic API

```js
const { convert, parseInput, formatCSV, formatPretty } = require("json2csv");

const csv = convert('[{"a":1,"b":2}]');
// "a,b\n1,2"

const rows = parseInput(jsonlString);
const csv = formatCSV(rows, { delimiter: ";", fields: ["b", "a"] });
const table = formatPretty(rows, { flatten: true });
```

## Options

| Flag | Description |
|------|-------------|
| `-o, --output <file>` | Write to file instead of stdout |
| `-d, --delimiter <char>` | CSV delimiter (default: `,`) |
| `-n, --no-header` | Omit header row |
| `-f, --fields <list>` | Comma-separated fields to include |
| `--flatten` | Flatten nested objects (dot notation) |
| `--pretty` | Align columns for terminal display |

## License

MIT
