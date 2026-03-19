import {
	type UserRepository,
	userRepository,
} from "@server/repositories/UserRepository";
import { logger } from "@server/utils/Logger";
import { isEmailValid } from "@shared/validators/isEmailValid";
import type { SignUpInfoType } from "@shared/validators/isSignUpInfoValid";
import type { User } from "better-auth";
import auth from "./auth/AuthService";
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
}

export const userService = new UserService();
