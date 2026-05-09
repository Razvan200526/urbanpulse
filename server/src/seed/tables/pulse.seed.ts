import type { pulse } from "@server/db/schema";
import { seedIds } from "@server/seed/constants";
import {
	PulseEnum,
	PulseStatusEnum,
	PulseUploadStateEnum,
	UrgencyEnum,
} from "@shared/types";

type PulseInsert = typeof pulse.$inferInsert;

export const pulseSeeds: PulseInsert[] = [
	{
		id: seedIds.pulses.lostDog,
		type: PulseEnum.Emergency,
		incidentTypeId: seedIds.incidentTypes.other,
		userId: seedIds.users.maria,
		urgency: UrgencyEnum.Immediate,
		title: "Lost golden retriever",
		description:
			"Friendly golden retriever missing near Cismigiu Park. Responds to name Luna.",
		position: { x: 26.0914, y: 44.4378 },
		status: PulseStatusEnum.Active,
		pulseUploadState: PulseUploadStateEnum.Completed,
		audioUrl: null,
		imageUrls: [
			"https://images.unsplash.com/photo-1552053831-71594a27632d?w=1200",
		],
		isResolved: false,
		isVerified: true,
		createdAt: new Date("2026-03-31T08:20:00.000Z"),
	},
	{
		id: seedIds.pulses.bloodDrive,
		type: PulseEnum.Skill,
		userId: seedIds.users.vlad,
		urgency: UrgencyEnum.Urgent,
		title: "Urgent blood donor need",
		description:
			"O- donor needed at Floreasca Hospital for emergency surgery this afternoon.",
		position: { x: 26.1022, y: 44.4684 },
		status: PulseStatusEnum.Active,
		pulseUploadState: PulseUploadStateEnum.Completed,
		audioUrl: null,
		imageUrls: [],
		isResolved: false,
		isVerified: true,
		createdAt: new Date("2026-03-31T09:10:00.000Z"),
	},
	{
		id: seedIds.pulses.powerOutage,
		type: PulseEnum.Item,
		userId: seedIds.users.daniel,
		urgency: UrgencyEnum.NotUrgent,
		title: "Need generator for outage",
		description:
			"Temporary generator needed for 24h in Sector 6 while local outage is fixed.",
		position: { x: 26.0276, y: 44.4306 },
		status: PulseStatusEnum.Active,
		pulseUploadState: PulseUploadStateEnum.Uploaded,
		audioUrl: null,
		imageUrls: [],
		isResolved: false,
		isVerified: false,
		createdAt: new Date("2026-03-31T07:35:00.000Z"),
	},
	{
		id: seedIds.pulses.medicalRide,
		type: PulseEnum.Skill,
		userId: seedIds.users.elena,
		urgency: UrgencyEnum.Urgent,
		title: "Need ride to clinic",
		description:
			"Elderly neighbor needs transport to Colentina clinic at 15:00 today.",
		position: { x: 26.1304, y: 44.4592 },
		status: PulseStatusEnum.Resolved,
		pulseUploadState: PulseUploadStateEnum.Completed,
		audioUrl: null,
		imageUrls: [],
		isResolved: true,
		isVerified: true,
		createdAt: new Date("2026-03-30T15:05:00.000Z"),
	},
	{
		id: seedIds.pulses.foundDog,
		type: PulseEnum.Emergency,
		incidentTypeId: seedIds.incidentTypes.other,
		userId: seedIds.users.irina,
		urgency: UrgencyEnum.Urgent,
		title: "Found Golden Retriever",
		description: "Found a friendly golden retriever near Izvor station.",
		position: { x: 26.0854, y: 44.4338 },
		status: PulseStatusEnum.Active,
		pulseUploadState: PulseUploadStateEnum.Completed,
		audioUrl: null,
		imageUrls: [
			"https://images.unsplash.com/photo-1552053831-71594a27632d?w=1200",
		],
		isResolved: false,
		isVerified: false,
		createdAt: new Date("2026-03-31T10:05:00.000Z"),
	},
];
