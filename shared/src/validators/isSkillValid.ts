import * as z from "zod";

export const skillSchema = z.object({
	tag: z.string().min(1).max(100),
	userId: z.string().min(1),
});

export type SkillInfoType = z.infer<typeof skillSchema>;

export const isSkillRequestValid = (skillInfo: unknown) => {
	return skillSchema.safeParse(skillInfo);
};
