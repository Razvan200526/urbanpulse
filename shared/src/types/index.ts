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
}

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
