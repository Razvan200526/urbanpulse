export enum UserRole {
	ADMIN = "admin",
	USER = "user",
}

export type PulseRepsponseParamsType = {
	ownerUserId: string;
	responseId: string;
	pulseId: string;
	pulseTitle: string;
	responderId: string;
	responderName: string;
	note: string;
};
