export type ClientUserType = {
	id: string;
	image: string | null;
	role: string | null;
	name: string;
	email: string;
	createdAt: string;
	updatedAt: string;
	emailVerified: boolean;
	rememberMe: boolean | null;
	bio: string | null;
	trustScore: number | null;
	successfulInteractions: number | null;
	isVerified: boolean | null;
};
