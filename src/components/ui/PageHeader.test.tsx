import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { useUiStore } from "../../stores";
import { PageHeader } from "./PageHeader";

describe("PageHeader", () => {
  it("renders title, description and children", () => {
    useUiStore.setState({ currentPage: "apps" } as any);

    render(
      <PageHeader title="Title" description="Desc">
        <button>Action</button>
      </PageHeader>
    );

    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Desc")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Action" })).toBeInTheDocument();
  });

  it("navigates back to device on back button", async () => {
    const user = userEvent.setup();
    useUiStore.setState({ currentPage: "apps" } as any);

    render(<PageHeader title="Apps" />);

    const backButton = screen.getAllByRole("button")[0];
    await user.click(backButton);

    expect(useUiStore.getState().currentPage).toBe("device");
  });
});
