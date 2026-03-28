import type { PulseType } from "@server/db/schema";
import {
	type PulseRepository,
	pulseRepository,
} from "@server/repositories/PulseRepository";
import { userRepository } from "@server/repositories/UserRepository";
import { handleError } from "@server/utils/handleError";
import { logger } from "@server/utils/Logger";
import { PulseStatusEnum } from "@shared/types";
import type { PulseUpdateBody } from "@shared/validators/pulses/isPulseUpdateValid";

/**
 * Service for managing Urban Pulse records and retrieving location-based pulses.
 */
export class PulseService {
	private pulseRepository: PulseRepository;

	constructor() {
		this.pulseRepository = pulseRepository;
	}

	/**
	 * Creates a new Pulse in the database.
	 * @param {Partial<PulseType>} data - The pulse data.
	 * @returns {Promise<PulseType | null>} The created pulse.
	 */
	async getPulseById(id: string): Promise<PulseType | null> {
		return this.pulseRepository.getOne(id);
	}

	async createPulse(data: Partial<PulseType>): Promise<PulseType | null> {
		try {
			const newPulse = await this.pulseRepository.create(data);
			if (newPulse) {
				logger.info(`Pulse created: ${newPulse.id}`);
			}
			return newPulse;
		} catch (error) {
			handleError(error);
			return null;
		}
	}

	/**
	 * Updates an existing pulse's metadata or status.
	 * @param {string} pulseId - UUID of the pulse.
	 * @param {Partial<PulseType>} data - Fields to update.
	 * @returns {Promise<PulseType | null>} The updated pulse.
	 */
	async updatePulse(
		pulseId: string,
		data: Partial<PulseType>,
	): Promise<PulseType | null> {
		try {
			const updatedPulse = await this.pulseRepository.update(pulseId, data);
			return updatedPulse;
		} catch (error) {
			handleError(error);
			return null;
		}
	}

	/**
	 * Updates a pulse only if the caller owns it. Sets isResolved when status is Resolved.
	 */
	async updatePulseAsOwner(
		pulseId: string,
		ownerUserId: string,
		data: PulseUpdateBody,
	): Promise<PulseType | null> {
		try {
			const existing = await this.pulseRepository.getOne(pulseId);
			if (!existing || existing.userId !== ownerUserId) {
				return null;
			}
			const patch: Partial<PulseType> = { ...data };
			if (data.status === PulseStatusEnum.Resolved) {
				patch.isResolved = true;
			}
			return await this.pulseRepository.update(pulseId, patch);
		} catch (error) {
			handleError(error);
			return null;
		}
	}

	/**
	 * Retrieves pulses within range of a specific user/location.
	 * @param {Object} params - Query parameters.
	 * @param {string} params.userId - Authenticated User ID.
	 * @param {Object} params.position - Current coordinates {x: Long, y: Lat}.
	 * @returns {Promise<PulseType[] | null>} Array of matching pulses.
	 */
	async getPulses({
		userId,
		position,
	}: {
		userId: string;
		position: { x: number; y: number };
	}): Promise<PulseType[] | null> {
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
				status: PulseStatusEnum.Active,
			});

			return pulsesInRange;
		} catch (error) {
			handleError(error);
			return null;
		}
	}
}

export const pulseService = new PulseService();
