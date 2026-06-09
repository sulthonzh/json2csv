"use strict";
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { escapeCSV, flatten, getHeaders, parseInput, formatCSV, formatPretty, convert, parseArgs } = require("../src/index");

describe("escapeCSV", () => {
  it("escapes values with commas", () => {
    assert.equal(escapeCSV("hello, world"), '"hello, world"');
  });
  it("escapes values with quotes", () => {
    assert.equal(escapeCSV('say "hi"'), '"say ""hi"""');
  });
  it("escapes values with newlines", () => {
    assert.equal(escapeCSV("line1\nline2"), '"line1\nline2"');
  });
  it("returns empty for null/undefined", () => {
    assert.equal(escapeCSV(null), "");
    assert.equal(escapeCSV(undefined), "");
  });
  it("passes through simple values", () => {
    assert.equal(escapeCSV("hello"), "hello");
    assert.equal(escapeCSV(42), "42");
  });
  it("respects custom delimiter", () => {
    assert.equal(escapeCSV("a;b", ";"), '"a;b"');
  });
});

describe("flatten", () => {
  it("flattens nested objects", () => {
    assert.deepEqual(flatten({ a: { b: 1, c: { d: 2 } } }), { "a.b": 1, "a.c.d": 2 });
  });
  it("stringifies arrays", () => {
    assert.deepEqual(flatten({ tags: [1, 2] }), { tags: "[1,2]" });
  });
  it("handles top-level keys", () => {
    assert.deepEqual(flatten({ name: "test" }), { name: "test" });
  });
});

describe("getHeaders", () => {
  it("collects all keys from rows", () => {
    const headers = getHeaders([{ a: 1 }, { b: 2 }, { a: 3, c: 4 }]);
    assert.deepEqual(headers.sort(), ["a", "b", "c"]);
  });
  it("uses specified fields", () => {
    const headers = getHeaders([{ a: 1, b: 2 }], { fields: ["b", "a"] });
    assert.deepEqual(headers, ["b", "a"]);
  });
  it("returns empty for empty rows", () => {
    assert.deepEqual(getHeaders([]), []);
  });
});

describe("parseInput", () => {
  it("parses JSON array", () => {
    const rows = parseInput('[{"a":1},{"a":2}]');
    assert.deepEqual(rows, [{ a: 1 }, { a: 2 }]);
  });
  it("parses single JSON object", () => {
    const rows = parseInput('{"name":"test"}');
    assert.deepEqual(rows, [{ name: "test" }]);
  });
  it("parses JSONL", () => {
    const rows = parseInput('{"a":1}\n{"a":2}');
    assert.deepEqual(rows, [{ a: 1 }, { a: 2 }]);
  });
  it("returns empty for empty input", () => {
    assert.deepEqual(parseInput(""), []);
    assert.deepEqual(parseInput("  "), []);
  });
  it("throws on invalid JSONL line", () => {
    assert.throws(() => parseInput('{"a":1}\nnot json'), /Invalid JSON line/);
  });
});

describe("formatCSV", () => {
  it("produces header + rows", () => {
    const csv = formatCSV([{ name: "Alice", age: 30 }]);
    assert.equal(csv, "name,age\nAlice,30");
  });
  it("omits header with noHeader", () => {
    const csv = formatCSV([{ x: 1 }], { noHeader: true });
    assert.equal(csv, "1");
  });
  it("handles missing fields with empty", () => {
    const csv = formatCSV([{ a: 1 }, { b: 2 }]);
    assert.equal(csv, "a,b\n1,\n,2");
  });
  it("uses custom delimiter", () => {
    const csv = formatCSV([{ a: 1, b: 2 }], { delimiter: ";" });
    assert.equal(csv, "a;b\n1;2");
  });
  it("respects fields order", () => {
    const csv = formatCSV([{ a: 1, b: 2 }], { fields: ["b", "a"] });
    assert.equal(csv, "b,a\n2,1");
  });
  it("flattens with flatten option", () => {
    const csv = formatCSV([{ nested: { x: 1 } }], { flatten: true });
    assert.equal(csv, "nested.x\n1");
  });
});

describe("formatPretty", () => {
  it("produces aligned table", () => {
    const out = formatPretty([{ name: "Alice", age: 30 }]);
    assert.ok(out.includes("Alice"));
    assert.ok(out.includes("┼"));
  });
  it("returns empty for no rows", () => {
    assert.equal(formatPretty([]), "");
  });
});

describe("convert", () => {
  it("converts JSON to CSV", () => {
    const csv = convert('[{"x":1}]');
    assert.equal(csv, "x\n1");
  });
  it("converts JSONL to CSV", () => {
    const csv = convert('{"a":"hello"}\n{"a":"world"}');
    assert.equal(csv, "a\nhello\nworld");
  });
  it("returns empty for empty input", () => {
    assert.equal(convert(""), "");
  });
  it("handles pretty mode", () => {
    const out = convert('[{"name":"Alice","age":30}]', { pretty: true });
    assert.ok(out.includes("┼"));
    assert.ok(out.includes("Alice"));
  });
});

describe("parseArgs", () => {
  it("parses file positional", () => {
    const r = parseArgs(["data.json"]);
    assert.equal(r.file, "data.json");
  });
  it("parses output flag", () => {
    const r = parseArgs(["-o", "out.csv"]);
    assert.equal(r.output, "out.csv");
  });
  it("parses delimiter", () => {
    const r = parseArgs(["-d", ";"]);
    assert.equal(r.delimiter, ";");
  });
  it("parses no-header", () => {
    const r = parseArgs(["-n"]);
    assert.equal(r.noHeader, true);
  });
  it("parses fields", () => {
    const r = parseArgs(["-f", "a,b,c"]);
    assert.deepEqual(r.fields, ["a", "b", "c"]);
  });
  it("parses flatten and pretty", () => {
    const r = parseArgs(["--flatten", "--pretty"]);
    assert.equal(r.flatten, true);
    assert.equal(r.pretty, true);
  });
  it("parses help", () => {
    const r = parseArgs(["-h"]);
    assert.equal(r.help, true);
  });
  it("defaults", () => {
    const r = parseArgs([]);
    assert.equal(r.file, null);
    assert.equal(r.delimiter, ",");
    assert.equal(r.noHeader, false);
    assert.equal(r.flatten, false);
    assert.equal(r.pretty, false);
  });
});
