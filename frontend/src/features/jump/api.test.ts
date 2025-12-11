// Add a minimal smoke test to ensure the module exports are present
import { describe, it, expect } from "vitest";
import * as api from "./api";

describe("jump api exports", () => {
	it("exports expected functions", () => {
		expect(typeof api.fetchJumps).toBe("function");
		expect(typeof api.createJump).toBe("function");
		expect(typeof api.addSkydiverToJump).toBe("function");
		expect(typeof api.addPilotToJump).toBe("function");
	});
});
