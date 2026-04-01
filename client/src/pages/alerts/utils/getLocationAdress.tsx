export async function getLocationAdress(lat: number, lng: number) {
	const res = await fetch(
		`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
	);

	const data = await res.json();

	return data.display_name as string;
}
