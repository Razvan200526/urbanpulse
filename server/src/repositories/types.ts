import type { PulseType } from "@server/db/schema";

export interface PulseSearchOptions extends Partial<PulseType> {
	x?: number;
	y?: number;
	radius?: number;
}

export type PulseConditionOptions = {
	createdAtFrom?: Date;
	createdAtTo?: Date;
};

export type UserConditionOptions = {
	createdAtFrom?: Date;
	createdAtTo?: Date;
};

export type NotificationConditionOptions = {
	createdAtFrom?: Date;
	createdAtTo?: Date;
};
