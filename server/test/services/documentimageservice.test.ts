import { describe, expect, mock, test } from "bun:test";
import { DocumentImageService } from "@server/services/DocumentImageService";

describe("DocumentImageService nano banana redaction", () => {
	test("returns original image when AI client is unavailable", async () => {
		const service = new DocumentImageService() as any;
		service.aiClient = null;

		const input = Buffer.from("raw-image-bytes");
		const output = await service.blurSensitiveContentWithNanoBanana(input);

		expect(output).toEqual(input);
	});

	test("uses a prompt-based redaction request without coordinate masks", async () => {
		const service = new DocumentImageService() as any;
		const generateContent = mock(async () => ({
			candidates: [
				{
					content: {
						parts: [
							{
								inlineData: {
									data: Buffer.from("blurred-result").toString("base64"),
								},
							},
						],
					},
				},
			],
		}));

		service.aiClient = {
			models: {
				generateContent,
			},
		};

		const input = Buffer.from("raw-image-bytes");
		const output = await service.blurSensitiveContentWithNanoBanana(input);

		expect(output.toString()).toBe("blurred-result");
		expect(generateContent).toHaveBeenCalledTimes(1);

		const request = generateContent.mock.calls[0]?.[0] as any;
		expect(request.model).toBe("gemini-3.1-flash-image-preview");
		expect(request.config?.responseModalities).toEqual(["TEXT", "IMAGE"]);
		expect(request.contents?.[0]?.text).toContain(
			"Blur or obscure sensitive fields",
		);
		expect(request.contents?.[0]?.text).not.toContain("x=");
		expect(request.contents?.[0]?.text).not.toContain("y=");
		expect(request.contents?.[1]?.inlineData?.data).toBeTruthy();
	});
});
