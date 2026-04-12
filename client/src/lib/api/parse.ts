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
	let raw: unknown;
	try {
		raw = await response.json();
	} catch {
		throw new Error(fallbackMessage);
	}
	const envelope = apiEnvelopeSchema.safeParse(raw);

	if (!envelope.success) {
		throw new Error(fallbackMessage);
	}

	if (!response.ok || !envelope.data.success) {
		const message = envelope.data.message || fallbackMessage;
		Toast.toast.danger(message);
		throw new Error(message);
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
	try {
		const parsed = await parseApiData(response, schema, fallbackMessage);

		return {
			success: true as const,
			message: parsed.message,
			data: parsed.data,
		};
	} catch (error) {
		return {
			success: false as const,
			message:
				error instanceof Error && error.message
					? error.message
					: fallbackMessage,
			data: null,
		};
	}
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
