import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { Sidemenu } from "./Sidemenu";
import { useUiStore } from "../../stores";

describe("Sidemenu", () => {
  beforeEach(() => {
    useUiStore.setState({
      currentPage: "device",
      sidebarCollapsed: false,
    } as any);
  });

  it("navigates when clicking menu items", async () => {
    const user = userEvent.setup();

    render(<Sidemenu />);

    await user.click(screen.getByRole("button", { name: /Applications/i }));
    expect(useUiStore.getState().currentPage).toBe("apps");

    await user.click(screen.getByRole("button", { name: /Logcat/i }));
    expect(useUiStore.getState().currentPage).toBe("logcat");
  });

  it("toggles collapsed state", async () => {
    const user = userEvent.setup();

    render(<Sidemenu />);

    await user.click(screen.getByRole("button", { name: "Collapse" }));
    expect(useUiStore.getState().sidebarCollapsed).toBe(true);
  });
});
