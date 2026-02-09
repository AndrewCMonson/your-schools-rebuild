import { db } from "@/lib/db";

export interface Coordinates {
  lat: number;
  lng: number;
}

export function haversineMiles(a: Coordinates, b: Coordinates): number {
  const R = 3958.8;
  const toRadians = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * R * Math.asin(Math.sqrt(x));
}

export async function geocodeAddress(input: string): Promise<Coordinates | null> {
  const query = input.trim();
  if (!query) return null;

  const key = process.env.GOOGLE_GEOCODING_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return null;

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${key}`;
  const response = await fetch(url, { next: { revalidate: 60 * 60 * 12 } });

  if (!response.ok) return null;

  const payload = (await response.json()) as {
    status: string;
    results?: Array<{ geometry: { location: Coordinates } }>;
  };

  if (payload.status !== "OK" || !payload.results?.length) return null;

  return payload.results[0].geometry.location;
}

export async function updateMissingSchoolCoordinates(limit = 100) {
  const schools = await db.school.findMany({
    where: {
      OR: [{ lat: null }, { lng: null }],
    },
    take: limit,
  });

  let updated = 0;

  for (const school of schools) {
    const coords = await geocodeAddress(
      `${school.address}, ${school.city}, ${school.state} ${school.zipcode}`,
    );

    if (!coords) continue;

    await db.school.update({
      where: { id: school.id },
      data: {
        lat: coords.lat,
        lng: coords.lng,
      },
    });

    updated += 1;
  }

  return { checked: schools.length, updated };
}
