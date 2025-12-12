import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { DevToolsPage } from "./DevToolsPage";
import { useUiStore } from "../stores";

describe("DevToolsPage", () => {
  beforeEach(() => {
    useUiStore.setState({ toasts: [] } as any);
  });

  it("renders empty state when no tools", async () => {
    ((window as any).electronAPI as any)["devtools:check"] = vi.fn(
      async () => []
    );

    render(<DevToolsPage />);

    await waitFor(() => {
      expect(
        ((window as any).electronAPI as any)["devtools:check"]
      ).toHaveBeenCalled();
    });

    expect(screen.getByText("No Tools Available")).toBeInTheDocument();
  });

  it("downloads and launches tools", async () => {
    const user = userEvent.setup();

    const checkMock = vi
      .fn()
      .mockResolvedValueOnce([
        {
          id: "reactotron",
          name: "Reactotron",
          description: "Desc",
          version: "1",
          isInstalled: false,
          isRunning: false,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "reactotron",
          name: "Reactotron",
          description: "Desc",
          version: "1",
          isInstalled: true,
          isRunning: false,
          path: "/tmp/reactotron",
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "reactotron",
          name: "Reactotron",
          description: "Desc",
          version: "1",
          isInstalled: true,
          isRunning: true,
          path: "/tmp/reactotron",
        },
      ])
      .mockResolvedValue([
        {
          id: "reactotron",
          name: "Reactotron",
          description: "Desc",
          version: "1",
          isInstalled: true,
          isRunning: true,
          path: "/tmp/reactotron",
        },
      ]);

    ((window as any).electronAPI as any)["devtools:check"] = checkMock;

    ((window as any).electronAPI as any)["devtools:download"] = vi.fn(
      async () => undefined
    );
    ((window as any).electronAPI as any)["devtools:launch"] = vi.fn(
      async () => undefined
    );
    ((window as any).electronAPI as any)["devtools:stop"] = vi.fn(
      async () => undefined
    );

    render(<DevToolsPage />);

    await waitFor(() => {
      expect(screen.getByText("Reactotron")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /Download/i }));
    expect(
      ((window as any).electronAPI as any)["devtools:download"]
    ).toHaveBeenCalledWith("reactotron");

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Launch/i })
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /Launch/i }));
    expect(
      ((window as any).electronAPI as any)["devtools:launch"]
    ).toHaveBeenCalledWith("reactotron");

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Stop/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /Stop/i }));
    expect(
      ((window as any).electronAPI as any)["devtools:stop"]
    ).toHaveBeenCalledWith("reactotron");

    expect(useUiStore.getState().toasts.length).toBeGreaterThan(0);
  });
});
