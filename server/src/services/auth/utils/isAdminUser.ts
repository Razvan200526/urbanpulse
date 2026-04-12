import { UserRole } from "@server/types";

const defaultAdminEmails = [
	"calinrazvanandrei26@gmail.com",
	"doruippu@gmail.com",
] as const;

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const getConfiguredAdminEmails = () => {
	const configuredEmails = Bun.env.ADMIN_USER_EMAILS?.split(",")
		.map((email) => email.trim())
		.filter(Boolean);

	return new Set(
		[...defaultAdminEmails, ...(configuredEmails ?? [])].map(normalizeEmail),
	);
};

export const isAdminUser = (email: string | null | undefined) => {
	if (!email) {
		return false;
	}

	return getConfiguredAdminEmails().has(normalizeEmail(email));
};

export const applyAdminUserRole = (
	email: string | null | undefined,
	currentRole?: string | null,
) => {
	if (isAdminUser(email)) {
		return UserRole.ADMIN;
	}

	return currentRole ?? UserRole.USER;
};
