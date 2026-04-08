export enum UserRole {
	ADMIN = "admin",
	USER = "user",
}

export type PulseRepsponseParamsType = {
	ownerUserId: string;
	responseId: string;
	pulseId: string;
	pulseTitle: string;
	responderId: string;
	responderName: string;
	note: string;
};

export type MapboxResponse = {
	type: "FeatureCollection";
	features: Feature[];
	attribution: string;
};

export type Feature = {
	type: "Feature";
	id: string;
	geometry: {
		type: "Point";
		coordinates: [number, number];
	};
	properties: {
		mapbox_id: string;
		feature_type: string;
		full_address: string;
		name: string;
		name_preferred: string;
		coordinates: {
			longitude: number;
			latitude: number;
			accuracy?: string;
			routable_points?: {
				name: string;
				latitude: number;
				longitude: number;
			}[];
		};
		place_formatted: string;
		bbox?: [number, number, number, number];
		context: {
			address?: ContextItem & {
				address_number: string;
				street_name: string;
			};
			street?: ContextItem;
			neighborhood?: ContextItem & {
				wikidata_id?: string;
				alternate?: ContextItem;
			};
			postcode?: ContextItem;
			locality?: ContextItem;
			place?: ContextItem;
			district?: ContextItem;
			region?: ContextItem & {
				region_code?: string;
				region_code_full?: string;
			};
			country?: ContextItem & {
				country_code?: string;
				country_code_alpha_3?: string;
			};
		};
	};
};

export type ContextItem = {
	mapbox_id: string;
	name: string;
	wikidata_id?: string;
};
