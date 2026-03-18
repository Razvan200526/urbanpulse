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
