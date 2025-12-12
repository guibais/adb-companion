import { beforeEach, describe, expect, it, vi } from "vitest";
import { useUiStore } from "./ui.store";

describe("useUiStore", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01T00:00:00.000Z"));

    useUiStore.setState({
      currentPage: "connect",
      sidebarCollapsed: false,
      toasts: [],
      modal: { type: null },
      isSetupComplete: false,
    } as any);

    window.localStorage.clear();
  });

  it("navigates pages", () => {
    useUiStore.getState().setCurrentPage("device");
    expect(useUiStore.getState().currentPage).toBe("device");
  });

  it("toggles sidebar", () => {
    useUiStore.getState().toggleSidebar();
    expect(useUiStore.getState().sidebarCollapsed).toBe(true);

    useUiStore.getState().setSidebarCollapsed(false);
    expect(useUiStore.getState().sidebarCollapsed).toBe(false);
  });

  it("opens and closes modal", () => {
    useUiStore.getState().openModal("confirm", { foo: "bar" });
    expect(useUiStore.getState().modal.type).toBe("confirm");

    useUiStore.getState().closeModal();
    expect(useUiStore.getState().modal.type).toBe(null);
  });

  it("adds and auto-removes toast", () => {
    useUiStore.getState().addToast({
      type: "success",
      title: "Ok",
      message: "Done",
    });

    expect(useUiStore.getState().toasts).toHaveLength(1);

    vi.advanceTimersByTime(5000);

    expect(useUiStore.getState().toasts).toHaveLength(0);
  });

  it("sets setup complete", () => {
    useUiStore.getState().setSetupComplete(true);
    expect(useUiStore.getState().isSetupComplete).toBe(true);
  });
});
