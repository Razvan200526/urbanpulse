import type { PulseType } from "@server/db/schema";
import {
	type PulseRepository,
	pulseRepository,
} from "@server/repositories/PulseRepository";
import { userRepository } from "@server/repositories/UserRepository";
import { handleError } from "@server/utils/handleError";
import { logger } from "@server/utils/Logger";
export class PulseService {
	private pulseRepository: PulseRepository;

	constructor() {
		this.pulseRepository = pulseRepository;
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

	async updatePulse(pulseId: string, data: Partial<PulseType>) {
		try {
			const updatedPulse = await this.pulseRepository.update(pulseId, data);
			return updatedPulse;
		} catch (error) {
			handleError(error);
			return null;
		}
	}

	async getPulses({
		userId,
		position,
	}: {
		userId: string;
		position: { x: number; y: number };
	}) {
		try {
			const user = await userRepository.getOne(userId);
			if (!user) {
				logger.error("No user found!");
				return null;
			}

			const pulsesInRange = await this.pulseRepository.getByOptions({
				x: position.x,
				y: position.y,
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
