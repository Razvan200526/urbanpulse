import { describe, expect, test } from "bun:test";
import { RequestMatchingAIService } from "@server/services/RequestMatchingAIService";

describe("RequestMatchingAIService", () => {
	test("matches free-form mechanic skills with a car repair request", async () => {
		const service = new RequestMatchingAIService();

		const result = await service.inferSkillTags({
			title: "Car stopped",
			description: "Need a mechanic to help me with the car",
			allowedTags: ["Mechanic Skills", "Car Fixing", "First Aid"],
		});

		expect(result.provider).toBe("keyword");
		expect(result.tags).toEqual(["mechanic-skills", "car-fixing"]);
		expect(result.matchedKeywords).toEqual(
			expect.arrayContaining(["mechanic", "car"]),
		);
	});

	test("matches practical helper tags without AI assistance", async () => {
		const service = new RequestMatchingAIService();

		const result = await service.inferSkillTags({
			title: "Need help with a dead car battery",
			description: "My car won't start and I may need a jump start nearby",
			allowedTags: ["Car Battery Jumpstart", "Flat Tire Change", "First Aid"],
		});

		expect(result.provider).toBe("keyword");
		expect(result.tags[0]).toBe("car-battery-jumpstart");
		expect(result.tags).not.toContain("first-aid");
		expect(result.matchedKeywords).toEqual(
			expect.arrayContaining(["battery", "jump start"]),
		);
	});
});
