import { describe, expect, test } from "bun:test";
import { getDrawerSurfaceClassName } from "./AppDrawer";

describe("AppDrawer", () => {
	test("uses the shared small-radius shell for side drawers", () => {
		expect(getDrawerSurfaceClassName("right")).toContain("rounded-l-sm");
		expect(getDrawerSurfaceClassName("left")).toContain("rounded-r-sm");
		expect(getDrawerSurfaceClassName("bottom")).toContain("rounded-t-sm");
		expect(getDrawerSurfaceClassName("top")).toContain("rounded-b-sm");
	});
});
