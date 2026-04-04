import { describe, expect, test } from "bun:test";
import { RequestMatchingAIService } from "@server/services/RequestMatchingAIService";

class TestRequestMatchingAIService extends RequestMatchingAIService {
	protected override async generateJson<T>(_prompt: string): Promise<T | null> {
		return null;
	}
}

describe("RequestMatchingAIService", () => {
	test("matches free-form mechanic skills with a car repair request", async () => {
		const service = new TestRequestMatchingAIService();

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
});
