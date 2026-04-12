import { beforeEach, describe, expect, spyOn, test } from "bun:test";
import { notificationService } from "@server/services/NotificationService";
import { petMatchService } from "@server/services/PetMatchService";
import { PetAlertTypeEnum } from "@shared/types";
import {
	createPetAlert,
	createPetMatch,
	createPulse,
	createUser,
} from "../helpers/fixtures";
import { resetDatabase } from "../helpers/testDatabase";

describe("PetMatchService", () => {
	beforeEach(resetDatabase);

	test("does not surface or notify self-owned pet matches", async () => {
		const owner = await createUser({ name: "Owner" });
		const lostPulse = await createPulse({ userId: owner.id });
		const foundPulse = await createPulse({ userId: owner.id });
		const lostAlert = await createPetAlert({
			pulseId: lostPulse.id,
			alertType: PetAlertTypeEnum.Lost,
		});
		const foundAlert = await createPetAlert({
			pulseId: foundPulse.id,
			alertType: PetAlertTypeEnum.Found,
		});
		const match = await createPetMatch({
			lostAlertId: lostAlert.id,
			foundAlertId: foundAlert.id,
		});
		const notifySpy = spyOn(
			notificationService,
			"notifyUsers",
		).mockResolvedValue(undefined);

		await expect(
			petMatchService.listForAlert(lostAlert.id, owner.id),
		).resolves.toEqual([]);

		await petMatchService.notifyCandidateMatches([match.id]);

		expect(notifySpy).not.toHaveBeenCalled();
	});
});
