import type { ResourceType } from "@server/db/schema";
import {
	type ResourceRepository,
	resourceRepository,
} from "@server/repositories/ResourceRepository";
import { handleError } from "@server/utils/handleError";
import { isCreateResourceReqValid } from "@shared/validators/resources/isResourceValid";

export class ResourceService {
	private resourceRepo: ResourceRepository;

	constructor() {
		this.resourceRepo = resourceRepository;
	}

	async createResource(data: Partial<ResourceType>) {
		const result = isCreateResourceReqValid(data);

		if (result.error) {
			handleError(result.error);
		}
		if (!result.data) {
			return null;
		}
		const newResource = await this.resourceRepo.create(result.data);
		console.info(newResource);
		return newResource;
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
			const res = await this.resourceRepo.getAll();
			return res;
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
