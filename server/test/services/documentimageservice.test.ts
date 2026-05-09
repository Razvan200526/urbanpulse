import { describe, expect, test } from "bun:test";
import { DocumentImageService } from "@server/services/DocumentImageService";
import { LostDocumentTypeEnum } from "@shared/types";
import Sharp from "sharp";

const buildImageBuffer = async (width: number, height: number): Promise<Buffer> => {
	return await Sharp({
		create: {
			width,
			height,
			channels: 3,
			background: { r: 245, g: 245, b: 245 },
		},
	})
		.jpeg()
		.toBuffer();
};

describe("DocumentImageService deterministic masking", () => {
	test("applies all mandatory Romanian ID masks in landscape", async () => {
		const service = new DocumentImageService();
		const imageBuffer = await buildImageBuffer(1000, 620);

		const plan = await (service as any).buildMaskPlan(
			imageBuffer,
			[],
			LostDocumentTypeEnum.IdCard,
		);

		expect(plan.orientation).toBe("landscape");
		expect(plan.mandatoryMasks.map((mask: any) => mask.kind).sort()).toEqual([
			"ADDRESS",
			"CNP",
			"SERIES_NUMBER",
		]);
	});

	test("maps mandatory masks for portrait Romanian ID inputs", async () => {
		const service = new DocumentImageService();
		const imageBuffer = await buildImageBuffer(620, 1000);

		const plan = await (service as any).buildMaskPlan(
			imageBuffer,
			[],
			LostDocumentTypeEnum.IdCard,
		);

		expect(plan.orientation).toBe("portrait-cw");
		const cnpMask = plan.mandatoryMasks.find((mask: any) => mask.kind === "CNP");
		expect(cnpMask).toBeTruthy();
		expect(cnpMask.h).toBeGreaterThan(cnpMask.w);
		expect(cnpMask.x).toBeGreaterThan(250);
		expect(cnpMask.x).toBeLessThan(420);
	});

	test("keeps mandatory CNP mask even when AI misses it", async () => {
		const service = new DocumentImageService();
		const imageBuffer = await buildImageBuffer(1000, 620);

		const plan = await (service as any).buildMaskPlan(
			imageBuffer,
			[
				{
					x: 0.47,
					y: 0.6,
					w: 0.42,
					h: 0.23,
					kind: "ADDRESS",
				},
			],
			LostDocumentTypeEnum.IdCard,
		);

		expect(plan.mandatoryMasks.some((mask: any) => mask.kind === "CNP")).toBe(true);
	});

	test("rejects overbroad AI masks that overlap protected face/name zones", async () => {
		const service = new DocumentImageService();
		const imageBuffer = await buildImageBuffer(1000, 620);

		const plan = await (service as any).buildMaskPlan(
			imageBuffer,
			[
				{
					x: 0.02,
					y: 0.18,
					w: 0.62,
					h: 0.53,
					kind: "SENSITIVE_TEXT",
				},
			],
			LostDocumentTypeEnum.IdCard,
		);

		expect(plan.aiMasks.length).toBe(0);
	});
});
