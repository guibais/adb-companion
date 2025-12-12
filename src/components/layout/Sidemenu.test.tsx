import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Sidemenu } from "./Sidemenu";
import { useUiStore } from "../../stores";

vi.mock("../../../package.json", () => ({
  default: { version: "1.2.3" },
}));

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

  it("displays version when expanded", () => {
    render(<Sidemenu />);
    expect(screen.getByText("v1.2.3")).toBeInTheDocument();
  });

  it("hides version when collapsed", () => {
    useUiStore.setState({
      currentPage: "device",
      sidebarCollapsed: true,
    } as any);

    render(<Sidemenu />);
    expect(screen.queryByText("v1.2.3")).toBeNull();
  });
});
