import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import { Hono } from "hono";
import type { Variables } from "@server/app";
import { lostDocumentController } from "@server/controllers/LostDocumentController";
import { lostDocumentRepository } from "@server/repositories/LostDocumentRepository";
import { lostDocumentService } from "@server/services/LostDocumentService";

const buildDocument = () => ({
	id: "doc-1",
	userId: "owner-1",
	documentType: "id_card",
	extractedName: "John Doe",
	extractedFirstName: "John",
	extractedBirthYear: 1990,
	extractedCity: "Bucuresti",
	originalImageKey: "lost-documents/original/doc.webp",
	blurredImageUrl: "https://cdn.example.com/lost-documents/blurred/doc.webp",
	embeddingVector: null,
	embeddingModel: null,
	embeddingStatus: "ready",
	embeddingUpdatedAt: null,
	sensitiveRegions: [],
	createdAt: new Date("2026-01-01T00:00:00.000Z"),
	updatedAt: new Date("2026-01-01T00:00:00.000Z"),
});

const createTestApp = (userRole: "admin" | "user", sessionUserId: string) => {
	return new Hono<{ Variables: Variables }>()
		.use("*", async (c, next) => {
			c.set("session", { userId: sessionUserId } as any);
			c.set("user", { role: userRole } as any);
			await next();
		})
		.route("/api", lostDocumentController);
};

afterEach(() => {
	mock.restore();
});

describe("LostDocumentController debugMask", () => {
	test("returns admin debug overlay metadata when debugMask=true", async () => {
		spyOn(lostDocumentRepository, "getOne").mockResolvedValue(
			buildDocument() as any,
		);
		spyOn(lostDocumentService, "getDocumentForAdmin").mockResolvedValue(
			"https://signed.example.com/original",
		);
		spyOn(lostDocumentService, "getDebugMaskForAdmin").mockResolvedValue({
			overlayUrl: "https://signed.example.com/debug-overlay",
			orientation: "landscape",
			appliedMasks: [
				{
					x: 100,
					y: 200,
					w: 240,
					h: 60,
					kind: "CNP",
					source: "mandatory",
				},
			],
		});

		const app = createTestApp("admin", "admin-1");
		const response = await app.request(
			"http://localhost/api/lost-documents/doc-1?debugMask=true",
		);
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload.success).toBe(true);
		expect(payload.data.debugMask).toBeTruthy();
		expect(payload.data.debugMask.overlayUrl).toBe(
			"https://signed.example.com/debug-overlay",
		);
		expect(payload.data.debugMask.appliedMasks[0].source).toBe("mandatory");
	});

	test("does not expose debug overlay for non-admin even when debugMask=true", async () => {
		spyOn(lostDocumentRepository, "getOne").mockResolvedValue(
			buildDocument() as any,
		);
		const adminDebugSpy = spyOn(
			lostDocumentService,
			"getDebugMaskForAdmin",
		).mockResolvedValue(null);

		const app = createTestApp("user", "viewer-2");
		const response = await app.request(
			"http://localhost/api/lost-documents/doc-1?debugMask=true",
		);
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload.success).toBe(true);
		expect(payload.data.debugMask).toBeUndefined();
		expect(adminDebugSpy).not.toHaveBeenCalled();
	});

	test("keeps standard response shape when debugMask is not requested", async () => {
		spyOn(lostDocumentRepository, "getOne").mockResolvedValue(
			buildDocument() as any,
		);
		spyOn(lostDocumentService, "getDocumentForAdmin").mockResolvedValue(
			"https://signed.example.com/original",
		);

		const app = createTestApp("admin", "admin-1");
		const response = await app.request("http://localhost/api/lost-documents/doc-1");
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload.success).toBe(true);
		expect(payload.data.imageUrl).toBe("https://signed.example.com/original");
		expect(payload.data.debugMask).toBeUndefined();
	});
});
