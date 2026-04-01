// export const fakeSkills = [
// 	{ id: 1, tag: "Fixing Leaky Pipes" },
// 	{ id: 2, tag: "Unclogging Drains" },
// 	{ id: 3, tag: "Basic Electrical Repairs" },
// 	{ id: 4, tag: "Changing Light Fixtures" },
// 	{ id: 5, tag: "Furniture Assembly" },
// 	{ id: 6, tag: "Heavy Lifting Help" },
// 	{ id: 7, tag: "Moving Assistance" },
// 	{ id: 8, tag: "Car Battery Jumpstart" },
// 	{ id: 9, tag: "Flat Tire Change" },
// 	{ id: 10, tag: "Basic Car Diagnostics" },
// 	{ id: 11, tag: "Grocery Pickup" },
// 	{ id: 12, tag: "Pet Care Help" },
// 	{ id: 13, tag: "Cleaning & Tidying" },
// 	{ id: 14, tag: "Yard Work / Gardening" },
// 	{ id: 15, tag: "Painting Walls" },
// 	{ id: 16, tag: "Door Lock Fix" },
// 	{ id: 17, tag: "Appliance Setup" },
// 	{ id: 18, tag: "Tech Setup (WiFi, TV)" },
// 	{ id: 19, tag: "Emergency Ride" },
// 	{ id: 20, tag: "Package Pickup / Delivery" },
// ];

// export type ResourceAvailabilityType =
// 	| "Available"
// 	| "Unavailable"
// 	| "Currently Unavailable";

// export type ResourceType = {
// 	description: string | null;
// 	id: string;
// 	name: string;
// 	createdAt: Date;
// 	userId: string;
// 	availability: ResourceAvailabilityType;
// };

// export const fakeResources: ResourceType[] = [
// 	{
// 		id: "res_1a2b3c4d5e6f",
// 		name: "Conference Room A",
// 		description:
// 			"Large meeting room with projector, whiteboard, and video conferencing setup",
// 		createdAt: new Date("2024-01-15T09:30:00Z"),
// 		userId: "user_abc123xyz",
// 		availability: "Available",
// 	},
// 	{
// 		id: "res_2g3h4i5j6k7l",
// 		name: "Design Laptop Pro",
// 		description: "MacBook Pro M3 Max for design team use",
// 		createdAt: new Date("2024-02-20T14:15:00Z"),
// 		userId: "user_def456uvw",
// 		availability: "Unavailable",
// 	},
// 	{
// 		id: "res_3m4n5o6p7q8r",
// 		name: "Parking Spot #12",
// 		description: null,
// 		createdAt: new Date("2024-03-01T08:00:00Z"),
// 		userId: "user_ghi789rst",
// 		availability: "Available",
// 	},
// 	{
// 		id: "res_4s5t6u7v8w9x",
// 		name: "VR Headset Kit",
// 		description: "Meta Quest 3 with controllers and charging station",
// 		createdAt: new Date("2024-03-10T11:45:00Z"),
// 		userId: "user_jkl012opq",
// 		availability: "Currently Unavailable",
// 	},
// 	{
// 		id: "res_5y6z7a8b9c0d",
// 		name: "Studio Camera Set",
// 		description: "Sony A7IV with tripod, lighting, and microphone kit",
// 		createdAt: new Date("2024-03-22T16:20:00Z"),
// 		userId: "user_mno345lmn",
// 		availability: "Available",
// 	},
// 	{
// 		id: "res_6e7f8g9h0i1j",
// 		name: "Hot Desk 4B",
// 		description: "Standing desk with dual monitor setup",
// 		createdAt: new Date("2024-04-05T10:00:00Z"),
// 		userId: "user_pqr678ijk",
// 		availability: "Unavailable",
// 	},
// 	{
// 		id: "res_7k8l9m0n1o2p",
// 		name: "Projector Unit",
// 		description: "4K HDR projector for presentations and events",
// 		createdAt: new Date("2024-04-12T13:30:00Z"),
// 		userId: "user_stu901ghi",
// 		availability: "Currently Unavailable",
// 	},
// 	{
// 		id: "res_8q9r0s1t2u3v",
// 		name: "Phone Booth 2",
// 		description: null,
// 		createdAt: new Date("2024-04-18T09:15:00Z"),
// 		userId: "user_vwx234def",
// 		availability: "Available",
// 	},
// ];

// // Helper function to generate random fake resource
// export const generateFakeResource = (
// 	overrides?: Partial<ResourceType>,
// ): ResourceType => {
// 	const availabilityOptions: ResourceAvailabilityType[] = [
// 		"Available",
// 		"Unavailable",
// 		"Currently Unavailable",
// 	];

// 	const baseResource: ResourceType = {
// 		id: `res_${Math.random().toString(36).substring(2, 14)}`,
// 		name: `Resource ${Math.floor(Math.random() * 1000)}`,
// 		description: Math.random() > 0.3 ? "Auto-generated test resource" : null,
// 		createdAt: new Date(),
// 		userId: `user_${Math.random().toString(36).substring(2, 10)}`,
// 		availability:
// 			availabilityOptions[
// 				Math.floor(Math.random() * availabilityOptions.length)
// 			],
// 	};

// 	return { ...baseResource, ...overrides };
// };

// // Helper to filter resources by availability
// export const filterResourcesByAvailability = (
// 	resources: ResourceType[],
// 	availability: ResourceAvailabilityType,
// ): ResourceType[] => {
// 	return resources.filter((resource) => resource.availability === availability);
// };
