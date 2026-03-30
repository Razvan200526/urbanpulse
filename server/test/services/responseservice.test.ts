import { beforeEach, describe, expect, test } from "bun:test";
import { responseRepository } from "@server/repositories/ResponseRepository";
import { responseService } from "@server/services/ResponseService";
import { ResponseStatusEnum } from "@shared/types";
import { createPulse, createResponse, createUser } from "../helpers/fixtures";
import { resetDatabase } from "../helpers/testDatabase";

describe("ResponseService", () => {
	beforeEach(resetDatabase);

	test("rejects a pending help offer only for the pulse owner", async () => {
		const owner = await createUser();
		const pulse = await createPulse({ userId: owner.id });
		const responder = await createUser();
		const response = await createResponse({
			pulseId: pulse.id,
			responderId: responder.id,
			status: ResponseStatusEnum.Pending,
		});

		const rejected = await responseService.rejectHelpOffer(
			owner.id,
			pulse.id,
			response.id,
		);

		expect(rejected?.status).toBe(ResponseStatusEnum.Declined);
		expect((await responseRepository.getOne(response.id))?.status).toBe(
			ResponseStatusEnum.Declined,
		);
	});

	test("does not reject help offers for non-owners", async () => {
		const owner = await createUser();
		const outsider = await createUser();
		const pulse = await createPulse({ userId: owner.id });
		const response = await createResponse({
			pulseId: pulse.id,
			status: ResponseStatusEnum.Pending,
		});

		const rejected = await responseService.rejectHelpOffer(
			outsider.id,
			pulse.id,
			response.id,
		);

		expect(rejected).toBeNull();
		expect((await responseRepository.getOne(response.id))?.status).toBe(
			ResponseStatusEnum.Pending,
		);
	});
});
