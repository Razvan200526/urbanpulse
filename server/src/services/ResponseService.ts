import type { PulseResponseType } from "@server/db/schema";
import { pulseRepository } from "@server/repositories/PulseRepository";
import {
	type ResponseRepository,
	responseRepository,
} from "@server/repositories/ResponseRepository";
import { messagingService } from "@server/services/MessagingService";
import { handleError } from "@server/utils/handleError";
import { ResponseStatusEnum } from "@shared/types";
import { isResponseRequestValid } from "@shared/validators/isResponseValid";

export class ResponseService {
	private responseRepo: ResponseRepository;

	constructor() {
		this.responseRepo = responseRepository;
	}

	/**
	 * Neighbor offers help on a pulse. Caller must ensure no duplicate responder row.
	 */
	async offerHelp(
		pulseId: string,
		responderId: string,
	): Promise<PulseResponseType | null> {
		try {
			return await this.responseRepo.create({
				pulseId,
				responderId,
				status: ResponseStatusEnum.Pending,
			});
		} catch (error) {
			handleError(error);
			return null;
		}
	}

	/**
	 * Pulse owner accepts one helper; other pending offers for that pulse are declined.
	 */
	async acceptHelpOffer(
		ownerUserId: string,
		pulseId: string,
		responseId: string,
	): Promise<{
		accepted: PulseResponseType;
		pulseTitle: string;
		responderId: string;
		conversationId: string | null;
	} | null> {
		try {
			const pulse = await pulseRepository.getOne(pulseId);
			if (!pulse || pulse.userId !== ownerUserId) return null;
			const row = await this.responseRepo.getOne(responseId);
			if (
				!row ||
				row.pulseId !== pulseId ||
				row.status !== ResponseStatusEnum.Pending
			) {
				return null;
			}
			const accepted = await this.responseRepo.update(responseId, {
				status: ResponseStatusEnum.Accepted,
			});
			await this.responseRepo.declineOtherPendingForPulse(pulseId, responseId);
			const coordinationConversation =
				await messagingService.ensurePulseConversation(pulseId, [
					ownerUserId,
					row.responderId,
				]);
			return {
				accepted,
				pulseTitle: pulse.title,
				responderId: row.responderId,
				conversationId: coordinationConversation?.id ?? null,
			};
		} catch (error) {
			handleError(error);
			return null;
		}
	}

	async rejectHelpOffer(
		ownerUserId: string,
		pulseId: string,
		responseId: string,
	): Promise<PulseResponseType | null> {
		try {
			const pulse = await pulseRepository.getOne(pulseId);
			if (!pulse || pulse.userId !== ownerUserId) return null;
			const row = await this.responseRepo.getOne(responseId);
			if (
				!row ||
				row.pulseId !== pulseId ||
				row.status !== ResponseStatusEnum.Pending
			) {
				return null;
			}

			return await this.responseRepo.update(responseId, {
				status: ResponseStatusEnum.Declined,
			});
		} catch (error) {
			handleError(error);
			return null;
		}
	}

	async createResponse(data: unknown) {
		const result = isResponseRequestValid(data);
		try {
			if (result.error) {
				handleError(result.error);
				return null;
			}
			if (!result.success) return null;
		} catch (error) {
			handleError(error);
		}
		if (result.data == null) return null;
		return await this.responseRepo.create(
			result.data as Partial<PulseResponseType>,
		);
	}

	async getResponseById(id: string) {
		try {
			return await this.responseRepo.getOne(id);
		} catch (error) {
			handleError(error);
			return null;
		}
	}

	async getAllResponse() {
		try {
			return await this.responseRepo.getAll();
		} catch (error) {
			handleError(error);
			return null;
		}
	}

	async updateResponse(id: string, data: Partial<PulseResponseType>) {
		try {
			return await this.responseRepo.update(id, data);
		} catch (error) {
			handleError(error);
			return null;
		}
	}
	async deleteResponse(id: string): Promise<boolean> {
		try {
			return await this.responseRepo.delete(id);
		} catch (error) {
			handleError(error);
			return false;
		}
	}
}
export const responseService = new ResponseService();
