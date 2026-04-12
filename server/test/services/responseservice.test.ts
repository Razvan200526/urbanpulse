import { beforeEach, describe, expect, test } from "bun:test";
import { responseRepository } from "@server/repositories/ResponseRepository";
import { userRepository } from "@server/repositories/UserRepository";
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
		expect(
			(await userRepository.getOne(responder.id))?.failedInteractions,
		).toBe(1);
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

	test("reuses the same coordination conversation when the same responder is accepted on different pulses", async () => {
		const owner = await createUser();
		const responder = await createUser();
		const firstPulse = await createPulse({ userId: owner.id });
		const secondPulse = await createPulse({ userId: owner.id });
		const firstResponse = await createResponse({
			pulseId: firstPulse.id,
			responderId: responder.id,
			status: ResponseStatusEnum.Pending,
		});
		const secondResponse = await createResponse({
			pulseId: secondPulse.id,
			responderId: responder.id,
			status: ResponseStatusEnum.Pending,
		});

		const firstAccepted = await responseService.acceptHelpOffer(
			owner.id,
			firstPulse.id,
			firstResponse.id,
		);
		const secondAccepted = await responseService.acceptHelpOffer(
			owner.id,
			secondPulse.id,
			secondResponse.id,
		);

		expect(firstAccepted?.conversationId).toBeTruthy();
		expect(secondAccepted?.conversationId).toBe(firstAccepted?.conversationId);
	});

	test("creates separate coordination conversations for different responders", async () => {
		const owner = await createUser();
		const firstResponder = await createUser();
		const secondResponder = await createUser();
		const firstPulse = await createPulse({ userId: owner.id });
		const secondPulse = await createPulse({ userId: owner.id });
		const firstResponse = await createResponse({
			pulseId: firstPulse.id,
			responderId: firstResponder.id,
			status: ResponseStatusEnum.Pending,
		});
		const secondResponse = await createResponse({
			pulseId: secondPulse.id,
			responderId: secondResponder.id,
			status: ResponseStatusEnum.Pending,
		});

		const firstAccepted = await responseService.acceptHelpOffer(
			owner.id,
			firstPulse.id,
			firstResponse.id,
		);
		const secondAccepted = await responseService.acceptHelpOffer(
			owner.id,
			secondPulse.id,
			secondResponse.id,
		);

		expect(firstAccepted?.conversationId).toBeTruthy();
		expect(secondAccepted?.conversationId).toBeTruthy();
		expect(secondAccepted?.conversationId).not.toBe(
			firstAccepted?.conversationId,
		);
	});

	test("bumps trust score after every third accepted pulse help", async () => {
		const owner = await createUser();
		const responder = await createUser({
			successfulInteractions: 2,
			trustScore: 80,
			isVerified: false,
		});
		const pulse = await createPulse({ userId: owner.id });
		const response = await createResponse({
			pulseId: pulse.id,
			responderId: responder.id,
			status: ResponseStatusEnum.Pending,
		});

		await responseService.acceptHelpOffer(owner.id, pulse.id, response.id);

		expect(await userRepository.getOne(responder.id)).toEqual(
			expect.objectContaining({
				successfulInteractions: 3,
				trustScore: 85,
				isVerified: true,
			}),
		);
	});

	test("lowers trust score after every third rejected pulse help", async () => {
		const owner = await createUser();
		const responder = await createUser({
			failedInteractions: 2,
			trustScore: 80,
		});
		const pulse = await createPulse({ userId: owner.id });
		const response = await createResponse({
			pulseId: pulse.id,
			responderId: responder.id,
			status: ResponseStatusEnum.Pending,
		});

		await responseService.rejectHelpOffer(owner.id, pulse.id, response.id);

		expect(await userRepository.getOne(responder.id)).toEqual(
			expect.objectContaining({
				failedInteractions: 3,
				trustScore: 75,
			}),
		);
	});
});
