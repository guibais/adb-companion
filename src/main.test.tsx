import { describe, expect, it, vi, beforeEach } from "vitest";

const mockRender = vi.fn();
const mockCreateRoot = vi.fn(() => ({
  render: mockRender,
}));

vi.mock("react-dom/client", () => ({
  default: {
    createRoot: mockCreateRoot,
  },
  createRoot: mockCreateRoot,
}));

vi.mock("./App", () => ({
  default: () => null,
}));

vi.mock("./styles/globals.css", () => ({}));

describe("main", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '<div id="root"></div>';
    vi.resetModules();
  });

  it("renders App into root element", async () => {
    await import("./main");

    expect(mockCreateRoot).toHaveBeenCalledWith(
      document.getElementById("root")
    );
    expect(mockRender).toHaveBeenCalled();
  });
});
