import type { IncidentTypeType } from "@server/db/schema";
import {
	type IncidentTypeRepository,
	incidentTypeRepository,
} from "@server/repositories/IncidentTypeRepository";
import { cacheManager } from "@server/services/cache/CacheManager";
import { handleError } from "@server/utils/handleError";
import { DefaultIncidentTypeSlugEnum, PulseEnum } from "@shared/types";
import type {
	CreateIncidentTypePayload,
	UpdateIncidentTypePayload,
} from "@shared/validators/incident-types/isIncidentTypeValid";

type IncidentTypeFailureCode = "NOT_FOUND" | "CONFLICT" | "INVALID_STATE";

type IncidentTypeResult<T> =
	| { ok: true; data: T }
	| { ok: false; code: IncidentTypeFailureCode; message: string };

export class IncidentTypeService {
	private readonly incidentTypeRepo: IncidentTypeRepository;
	private readonly cache = cacheManager;

	constructor() {
		this.incidentTypeRepo = incidentTypeRepository;
	}

	private async invalidateIncidentTypeCaches() {
		await Promise.all([
			this.cache.invalidate("active", { namespace: "incidentType" }),
			this.cache.invalidate("all", { namespace: "incidentType" }),
			this.cache.invalidatePattern("id:*", "incidentType"),
			this.cache.invalidatePattern("slug:*", "incidentType"),
			this.cache.invalidatePattern("nearby:*", "pulse"),
			this.cache.invalidatePattern("overview:*", "dashboard"),
		]);
	}

	private slugify(label: string) {
		return (
			label
				.toLowerCase()
				.normalize("NFKD")
				.replace(/[\u0300-\u036f]/g, "")
				.replace(/[^a-z0-9]+/g, "-")
				.replace(/^-+|-+$/g, "") || "incident-type"
		);
	}

	private async getNextSortOrder() {
		const all = await this.listAllIncidentTypes();
		return all.reduce((max, type) => Math.max(max, type.sortOrder), 0) + 10;
	}

	async listActiveIncidentTypes(): Promise<IncidentTypeType[]> {
		return await this.cache.getOrSet(
			"active",
			() => this.incidentTypeRepo.getActive(),
			{ namespace: "incidentType", ttl: 600 },
		);
	}

	async listAllIncidentTypes(): Promise<IncidentTypeType[]> {
		return await this.cache.getOrSet(
			"all",
			() => this.incidentTypeRepo.getAll(),
			{ namespace: "incidentType", ttl: 600 },
		);
	}

	async getIncidentTypeById(id: string): Promise<IncidentTypeType | null> {
		return await this.cache.getOrSet(
			`id:${id}`,
			() => this.incidentTypeRepo.getOne(id),
			{ namespace: "incidentType", ttl: 600 },
		);
	}

	async getIncidentTypeBySlug(slug: string): Promise<IncidentTypeType | null> {
		return await this.cache.getOrSet(
			`slug:${slug}`,
			() => this.incidentTypeRepo.getBySlug(slug),
			{ namespace: "incidentType", ttl: 600 },
		);
	}

	async resolveIncidentTypeIdForPulse(
		pulseType: PulseEnum,
		incidentTypeId?: string | null,
	): Promise<IncidentTypeResult<{ incidentTypeId: string | null }>> {
		if (pulseType !== PulseEnum.Emergency) {
			return { ok: true, data: { incidentTypeId: null } };
		}

		if (incidentTypeId) {
			const incidentType = await this.getIncidentTypeById(incidentTypeId);
			if (!incidentType?.isActive) {
				return {
					ok: false,
					code: "NOT_FOUND",
					message: "Incident type not found or inactive",
				};
			}

			return { ok: true, data: { incidentTypeId: incidentType.id } };
		}

		const fallback = await this.getIncidentTypeBySlug(
			DefaultIncidentTypeSlugEnum.Other,
		);
		if (!fallback?.isActive) {
			return {
				ok: false,
				code: "INVALID_STATE",
				message: "Default incident type is unavailable",
			};
		}

		return { ok: true, data: { incidentTypeId: fallback.id } };
	}

	async createIncidentType(
		payload: CreateIncidentTypePayload,
	): Promise<IncidentTypeResult<{ incidentType: IncidentTypeType }>> {
		try {
			const slug = this.slugify(payload.label);
			const existing = await this.getIncidentTypeBySlug(slug);
			if (existing) {
				return {
					ok: false,
					code: "CONFLICT",
					message: "An incident type with this name already exists",
				};
			}

			const incidentType = await this.incidentTypeRepo.create({
				slug,
				label: payload.label,
				description: payload.description || null,
				isActive: true,
				isSystem: false,
				sortOrder: payload.sortOrder ?? (await this.getNextSortOrder()),
			});

			if (!incidentType) {
				return {
					ok: false,
					code: "INVALID_STATE",
					message: "Failed to create incident type",
				};
			}

			await this.invalidateIncidentTypeCaches();
			return { ok: true, data: { incidentType } };
		} catch (error) {
			handleError(error);
			return {
				ok: false,
				code: "INVALID_STATE",
				message: "Failed to create incident type",
			};
		}
	}

	async updateIncidentType(
		id: string,
		payload: UpdateIncidentTypePayload,
	): Promise<IncidentTypeResult<{ incidentType: IncidentTypeType }>> {
		try {
			const existing = await this.incidentTypeRepo.getOne(id);
			if (!existing) {
				return {
					ok: false,
					code: "NOT_FOUND",
					message: "Incident type not found",
				};
			}

			if (
				existing.slug === DefaultIncidentTypeSlugEnum.Other &&
				payload.isActive === false
			) {
				return {
					ok: false,
					code: "INVALID_STATE",
					message: "The fallback incident type must remain active",
				};
			}

			const incidentType = await this.incidentTypeRepo.update(id, {
				...(payload.label !== undefined ? { label: payload.label } : {}),
				...(payload.description !== undefined
					? { description: payload.description || null }
					: {}),
				...(payload.isActive !== undefined
					? { isActive: payload.isActive }
					: {}),
				...(payload.sortOrder !== undefined
					? { sortOrder: payload.sortOrder }
					: {}),
			});

			await this.invalidateIncidentTypeCaches();
			return { ok: true, data: { incidentType } };
		} catch (error) {
			handleError(error);
			return {
				ok: false,
				code: "INVALID_STATE",
				message: "Failed to update incident type",
			};
		}
	}
}

export const incidentTypeService = new IncidentTypeService();
