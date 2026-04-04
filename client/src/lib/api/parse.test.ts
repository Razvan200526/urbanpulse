import { describe, expect, test } from "bun:test";
import { z } from "zod";
import { parseApiData, parseSocketData } from "./parse";

describe("api parsers", () => {
	test("parses successful API envelopes with runtime validation", async () => {
		const response = new Response(
			JSON.stringify({
				success: true,
				message: "Loaded",
				data: { id: "user-1" },
			}),
			{
				headers: { "content-type": "application/json" },
			},
		);

		const result = await parseApiData(
			response,
			z.object({ id: z.string() }),
			"Failed",
		);

		expect(result).toEqual({
			message: "Loaded",
			data: { id: "user-1" },
		});
	});

	test("rejects invalid socket payloads", () => {
		expect(() =>
			parseSocketData(
				{
					success: true,
					message: "Updated",
					data: { pulseId: 1 },
				},
				z.object({ pulseId: z.string() }),
				"Failed",
			),
		).toThrow("Updated");
	});
});
