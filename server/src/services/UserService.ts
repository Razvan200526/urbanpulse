import {
	userRepository,
	type UserRepository,
} from "@server/repositories/UserRepository";
import { isEmailValid } from "@shared/validators/isEmailValid";

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
		const user = await this.userRepo.findByEmail(email);
		if (!user) {
			return false;
		} else {
			return true;
		}
	}
}

export const userService = new UserService();
