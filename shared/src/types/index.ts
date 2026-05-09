export type ApiResponse = {
	message: string;
	success: true;
};

export type GeoPoint = {
	x: number;
	y: number;
};

export type AlertPreferences = {
	homeLocation: GeoPoint | null;
	lastKnownLocation: GeoPoint | null;
	lastKnownLocationUpdatedAt: string | null;
	heroAlertRadiusMeters: number;
};

export type HeroAlertPayload = {
	pulseId: string;
	type: PulseEnum;
	description: string | null;
	location: GeoPoint;
	matchedTags: string[];
	distanceMeters: number;
	usedLiveLocation: boolean;
	quietHoursBypassed: boolean;
	pulseTitle?: string;
	conversationId?: string;
};

export enum PulseEnum {
	Emergency = "Emergency",
	Skill = "Skill",
	Item = "Item",
	PetAlert = "Pet Alert",
}

export enum DefaultIncidentTypeSlugEnum {
	BlackoutPowerOutage = "blackout-power-outage",
	Fire = "fire",
	Flood = "flood",
	Earthquake = "earthquake",
	SevereStorm = "severe-storm",
	RoadBlockage = "road-blockage",
	InfrastructureDamage = "infrastructure-damage",
	Other = "other",
}

export enum SafetyCheckinStatusEnum {
	Safe = "SAFE",
	NeedHelp = "NEED_HELP",
	Injured = "INJURED",
	AvailableToHelp = "AVAILABLE_TO_HELP",
}

export const DEFAULT_INCIDENT_TYPES = [
	{
		slug: DefaultIncidentTypeSlugEnum.BlackoutPowerOutage,
		label: "Blackout / power outage",
		description: "Loss of electricity or power infrastructure failure.",
		sortOrder: 10,
	},
	{
		slug: DefaultIncidentTypeSlugEnum.Fire,
		label: "Fire",
		description: "Active fire, smoke, or fire-related danger.",
		sortOrder: 20,
	},
	{
		slug: DefaultIncidentTypeSlugEnum.Flood,
		label: "Flood",
		description: "Flooding, burst pipes, or dangerous water accumulation.",
		sortOrder: 30,
	},
	{
		slug: DefaultIncidentTypeSlugEnum.Earthquake,
		label: "Earthquake",
		description: "Earthquake event or related structural danger.",
		sortOrder: 40,
	},
	{
		slug: DefaultIncidentTypeSlugEnum.SevereStorm,
		label: "Severe storm",
		description: "High winds, hail, lightning, or storm damage.",
		sortOrder: 50,
	},
	{
		slug: DefaultIncidentTypeSlugEnum.RoadBlockage,
		label: "Road blockage",
		description: "Blocked road, fallen tree, crash, or access obstruction.",
		sortOrder: 60,
	},
	{
		slug: DefaultIncidentTypeSlugEnum.InfrastructureDamage,
		label: "Infrastructure damage",
		description: "Damage to utilities, buildings, bridges, or public assets.",
		sortOrder: 70,
	},
	{
		slug: DefaultIncidentTypeSlugEnum.Other,
		label: "Other admin-defined emergency types",
		description: "Emergency incident that does not match another type.",
		sortOrder: 80,
	},
] as const;

export enum PetAlertTypeEnum {
	Lost = "lost",
	Found = "found",
}

export enum PetAlertEmbeddingStatusEnum {
	Pending = "pending",
	Processing = "processing",
	Ready = "ready",
	Failed = "failed",
	Skipped = "skipped",
}

export enum PetAlertUploadStatusEnum {
	Pending = "pending",
	Processing = "processing",
	Success = "success",
	Failed = "failed",
}

export enum PetMatchStatusEnum {
	PendingReview = "PENDING_REVIEW",
	OwnerInterested = "OWNER_INTERESTED",
	OwnerDismissed = "OWNER_DISMISSED",
	FinderAccepted = "FINDER_ACCEPTED",
	FinderDeclined = "FINDER_DECLINED",
}

export enum UrgencyEnum {
	Urgent = "Urgent",
	NotUrgent = "Not Urgent",
	Unknown = "",
	Immediate = "Immediate",
}

export type ResourceAvailabilityType =
	| "Available"
	| "Unavailable"
	| "Currently Unavailable";

export type NotificationType =
	| "HERO_ALERT"
	| "PULSE_CONFIRMED"
	| "PULSE_RESPONSE"
	| "PULSE_RESPONSE_ACCEPTED"
	| "PET_ALERT_MATCH"
	| "PET_ALERT_MATCH_INTERESTED"
	| "PET_ALERT_MATCH_ACCEPTED"
	| "PET_ALERT_MATCH_DECLINED"
	| "MESSAGE"
	| "TRANSACTION"
	| "FEEDBACK"
	| "PULSE_UPDATED";

export enum ResponseStatusEnum {
	Pending = "PENDING",
	Accepted = "ACCEPTED",
	Declined = "DECLINED",
	Completed = "COMPLETED",
}
export enum TransactionStatusEnum {
	Pending = "PENDING",
	Active = "ACTIVE",
	Completed = "COMPLETED",
	Cancelled = "CANCELLED",
}
export enum ConversationTypeEnum {
	Direct = "DIRECT",
	Group = "GROUP",
	Pulse = "PULSE",
}
export enum ReportStatusEnum {
	Pending = "PENDING",
	Resolved = "RESOLVED",
	Dismissed = "DISMISSED",
}

export enum PulseStatusEnum {
	Active = "ACTIVE",
	Resolved = "RESOLVED",
	Dismissed = "DISMISSED",
}

export enum PulseUploadStateEnum {
	Pending = "pending",
	Uploaded = "uploaded",
	Completed = "completed",
	Failed = "failed",
}

export type FilterResourceType =
	| "All"
	| "Available"
	| "Unavailable"
	| "Currently Unavailable";

export type ResourceItemType = "Skill" | "Item" | "Location";
