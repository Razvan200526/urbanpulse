import type { petAlert } from "@server/db/schema";
import { seedIds } from "@server/seed/constants";
import { PetAlertTypeEnum } from "@shared/types";

type PetAlertInsert = typeof petAlert.$inferInsert;

export const petAlertSeeds: PetAlertInsert[] = [
	{
		id: seedIds.petAlerts.lostDog,
		pulseId: seedIds.pulses.lostDog,
		alertType: PetAlertTypeEnum.Lost,
		petType: "Dog",
		color: "Golden",
		breed: "Golden Retriever",
		imageUrl:
			"https://images.unsplash.com/photo-1552053831-71594a27632d?w=1200",
		aiDescriptor: "Medium-large golden retriever with red collar.",
	},
	{
		id: seedIds.petAlerts.foundDog,
		pulseId: seedIds.pulses.foundDog,
		alertType: PetAlertTypeEnum.Found,
		petType: "Dog",
		color: "Golden",
		breed: "Golden Retriever",
		imageUrl:
			"https://images.unsplash.com/photo-1552053831-71594a27632d?w=1200",
		aiDescriptor: "Looks like Luna, seen near Izvor station.",
	},
];
