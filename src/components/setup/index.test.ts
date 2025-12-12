import { describe, expect, it } from "vitest";
import { SetupScreen } from "./SetupScreen";
import { SetupScreen as SetupScreenFromIndex } from "./index";

describe("setup index", () => {
  it("re-exports SetupScreen", () => {
    expect(SetupScreenFromIndex).toBe(SetupScreen);
  });
});
