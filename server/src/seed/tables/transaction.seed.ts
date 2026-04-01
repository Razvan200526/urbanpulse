import type { transaction } from "@server/db/schema";
import { seedIds } from "@server/seed/constants";
import { TransactionStatusEnum } from "@shared/types";

type TransactionInsert = typeof transaction.$inferInsert;

export const transactionSeeds: TransactionInsert[] = [
	{
		resourceId: seedIds.resources.portableGenerator,
		borrowerId: seedIds.users.elena,
		lenderId: seedIds.users.daniel,
		status: TransactionStatusEnum.Active,
		startAt: new Date("2026-03-31T09:30:00.000Z"),
		endAt: null,
	},
	{
		resourceId: seedIds.resources.firstAidKit,
		borrowerId: seedIds.users.maria,
		lenderId: seedIds.users.vlad,
		status: TransactionStatusEnum.Completed,
		startAt: new Date("2026-03-30T10:00:00.000Z"),
		endAt: new Date("2026-03-30T18:30:00.000Z"),
	},
	{
		resourceId: seedIds.resources.childCarSeat,
		borrowerId: seedIds.users.irina,
		lenderId: seedIds.users.elena,
		status: TransactionStatusEnum.Pending,
		startAt: new Date("2026-04-01T08:00:00.000Z"),
		endAt: null,
	},
];
