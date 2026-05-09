import { createSafePlainTextSchema } from "@shared/validators/createSafePlainTextSchema";
import * as z from "zod";

export const incidentTypeIdParamSchema = z.object({
	id: z.string().uuid(),
});

export const createIncidentTypeSchema = z.object({
	label: createSafePlainTextSchema(1, 80),
	description: createSafePlainTextSchema(0, 240, { allowEmpty: true })
		.optional()
		.default(""),
	sortOrder: z.number().int().min(0).max(10_000).optional(),
});

export const updateIncidentTypeSchema = z
	.object({
		label: createSafePlainTextSchema(1, 80).optional(),
		description: createSafePlainTextSchema(0, 240, {
			allowEmpty: true,
		}).optional(),
		isActive: z.boolean().optional(),
		sortOrder: z.number().int().min(0).max(10_000).optional(),
	})
	.refine((payload) => Object.keys(payload).length > 0, {
		message: "At least one incident type field is required",
	});

export type CreateIncidentTypePayload = z.infer<
	typeof createIncidentTypeSchema
>;
export type UpdateIncidentTypePayload = z.infer<
	typeof updateIncidentTypeSchema
>;
