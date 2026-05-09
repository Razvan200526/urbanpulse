import { describe, expect, test } from "bun:test";
import { PulseEnum, UrgencyEnum } from "@shared/types";
import { isPulseRequestValid } from "./isPulseRequestValid";

describe("isPulseRequestValid", () => {
	test("accepts a complete pulse payload without a client userId", () => {
		const result = isPulseRequestValid({
			type: PulseEnum.Emergency,
			urgency: UrgencyEnum.Immediate,
			title: "Need food and water",
			description: "We need bottled water at the community center",
			position: { x: 26.1, y: 44.4 },
			imageUrls: ["https://example.com/photo.jpg"],
		});

		expect(result.success).toBe(true);
	});

	test("accepts empty descriptions", () => {
		const result = isPulseRequestValid({
			type: PulseEnum.Emergency,
			urgency: UrgencyEnum.Immediate,
			title: "Need food and water",
			description: "",
			position: { x: 26.1, y: 44.4 },
			imageUrls: [],
		});

		expect(result.success).toBe(true);
	});

	test("accepts an incident type id for emergency reports", () => {
		const result = isPulseRequestValid({
			type: PulseEnum.Emergency,
			urgency: UrgencyEnum.Immediate,
			title: "Power out",
			description: "The whole block lost electricity",
			incidentTypeId: "11111111-1111-4111-8111-111111111111",
			position: { x: 26.1, y: 44.4 },
			imageUrls: [],
		});

		expect(result.success).toBe(true);
		expect(result.pulseData?.incidentTypeId).toBe(
			"11111111-1111-4111-8111-111111111111",
		);
	});

	test("rejects invalid incident type ids", () => {
		const result = isPulseRequestValid({
			type: PulseEnum.Emergency,
			urgency: UrgencyEnum.Immediate,
			title: "Power out",
			description: "The whole block lost electricity",
			incidentTypeId: "blackout",
			position: { x: 26.1, y: 44.4 },
			imageUrls: [],
		});

		expect(result.success).toBe(false);
	});

	test("rejects markup-like content", () => {
		const result = isPulseRequestValid({
			type: PulseEnum.Emergency,
			urgency: UrgencyEnum.Immediate,
			title: "<script>alert(1)</script>",
			description: "Unsafe payload",
			position: { x: 26.1, y: 44.4 },
			imageUrls: [],
		});

		expect(result.success).toBe(false);
	});

	test("rejects invalid media urls", () => {
		const result = isPulseRequestValid({
			type: PulseEnum.Emergency,
			urgency: UrgencyEnum.Immediate,
			title: "Need food and water",
			description: "We need bottled water at the community center",
			position: { x: 26.1, y: 44.4 },
			imageUrls: ["not-a-url"],
		});

		expect(result.success).toBe(false);
	});

	test("accepts an empty audio url as missing", () => {
		const result = isPulseRequestValid({
			type: PulseEnum.Emergency,
			urgency: UrgencyEnum.Immediate,
			title: "Car stopped",
			description: "Need a mechanic to help me with the car",
			position: { x: 26.1, y: 44.4 },
			imageUrls: [],
			audioUrl: "",
		});

		expect(result.success).toBe(true);
		expect(result.pulseData?.audioUrl).toBeUndefined();
	});
});
