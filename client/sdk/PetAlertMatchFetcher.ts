import {
	type PetAlertMatch,
	petAlertMatchesEnvelopeSchema,
	throwPetAlertApiError,
} from "@client/utils/petAlerts";
import type { Fetcher } from "./Fetcher";

export class PetAlertMatchFetcher {
	constructor(readonly fetcher: Fetcher) {}

	public readonly list = async (
		userId: string,
		petAlertId: string,
	): Promise<PetAlertMatch[]> => {
		const raw = await this.fetcher.get(
			`/api/v1/pet-alerts/${userId}/${petAlertId}/matches`,
		);
		const parsed = petAlertMatchesEnvelopeSchema.safeParse(raw);
		if (!parsed.success) {
			throwPetAlertApiError(raw, "Failed to retrieve pet alert matches");
		}
		return parsed.data?.data || [];
	};
}
