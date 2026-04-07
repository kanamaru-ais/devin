import { describe, it, expect } from "vitest";
import { formatDate, formatDateTime } from "./date";

describe("formatDate", () => {
  it("日付文字列からT以前の部分を返す", () => {
    expect(formatDate("2026-04-01T10:00:00")).toBe("2026-04-01");
  });

  it("Tを含まない日付文字列をそのまま返す", () => {
    expect(formatDate("2026-04-01")).toBe("2026-04-01");
  });

  it("nullの場合は'-'を返す", () => {
    expect(formatDate(null)).toBe("-");
  });

  it("空文字の場合は'-'を返す", () => {
    expect(formatDate("")).toBe("-");
  });
});

describe("formatDateTime", () => {
  it("日時文字列をja-JP形式でフォーマットする", () => {
    const result = formatDateTime("2026-04-01 10:00:00");
    expect(result).toMatch(/2026/);
    expect(result).toMatch(/04/);
    expect(result).toMatch(/01/);
  });

  it("末尾にZが付いた文字列も正しく処理する", () => {
    const result = formatDateTime("2026-04-01T10:00:00Z");
    expect(result).toMatch(/2026/);
  });
});
