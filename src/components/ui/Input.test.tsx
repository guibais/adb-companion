import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Input } from "./Input";

describe("Input", () => {
  it("renders label and input", () => {
    render(<Input label="Email" placeholder="type" />);

    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("type")).toBeInTheDocument();
  });

  it("renders error and applies danger styles", () => {
    render(<Input error="Required" />);

    expect(screen.getByText("Required")).toBeInTheDocument();

    const input = screen.getByRole("textbox");
    expect(input.className).toContain("border-danger");
  });

  it("renders icon wrapper when icon is provided", () => {
    render(<Input icon={<span data-testid="icon">i</span>} />);

    expect(screen.getByTestId("icon")).toBeInTheDocument();

    const input = screen.getByRole("textbox");
    expect(input.className).toContain("pl-10");
  });
});
