import type { SkillType } from "@server/db/schema";
import {
	type SkillRepository,
	skillRepository,
} from "@server/repositories/SkillRepository";
import { cacheManager } from "@server/services/cache/CacheManager";
import { handleError } from "@server/utils/handleError";
import { isSkillRequestValid } from "@shared/validators/isSkillValid";

export class SkillService {
	private skillRepo: SkillRepository;
	private cache = cacheManager;

	constructor() {
		this.skillRepo = skillRepository;
	}

	async createSkill(data: Partial<SkillType>) {
		const result = isSkillRequestValid(data);
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

		const created = await this.skillRepo.create(result.data);
		// Invalidate skills cache on creation
		await this.cache.invalidate("all", { namespace: "skill" });
		return created;
	}
	async getSkillById(id: string): Promise<SkillType | null> {
		return await this.cache.getOrSet(
			id,
			async () => {
				try {
					return await this.skillRepo.getOne(id);
				} catch (error) {
					handleError(error);
					return null;
				}
			},
			{ namespace: "skill", ttl: 3600 },
		);
	}
	async getAllSkill() {
		return await this.cache.getOrSet(
			"all",
			async () => {
				try {
					return await this.skillRepo.getAll();
				} catch (error) {
					handleError(error);
					return null;
				}
			},
			{ namespace: "skill", ttl: 3600 },
		);
	}

	async updateSkill(id: string, data: Partial<SkillType>) {
		try {
			const result = await this.skillRepo.update(id, data);
			// Invalidate cache on update
			await this.cache.invalidate(id, { namespace: "skill" });
			await this.cache.invalidate("all", { namespace: "skill" });
			return result;
		} catch (error) {
			handleError(error);
			return null;
		}
	}
	async deleteSkill(id: string): Promise<boolean> {
		try {
			await this.skillRepo.delete(id);
			// Invalidate cache on delete
			await this.cache.invalidate(id, { namespace: "skill" });
			await this.cache.invalidate("all", { namespace: "skill" });
			return true;
		} catch (error) {
			handleError(error);
			return false;
		}
	}
}

export const skillService = new SkillService();
