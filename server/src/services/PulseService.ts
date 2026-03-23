import type { PulseType } from "@server/db/schema";
import {
	type PulseRepository,
	pulseRepository,
} from "@server/repositories/PulseRepository";
import { logger } from "@server/utils/Logger";
import { isPulseRequestValid } from "@shared/validators/isPulseRequestValid";
export class PulseService {
	private pulseRepository: PulseRepository;

	constructor() {
		this.pulseRepository = pulseRepository;
	}

	async createPulse(data: Partial<PulseType>) {
		try {
			const { error } = isPulseRequestValid(data);
			if (error) {
				logger.exception(error);
				return null;
			}

			const newPulse = await this.pulseRepository.create(data);
			if (!newPulse) {
				return null;
			}
			return newPulse;
		} catch (error) {
			if (error instanceof Error) {
				logger.exception(error);
			}
			logger.error("Could not create pulse");
			return null;
		}
	}
}
