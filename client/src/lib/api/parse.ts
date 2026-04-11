import { Toast } from "@heroui/react";
import { z } from "zod";

const apiEnvelopeSchema = z.object({
	success: z.boolean(),
	message: z.string().optional(),
	data: z.unknown().optional(),
});

const socketEnvelopeSchema = z.object({
	success: z.boolean(),
	message: z.string().optional(),
	data: z.unknown().optional(),
});

export const parseValueWithSchema = <TSchema extends z.ZodTypeAny>(
	value: unknown,
	schema: TSchema,
	fallbackMessage: string,
) => {
	const parsed = schema.safeParse(value);

	if (!parsed.success) {
		throw new Error(fallbackMessage);
	}

	return parsed.data;
};

export const parseApiData = async <TSchema extends z.ZodTypeAny>(
	response: Response,
	schema: TSchema,
	fallbackMessage: string,
) => {
	const raw = await response.json();
	const envelope = apiEnvelopeSchema.safeParse(raw);

	if (!envelope.success) {
		return;
	}
	if (!envelope.data.success) {
		Toast.toast.danger(envelope.data.message);
	}

	return {
		message: envelope.data.message ?? "",
		data: parseValueWithSchema(
			envelope.data.data,
			schema,
			envelope.data.message || fallbackMessage,
		),
	};
};

export const parseApiEnvelope = async <TSchema extends z.ZodTypeAny>(
	response: Response,
	schema: TSchema,
	fallbackMessage: string,
) => {
	const parsed = await parseApiData(response, schema, fallbackMessage);

	return {
		success: true as const,
		message: parsed?.message,
		data: parsed?.data,
	};
};

export const parseSocketData = <TSchema extends z.ZodTypeAny>(
	value: unknown,
	schema: TSchema,
	fallbackMessage: string,
) => {
	const envelope = socketEnvelopeSchema.safeParse(value);

	if (!envelope.success) {
		throw new Error(fallbackMessage);
	}

	if (!envelope.data.success) {
		throw new Error(envelope.data.message || fallbackMessage);
	}

	return {
		message: envelope.data.message ?? "",
		data: parseValueWithSchema(
			envelope.data.data,
			schema,
			envelope.data.message || fallbackMessage,
		),
	};
};
