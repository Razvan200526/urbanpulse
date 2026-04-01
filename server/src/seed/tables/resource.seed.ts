import type { resource } from "@server/db/schema";
import { seedIds } from "@server/seed/constants";

type ResourceInsert = typeof resource.$inferInsert;

export const resourceSeeds: ResourceInsert[] = [
	{
		id: seedIds.resources.portableGenerator,
		userId: seedIds.users.daniel,
		name: "Portable generator 2.5kW",
		description:
			"Fuel-efficient generator suitable for fridge + lights backup during outages.",
		availability: "Available",
		imageUrls: [
			"https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=1200",
		],
		createdAt: new Date("2026-03-29T08:20:00.000Z"),
	},
	{
		id: seedIds.resources.firstAidKit,
		userId: seedIds.users.vlad,
		name: "Advanced first aid kit",
		description:
			"Emergency trauma supplies and burn dressings for on-site assistance.",
		availability: "Available",
		imageUrls: [
			"https://images.unsplash.com/photo-1584515933487-779824d29309?w=1200",
		],
		createdAt: new Date("2026-03-29T12:15:00.000Z"),
	},
	{
		id: seedIds.resources.childCarSeat,
		userId: seedIds.users.elena,
		name: "Child car seat (9-18kg)",
		description:
			"Clean and certified seat for temporary family transport needs.",
		availability: "Currently Unavailable",
		imageUrls: [],
		createdAt: new Date("2026-03-30T09:40:00.000Z"),
	},
	{
		id: seedIds.resources.waterPump,
		userId: seedIds.users.alex,
		name: "Basement water pump",
		description:
			"Compact submersible pump with 20m hose for quick flood response.",
		availability: "Unavailable",
		imageUrls: [
			"https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1200",
		],
		createdAt: new Date("2026-03-30T14:50:00.000Z"),
	},
];
