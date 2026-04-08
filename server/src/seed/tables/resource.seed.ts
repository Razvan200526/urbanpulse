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
		position: { x: 26.1025, y: 44.4268 },
		locationLabel: "Bucharest City Center",
		resourceType: "Item",
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
		position: { x: 26.0879, y: 44.4412 },
		locationLabel: "Cismigiu",
		resourceType: "Item",
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
		position: { x: 26.1304, y: 44.4592 },
		locationLabel: "Tei",
		resourceType: "Item",
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
		position: { x: 26.0276, y: 44.4306 },
		locationLabel: "Drumul Taberei",
		resourceType: "Item",
		imageUrls: [
			"https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1200",
		],
		createdAt: new Date("2026-03-30T14:50:00.000Z"),
	},
];
