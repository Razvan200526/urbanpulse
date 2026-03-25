import * as z from "zod";

export const responseSchema = z.object({
	pulseId: z.string(), // check if it should be pulseId.uuid() or not
	responderID: z.string(),
	status: z.enum(["PENDING", "ACCEPTED", "DECLINED", "COMPLETED"]),
	createdAt: z.coerce.date().optional(),
});

export type ResponseInfoType = z.infer<typeof responseSchema>;

export const isResponseRequestValid = (requestInfo: unknown) => {
	return responseSchema.safeParse(requestInfo);
};
