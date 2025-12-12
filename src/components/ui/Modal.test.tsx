import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Modal } from "./Modal";

describe("Modal", () => {
  it("renders nothing when closed", () => {
    render(
      <Modal isOpen={false} onClose={() => undefined}>
        Content
      </Modal>
    );

    expect(screen.queryByText("Content")).toBeNull();
  });

  it("renders title and children when open", () => {
    render(
      <Modal isOpen onClose={() => undefined} title="Hello">
        Content
      </Modal>
    );

    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("calls onClose on overlay click", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    const { container } = render(
      <Modal isOpen onClose={onClose}>
        Content
      </Modal>
    );

    const overlay = container.querySelector(
      ".absolute.inset-0.bg-black\\/60"
    ) as HTMLElement;

    await user.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose on Escape", () => {
    const onClose = vi.fn();

    render(
      <Modal isOpen onClose={onClose}>
        Content
      </Modal>
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("hides close button when showCloseButton=false", () => {
    render(
      <Modal isOpen onClose={() => undefined} showCloseButton={false}>
        Content
      </Modal>
    );

    const buttons = screen.queryAllByRole("button");
    expect(buttons).toHaveLength(0);
  });
});
