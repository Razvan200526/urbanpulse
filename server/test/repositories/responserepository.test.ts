import { beforeEach, describe, expect, test } from "bun:test";
import { responseRepository } from "@server/repositories/ResponseRepository";
import { ResponseStatusEnum } from "@shared/types";
import { createPulse, createResponse, createUser } from "../helpers/fixtures";
import { resetDatabase } from "../helpers/testDatabase";

describe("ResponseRepository", () => {
	beforeEach(resetDatabase);

	test("supports CRUD operations", async () => {
		const pulse = await createPulse();
		const responder = await createUser();
		expect(
			await responseRepository.getOne("00000000-0000-0000-0000-000000000000"),
		).toBeNull();

		const created = await responseRepository.create({
			pulseId: pulse.id,
			responderId: responder.id,
			status: ResponseStatusEnum.Pending,
		});

		expect(created).not.toBeNull();
		expect((await responseRepository.getOne(created!.id))?.responderId).toBe(
			responder.id,
		);
		expect(await responseRepository.getAll()).toHaveLength(1);

		const updated = await responseRepository.update(created!.id, {
			status: ResponseStatusEnum.Accepted,
		});
		expect(updated.status).toBe(ResponseStatusEnum.Accepted);
		await expect(
			responseRepository.update("00000000-0000-0000-0000-000000000000", {
				status: ResponseStatusEnum.Declined,
			}),
		).rejects.toThrow(
			"ResponseRepository: Record with id 00000000-0000-0000-0000-000000000000 not found",
		);

		expect(await responseRepository.delete(created!.id)).toBe(true);
		expect(await responseRepository.delete(created!.id)).toBe(false);
	});

	test("finds a response by pulse and responder", async () => {
		const pulse = await createPulse();
		const responder = await createUser();
		const response = await createResponse({
			pulseId: pulse.id,
			responderId: responder.id,
		});

		expect(
			(await responseRepository.findByPulseAndResponder(pulse.id, responder.id))
				?.id,
		).toBe(response.id);
		expect(
			await responseRepository.findByPulseAndResponder(
				pulse.id,
				"missing-user",
			),
		).toBeNull();
	});

	test("declines other pending responses for the same pulse", async () => {
		const pulse = await createPulse();
		const accepted = await createResponse({
			pulseId: pulse.id,
			status: ResponseStatusEnum.Accepted,
		});
		const pendingOne = await createResponse({
			pulseId: pulse.id,
			status: ResponseStatusEnum.Pending,
		});
		const pendingTwo = await createResponse({
			pulseId: pulse.id,
			status: ResponseStatusEnum.Pending,
		});
		const otherPulsePending = await createResponse({
			status: ResponseStatusEnum.Pending,
		});

		await responseRepository.declineOtherPendingForPulse(pulse.id, accepted.id);

		expect((await responseRepository.getOne(accepted.id))?.status).toBe(
			ResponseStatusEnum.Accepted,
		);
		expect((await responseRepository.getOne(pendingOne.id))?.status).toBe(
			ResponseStatusEnum.Declined,
		);
		expect((await responseRepository.getOne(pendingTwo.id))?.status).toBe(
			ResponseStatusEnum.Declined,
		);
		expect(
			(await responseRepository.getOne(otherPulsePending.id))?.status,
		).toBe(ResponseStatusEnum.Pending);
	});
});
