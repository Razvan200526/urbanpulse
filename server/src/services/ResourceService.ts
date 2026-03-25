import type { ResourceType } from "@server/db/schema";
import {
	type ResourceRepository,
	resourceRepository,
} from "@server/repositories/ResourceRepository";
import { handleError } from "@server/utils/handleError";
import { isResponseRequestValid } from "@shared/validators/isResponseValid";

export class ResourceService {
	private resourceRepo: ResourceRepository;

	constructor() {
		this.resourceRepo = resourceRepository;
	}

	async createResource(data: Partial<ResourceType>) {
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
		this.resourceRepo.create(result.data);
	}

	async getResourceById(id: string): Promise<ResourceType | null> {
		try {
			return await this.resourceRepo.getOne(id);
		} catch (error) {
			handleError(error);
			return null;
		}
	}

	async getAllResource() {
		try {
			return await this.resourceRepo.getAll();
		} catch (error) {
			handleError(error);
			return null;
		}
	}
	async updateResource(id: string, data: Partial<ResourceType>) {
		try {
			return await this.resourceRepo.update(id, data);
		} catch (error) {
			handleError(error);
			return null;
		}
	}
	async deleteSkill(id: string): Promise<boolean> {
		try {
			await this.resourceRepo.delete(id);
			return true;
		} catch (error) {
			handleError(error);
			return false;
		}
	}
}
export const resourceService = new ResourceService();
