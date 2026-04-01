import type { quietHours } from "@server/db/schema";
import { seedIds } from "@server/seed/constants";

type QuietHoursInsert = typeof quietHours.$inferInsert;

export const quietHoursSeeds: QuietHoursInsert[] = [
	{
		userId: seedIds.users.maria,
		startTime: "22:00:00",
		endTime: "06:30:00",
		days: "Mon,Tue,Wed,Thu,Fri",
	},
	{
		userId: seedIds.users.vlad,
		startTime: "23:00:00",
		endTime: "07:00:00",
		days: "Sun,Mon,Tue,Wed,Thu",
	},
	{
		userId: seedIds.users.elena,
		startTime: "21:30:00",
		endTime: "06:00:00",
		days: "Mon,Tue,Wed,Thu,Fri,Sat",
	},
];
