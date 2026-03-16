import {
	type UserRepository,
	userRepository,
} from "@server/repositories/UserRepository";
import { logger } from "@server/utils/Logger";
import { isEmailValid } from "@shared/validators/isEmailValid";
import type { User } from "better-auth";

export class UserService {
	private readonly userRepo: UserRepository;

	constructor() {
		this.userRepo = userRepository;
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
}

export const userService = new UserService();
