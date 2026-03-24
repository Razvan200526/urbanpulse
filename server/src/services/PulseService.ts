import type { PulseType } from "@server/db/schema";
import {
	type PulseRepository,
	pulseRepository,
} from "@server/repositories/PulseRepository";
import {
	userRepository,
	type UserRepository,
} from "@server/repositories/UserRepository";
import { handleError } from "@server/utils/handleError";
import { logger } from "@server/utils/Logger";
export class PulseService {
	private pulseRepository: PulseRepository;
	private userRepository: UserRepository;

	constructor() {
		this.pulseRepository = pulseRepository;
		this.userRepository = userRepository;
	}

	async createPulse(data: Partial<PulseType>) {
		try {
			const newPulse = await this.pulseRepository.create(data);
			logger.info(`${newPulse}`);
			return newPulse;
		} catch (error) {
			handleError(error);
			return null;
		}
	}

	async getPulses({
		userId,
		coords,
	}: {
		userId: string;
		coords: { lat: number; lng: number };
	}) {
		try {
			const user = await userRepository.getOne(userId);
			if (!user) {
				logger.error("No user found!");
				return null;
			}

			const pulsesInRange = await this.pulseRepository.getByOptions({
				lat: coords.lat,
				lng: coords.lng,
				radius: 500,
			});

			return pulsesInRange;
		} catch (error) {
			handleError(error);
			return null;
		}
	}
}

export const pulseService = new PulseService();
