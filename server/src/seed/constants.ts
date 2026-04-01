export const seedIds = {
	users: {
		alex: "user_alex",
		maria: "user_maria",
		vlad: "user_vlad",
		elena: "user_elena",
		irina: "user_irina",
		daniel: "user_daniel",
	},
	pulses: {
		lostDog: "10000000-0000-4000-8000-000000000001",
		bloodDrive: "10000000-0000-4000-8000-000000000002",
		powerOutage: "10000000-0000-4000-8000-000000000003",
		medicalRide: "10000000-0000-4000-8000-000000000004",
	},
	conversations: {
		lostDog: "20000000-0000-4000-8000-000000000001",
		direct: "20000000-0000-4000-8000-000000000002",
		helpers: "20000000-0000-4000-8000-000000000003",
	},
	petAlerts: {
		lostDog: "30000000-0000-4000-8000-000000000001",
		foundDog: "30000000-0000-4000-8000-000000000002",
	},
	resources: {
		portableGenerator: "40000000-0000-4000-8000-000000000001",
		firstAidKit: "40000000-0000-4000-8000-000000000002",
		childCarSeat: "40000000-0000-4000-8000-000000000003",
		waterPump: "40000000-0000-4000-8000-000000000004",
	},
} as const;
