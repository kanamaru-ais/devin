import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ErrorAlert from "./ErrorAlert";

describe("ErrorAlert", () => {
  it("エラーがある場合にエラーメッセージを表示する", () => {
    render(<ErrorAlert errors={["エラー1", "エラー2"]} />);

    expect(screen.getByText("エラー1")).toBeDefined();
    expect(screen.getByText("エラー2")).toBeDefined();
  });

  it("エラーが空の場合は何も表示しない", () => {
    const { container } = render(<ErrorAlert errors={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("エラーメッセージがリスト形式で表示される", () => {
    render(<ErrorAlert errors={["エラー1"]} />);

    const listItems = screen.getAllByRole("listitem");
    expect(listItems).toHaveLength(1);
    expect(listItems[0].textContent).toBe("エラー1");
  });
});
