export type ApiResponse = {
	message: string;
	success: true;
};

export enum PulseEnum {
	Emergency = "Emergency",
	Skill = "Skill",
	Item = "Item",
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
