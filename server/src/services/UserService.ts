import type { QuietHoursType, SkillType, UserType } from "@server/db/schema";
import {
	type QuietHoursRepository,
	quietHoursRepository,
} from "@server/repositories/QuietHoursRepository";
import {
	type SkillRepository,
	skillRepository,
} from "@server/repositories/SkillRepository";
import {
	type UserRepository,
	userRepository,
} from "@server/repositories/UserRepository";
import { logger } from "@server/utils/Logger";
import { isEmailValid } from "@shared/validators/isEmailValid";
import type { SignUpInfoType } from "@shared/validators/isSignUpInfoValid";
import type {
	QuietHoursUpsertType,
	SkillTagsUpdateType,
	UserProfileUpdateType,
} from "@shared/validators/users/isUserProfileValid";
import type { User } from "better-auth";
import auth from "./auth/AuthService";

type UserProfileView = {
	user: UserType;
	quietHours: {
		id: string;
		startTime: string;
		endTime: string;
		days: string[];
	} | null;
	skillTags: string[];
};

export class UserService {
	private readonly userRepo: UserRepository;
	private readonly quietHoursRepo: QuietHoursRepository;
	private readonly skillRepo: SkillRepository;

	constructor() {
		this.userRepo = userRepository;
		this.quietHoursRepo = quietHoursRepository;
		this.skillRepo = skillRepository;
	}

	private toShortTime(value: string) {
		return value.slice(0, 5);
	}

	private toDatabaseTime(value: string) {
		return value.length === 5 ? `${value}:00` : value;
	}

	private formatQuietHours(quietHours: QuietHoursType | null) {
		if (!quietHours) {
			return null;
		}

		return {
			id: quietHours.id,
			startTime: this.toShortTime(quietHours.startTime),
			endTime: this.toShortTime(quietHours.endTime),
			days: quietHours.days
				.split(",")
				.map((day) => day.trim())
				.filter(Boolean),
		};
	}

	async getProfile(userId: string): Promise<UserProfileView | null> {
		const user = await this.userRepo.getOne(userId);
		if (!user) {
			return null;
		}

		const [quietHours, skills] = await Promise.all([
			this.quietHoursRepo.findByUserId(userId),
			this.skillRepo.getByUserId(userId),
		]);

		return {
			user,
			quietHours: this.formatQuietHours(quietHours),
			skillTags: skills.map((entry: SkillType) => entry.tag),
		};
	}

	async verifyUserExists(email: string): Promise<boolean> {
		const isValid = isEmailValid(email);
		if (!isValid) {
			return true;
		}
		const user = (await this.userRepo.findByEmail(email)) as User;
		if (!user) {
			logger.success(`User doesn't exist: ${email}`);
			return false;
		} else {
			return true;
		}
	}

	async signUp(payload: SignUpInfoType) {
		const { email, password, name, bio, image } = payload;

		const newUser = await auth.api.signUpEmail({
			body: {
				email,
				password,
				name,
				bio,
				image,
			},
		});

		return newUser;
	}

	async updateProfile(userId: string, payload: UserProfileUpdateType) {
		try {
			return await this.userRepo.update(userId, {
				name: payload.name,
				bio: payload.bio,
				image: payload.image || null,
				updatedAt: new Date(),
			});
		} catch (error) {
			logger.exception(error as Error);
			return null;
		}
	}

	async updateSkillTags(userId: string, payload: SkillTagsUpdateType) {
		const tags = Array.from(
			new Set(payload.tags.map((tag) => tag.trim()).filter(Boolean)),
		);

		try {
			await this.skillRepo.deleteByUserId(userId);

			if (tags.length === 0) {
				return [];
			}

			await Promise.all(
				tags.map((tag) =>
					this.skillRepo.create({
						tag,
						userId,
					}),
				),
			);

			return tags;
		} catch (error) {
			logger.exception(error as Error);
			return null;
		}
	}

	async upsertQuietHours(userId: string, payload: QuietHoursUpsertType) {
		try {
			const existing = await this.quietHoursRepo.findByUserId(userId);
			const data = {
				userId,
				startTime: this.toDatabaseTime(payload.startTime),
				endTime: this.toDatabaseTime(payload.endTime),
				days: payload.days.join(","),
			};

			const quietHours = existing
				? await this.quietHoursRepo.update(existing.id, data)
				: await this.quietHoursRepo.create(data);

			return this.formatQuietHours(quietHours);
		} catch (error) {
			logger.exception(error as Error);
			return null;
		}
	}

	async deleteAccount(userId: string) {
		try {
			return await this.userRepo.delete(userId);
		} catch (error) {
			logger.exception(error as Error);
			return false;
		}
	}
}

export const userService = new UserService();
