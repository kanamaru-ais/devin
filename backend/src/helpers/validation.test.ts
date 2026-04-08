import { describe, it, expect } from "vitest";
import { formatValidationErrors } from "./validation.js";
import { ValidationError, FieldValidationError } from "express-validator";

describe("formatValidationErrors", () => {
  it("フィールドエラーを正しくフォーマットする", () => {
    const errors: ValidationError[] = [
      {
        type: "field",
        path: "title",
        msg: "タイトルは必須です",
        value: "",
        location: "body",
      } as FieldValidationError,
    ];

    const result = formatValidationErrors(errors);

    expect(result).toEqual([
      { field: "title", message: "タイトルは必須です" },
    ]);
  });

  it("複数のエラーを正しくフォーマットする", () => {
    const errors: ValidationError[] = [
      {
        type: "field",
        path: "title",
        msg: "タイトルは必須です",
        value: "",
        location: "body",
      } as FieldValidationError,
      {
        type: "field",
        path: "name",
        msg: "プロジェクト名は255文字以内で入力してください",
        value: "a".repeat(256),
        location: "body",
      } as FieldValidationError,
    ];

    const result = formatValidationErrors(errors);

    expect(result).toEqual([
      { field: "title", message: "タイトルは必須です" },
      { field: "name", message: "プロジェクト名は255文字以内で入力してください" },
    ]);
  });

  it("フィールド以外のエラータイプではfieldが空文字になる", () => {
    const errors: ValidationError[] = [
      {
        type: "alternative",
        msg: "代替エラー",
        nestedErrors: [],
      } as unknown as ValidationError,
    ];

    const result = formatValidationErrors(errors);

    expect(result).toEqual([
      { field: "", message: "代替エラー" },
    ]);
  });

  it("空の配列を渡すと空の配列を返す", () => {
    const result = formatValidationErrors([]);
    expect(result).toEqual([]);
  });
});
