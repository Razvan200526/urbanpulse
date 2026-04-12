export const userAdditionalFields = {
	role: {
		type: "string",
		required: false,
		defaultValue: "user",
		input: false,
	},
	bio: {
		type: "string",
		required: false,
		input: true,
	},
	trustScore: {
		type: "number",
		required: false,
		defaultValue: 0,
		input: false,
	},
	successfulInteractions: {
		type: "number",
		required: false,
		defaultValue: 0,
		input: false,
	},
	failedInteractions: {
		type: "number",
		required: false,
		defaultValue: 0,
		input: false,
	},
	isVerified: {
		type: "boolean",
		required: false,
		defaultValue: false,
		input: false,
	},
	banned: {
		type: "boolean",
		required: false,
		defaultValue: false,
		input: false,
	},
	banReason: {
		type: "string",
		required: false,
		input: false,
	},
	banExpires: {
		type: "date",
		required: false,
		input: false,
	},
	rememberMe: {
		type: "boolean",
		required: false,
		defaultValue: false,
	},
} as const;
