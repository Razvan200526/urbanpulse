import type { PulseType } from "@server/db/schema";
import {
	type PulseRepository,
	pulseRepository,
} from "@server/repositories/PulseRepository";
import { notificationService } from "@server/services/NotificationService";
import { handleError } from "@server/utils/handleError";
import { PulseStatusEnum, PulseUploadStateEnum } from "@shared/types";
import type { PulseRetrievePayloadType } from "@shared/validators/pulses/isPulseRetrieveValid";
import {
	type PulseSocketMessageType,
	pulseSocketMessageSchema,
} from "@shared/validators/pulses/isPulseSocketMessageValid";
import type { PulseUpdateBody } from "@shared/validators/pulses/isPulseUpdateValid";

type PulseSocketResponse = {
	success: boolean;
	message: string;
	data: PulseType | PulseType[] | null;
};

/**
 * Service for managing Urban Pulse records and retrieving location-based pulses.
 */
export class PulseService {
	private pulseRepository: PulseRepository;

	constructor() {
		this.pulseRepository = pulseRepository;
	}

	async getPulseById(id: string): Promise<PulseType | null> {
		return this.pulseRepository.getOne(id);
	}

	/**
	 * Creates a new Pulse in the database.
	 * @param {Partial<PulseType>} data - The pulse data.
	 * @returns {Promise<PulseType | null>} The created pulse.
	 */
	async createPulse(data: Partial<PulseType>): Promise<PulseType | null> {
		try {
			return await this.pulseRepository.create(data);
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
			return await this.pulseRepository.update(pulseId, data);
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
	 * @param {Object} params.position - Current coordinates {x: Long, y: Lat}.
	 * @returns {Promise<PulseType[] | null>} Array of matching pulses.
	 */
	async getPulses({
		position,
		radius = 500,
		status = PulseStatusEnum.Active,
		type,
		urgency,
		verifiedOnly,
	}: PulseRetrievePayloadType): Promise<PulseType[] | null> {
		try {
			return await this.pulseRepository.getByOptions({
				x: position.x,
				y: position.y,
				radius,
				status,
				type,
				urgency,
				isVerified: verifiedOnly ? true : undefined,
			});
		} catch (error) {
			handleError(error);
			return null;
		}
	}

	async handleSocketMessage(message: unknown): Promise<PulseSocketResponse> {
		const result = pulseSocketMessageSchema.safeParse(message);
		if (!result.success) {
			return {
				success: false,
				message: "Invalid request",
				data: null,
			};
		}

		switch (result.data.type) {
			case "upload-pulse":
				return this.handleUploadPulseMessage(result.data);
			case "get-pulses":
				return this.handleGetPulsesMessage(result.data.payload);
		}
	}

	private async handleUploadPulseMessage(
		message: Extract<PulseSocketMessageType, { type: "upload-pulse" }>,
	): Promise<PulseSocketResponse> {
		const newPulse = await this.createPulse(message.payload);
		if (!newPulse) {
			return {
				success: false,
				message: "Failed to create pulse",
				data: null,
			};
		}

		const uploadedPulse = await this.updatePulse(newPulse.id, {
			pulseUploadState: PulseUploadStateEnum.Uploaded,
		});

		if (!uploadedPulse) {
			return {
				success: false,
				message: "Failed to update pulse upload state",
				data: null,
			};
		}

		await notificationService.broadcastToNearbyUsers(uploadedPulse);

		return {
			success: true,
			message: "Pulse received",
			data: uploadedPulse,
		};
	}

	private async handleGetPulsesMessage(
		payload: PulseRetrievePayloadType,
	): Promise<PulseSocketResponse> {
		const pulses = await this.getPulses(payload);

		return {
			success: true,
			message: "Pulses retrieved",
			data: pulses ?? [],
		};
	}
}

export const pulseService = new PulseService();
