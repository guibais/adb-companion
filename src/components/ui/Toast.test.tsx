import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { useUiStore } from "../../stores";
import { ToastContainer } from "./Toast";

describe("ToastContainer", () => {
  it("renders toasts and removes on close button click", async () => {
    const user = userEvent.setup();

    useUiStore.setState({
      toasts: [
        {
          id: "t1",
          type: "success",
          title: "Saved",
          message: "Ok",
        },
      ],
    } as any);

    render(<ToastContainer />);

    expect(screen.getByText("Saved")).toBeInTheDocument();
    expect(screen.getByText("Ok")).toBeInTheDocument();

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(1);

    await user.click(buttons[0]);

    expect(useUiStore.getState().toasts).toHaveLength(0);
  });

  it("does not render message when missing", () => {
    useUiStore.setState({
      toasts: [
        {
          id: "t2",
          type: "info",
          title: "Info",
        },
      ],
    } as any);

    render(<ToastContainer />);

    expect(screen.getByText("Info")).toBeInTheDocument();
  });
});
