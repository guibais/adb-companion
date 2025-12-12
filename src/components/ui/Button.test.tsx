import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  it("renders children and calls onClick", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<Button onClick={onClick}>Click</Button>);

    await user.click(screen.getByRole("button", { name: "Click" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when loading", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <Button loading onClick={onClick}>
        Save
      </Button>
    );

    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toBeDisabled();

    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("applies variant and size styles", () => {
    const { rerender } = render(
      <Button variant="ghost" size="sm">
        Ghost
      </Button>
    );

    expect(screen.getByRole("button", { name: "Ghost" }).className).toContain(
      "bg-transparent"
    );
    expect(screen.getByRole("button", { name: "Ghost" }).className).toContain(
      "px-3"
    );

    rerender(
      <Button variant="danger" size="lg">
        Danger
      </Button>
    );

    expect(screen.getByRole("button", { name: "Danger" }).className).toContain(
      "bg-danger"
    );
    expect(screen.getByRole("button", { name: "Danger" }).className).toContain(
      "px-6"
    );
  });
});
