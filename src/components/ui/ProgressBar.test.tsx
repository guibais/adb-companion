import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProgressBar } from "./ProgressBar";

describe("ProgressBar", () => {
  it("renders without label by default", () => {
    render(<ProgressBar value={10} />);

    expect(screen.queryByText("10%")).toBeNull();
  });

  it("shows computed label percentage when showLabel is true", () => {
    render(<ProgressBar value={1} max={3} showLabel />);

    expect(screen.getByText("33%")).toBeInTheDocument();
  });

  it("clamps percentage between 0 and 100", () => {
    const { rerender, container } = render(
      <ProgressBar value={-10} max={100} />
    );

    const bar = container.querySelector("div[style]") as HTMLDivElement | null;

    expect(bar?.style.width).toBe("0%");

    rerender(<ProgressBar value={200} max={100} />);
    const bar2 = container.querySelector("div[style]") as HTMLDivElement | null;

    expect(bar2?.style.width).toBe("100%");
  });

  it("renders custom label", () => {
    render(<ProgressBar value={50} label="Downloading" showLabel />);

    expect(screen.getByText("Downloading")).toBeInTheDocument();
  });
});
