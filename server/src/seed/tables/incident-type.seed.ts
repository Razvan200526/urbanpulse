import type { incidentType } from "@server/db/schema";
import { seedIds } from "@server/seed/constants";
import { DEFAULT_INCIDENT_TYPES } from "@shared/types";

type IncidentTypeInsert = typeof incidentType.$inferInsert;

export const incidentTypeSeeds: IncidentTypeInsert[] =
	DEFAULT_INCIDENT_TYPES.map((entry) => ({
		id: seedIds.incidentTypes[entry.slug],
		slug: entry.slug,
		label: entry.label,
		description: entry.description,
		isActive: true,
		isSystem: true,
		sortOrder: entry.sortOrder,
	}));
