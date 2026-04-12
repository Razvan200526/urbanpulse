import type { ClientPulseType } from "@client/utils/types";
import {
	PulseEnum,
	PulseStatusEnum,
	PulseUploadStateEnum,
	UrgencyEnum,
} from "@shared/types";

export const getFakePulses = (coords: {
	long: number;
	lat: number;
}): ClientPulseType[] => {
	const { long, lat } = coords;

	return [
		{
			id: "fake-1",
			type: PulseEnum.Emergency,
			userId: "user-1",
			urgency: UrgencyEnum.Urgent,
			title: "Fire reported nearby",
			description: "Smoke seen coming from the park area.",
			position: { x: long + 0.002, y: lat + 0.001 },
			status: PulseStatusEnum.Active,
			pulseUploadState: PulseUploadStateEnum.Uploaded,
			audioUrl: null,
			imageUrls: [],
			requestedSkillTags: ["Emergency"],
			matchMetadata: {},
			isResolved: false,
			isVerified: true,
			mergedIntoPulseId: null,
			moderationNote: null,
			locationPrecision: "exact",
			createdAt: new Date().toISOString(),
		},
		{
			id: "fake-2",
			type: PulseEnum.PetAlert,
			userId: "user-2",
			urgency: UrgencyEnum.NotUrgent,
			title: "Lost Golden Retriever",
			description: "Answers to Buddy. Last seen near the grocery store.",
			position: { x: long - 0.003, y: lat - 0.002 },
			status: PulseStatusEnum.Active,
			pulseUploadState: PulseUploadStateEnum.Uploaded,
			audioUrl: null,
			imageUrls: [],
			requestedSkillTags: ["Pet Alert"],
			matchMetadata: {},
			isResolved: false,
			isVerified: false,
			mergedIntoPulseId: null,
			moderationNote: null,
			locationPrecision: "exact",
			createdAt: new Date().toISOString(),
		},
		{
			id: "fake-3",
			type: PulseEnum.Skill,
			userId: "user-3",
			urgency: UrgencyEnum.Immediate,
			title: "First Aid Help Needed",
			description: "Looking for someone with basic medical knowledge.",
			position: { x: long + 0.001, y: lat - 0.004 },
			status: PulseStatusEnum.Active,
			pulseUploadState: PulseUploadStateEnum.Uploaded,
			audioUrl: null,
			imageUrls: [],
			requestedSkillTags: ["Skill"],
			matchMetadata: {},
			isResolved: false,
			isVerified: true,
			mergedIntoPulseId: null,
			moderationNote: null,
			locationPrecision: "exact",
			createdAt: new Date().toISOString(),
		},
	];
};
