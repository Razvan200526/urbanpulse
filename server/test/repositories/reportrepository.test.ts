import { beforeEach, describe, expect, test } from "bun:test";
import { reportRepository } from "@server/repositories/ReportRepository";
import { ReportStatusEnum } from "@shared/types";
import { createReport, createUser } from "../helpers/fixtures";
import { resetDatabase } from "../helpers/testDatabase";

describe("ReportRepository", () => {
	beforeEach(resetDatabase);

	test("supports CRUD operations", async () => {
		const reporter = await createUser();
		expect(
			await reportRepository.getOne("00000000-0000-0000-0000-000000000000"),
		).toBeNull();

		const created = await reportRepository.create({
			reporterId: reporter.id,
			reason: "Harassment",
			status: ReportStatusEnum.Pending,
		});

		expect(created).not.toBeNull();
		expect((await reportRepository.getOne(created!.id))?.reason).toBe(
			"Harassment",
		);
		expect(await reportRepository.getAll()).toHaveLength(1);

		const updated = await reportRepository.update(created!.id, {
			status: ReportStatusEnum.Resolved,
		});
		expect(updated.status).toBe(ReportStatusEnum.Resolved);
		await expect(
			reportRepository.update("00000000-0000-0000-0000-000000000000", {
				reason: "Nope",
			}),
		).rejects.toThrow(
			"ReportRepository: Record with id 00000000-0000-0000-0000-000000000000 not found",
		);

		expect(await reportRepository.delete(created!.id)).toBe(true);
		expect(await reportRepository.delete(created!.id)).toBe(false);
	});

	test("returns all reports", async () => {
		await createReport();
		await createReport();

		expect(await reportRepository.getAll()).toHaveLength(2);
	});
});
