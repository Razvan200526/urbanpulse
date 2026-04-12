import type { UserType } from "@server/db/schema";
import { cacheManager } from "@server/services/cache/CacheManager";

const REPUTATION_ACTION_THRESHOLD = 3;
const TRUST_SCORE_STEP = 5;

export type ReputationOutcome = "success" | "failure";

type UserReputationRepository = {
	getOne(id: string): Promise<UserType | null>;
	update(id: string, data: Partial<UserType>): Promise<UserType>;
};

function clampTrustScore(score: number) {
	return Math.max(0, Math.min(100, score));
}

export function buildUserReputationPatch(
	user: Pick<
		UserType,
		| "trustScore"
		| "successfulInteractions"
		| "failedInteractions"
		| "isVerified"
	>,
	outcome: ReputationOutcome,
): Partial<UserType> {
	const currentScore = user.trustScore ?? 0;

	if (outcome === "success") {
		const successfulInteractions = (user.successfulInteractions ?? 0) + 1;
		return {
			successfulInteractions,
			...(successfulInteractions >= REPUTATION_ACTION_THRESHOLD &&
			!user.isVerified
				? { isVerified: true }
				: {}),
			...(successfulInteractions % REPUTATION_ACTION_THRESHOLD === 0
				? {
						trustScore: clampTrustScore(currentScore + TRUST_SCORE_STEP),
					}
				: {}),
		};
	}

	const failedInteractions = (user.failedInteractions ?? 0) + 1;
	return {
		failedInteractions,
		...(failedInteractions % REPUTATION_ACTION_THRESHOLD === 0
			? {
					trustScore: clampTrustScore(currentScore - TRUST_SCORE_STEP),
				}
			: {}),
	};
}

export async function recordUserReputationOutcome(
	userRepo: UserReputationRepository,
	userId: string,
	outcome: ReputationOutcome,
) {
	const user = await userRepo.getOne(userId);
	if (!user) {
		return null;
	}

	const patch = buildUserReputationPatch(user, outcome);
	if (Object.keys(patch).length === 0) {
		return user;
	}

	const updatedUser = await userRepo.update(userId, patch);
	await cacheManager.invalidate(`${userId}:profile`, {
		namespace: "profile",
	});

	return updatedUser;
}
