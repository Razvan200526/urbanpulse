import * as z from "zod";

export const transactionSchema = z.object({
	id: z.string(),
	resourceId: z.string().uuid(),
	borrowerId: z.string().optional(),
	lenderId: z.string().optional(),
	status: z.enum(["PENDING", "ACTIVE", "COMPLETED", "CANCELLED"]),
	startAt: z.coerce.date(),
	endAt: z.coerce.date().optional(),
});

export type TransactionInfoType = z.infer<typeof transactionSchema>;

export const isTransactionRequestValid = (transactionInfo: unknown) => {
	return transactionSchema.safeParse(transactionInfo);
};
