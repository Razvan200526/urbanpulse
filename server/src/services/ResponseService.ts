import type { PulseResponseType } from "@server/db/schema";
import {
	type ResponseRepository,
	responseRepository,
} from "@server/repositories/ResponseRepository";
import { handleError } from "@server/utils/handleError";
import { isResponseRequestValid } from "@shared/validators/isResponseValid";

export class ResponseService {
	private responseRepo: ResponseRepository;

	constructor() {
		this.responseRepo = responseRepository;
	}

	async createResponse(data: Partial<ResponseService>) {
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
			await this.responseRepo.delete(id);
			return true;
		} catch (error) {
			handleError(error);
			return false;
		}
	}
}
export const responseService = new ResponseService();
