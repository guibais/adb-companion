import { describe, expect, it } from "vitest";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { Sidemenu } from "./Sidemenu";
import { StatusBar } from "./StatusBar";
import * as index from "./index";

describe("layout index", () => {
  it("re-exports components", () => {
    expect(index.Header).toBe(Header);
    expect(index.Sidebar).toBe(Sidebar);
    expect(index.Sidemenu).toBe(Sidemenu);
    expect(index.StatusBar).toBe(StatusBar);
  });
});
