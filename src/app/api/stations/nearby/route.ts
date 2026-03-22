import { type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { auth } from "@/lib/auth";
import { NearbyQuerySchema } from "@/lib/validations";
import type { ApiResponse, StationWithDistance, FuelType } from "@/types";

// Haversine distance formula (returns km)
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const FUEL_EXPIRE_MS = 30 * 60 * 1000; // 30 minutes

// GET /api/stations/nearby?lat=&lng=&radius=
export async function GET(request: NextRequest): Promise<Response> {
  const searchParams = request.nextUrl.searchParams;

  const parsed = NearbyQuerySchema.safeParse({
    lat: searchParams.get("lat"),
    lng: searchParams.get("lng"),
    radius: searchParams.get("radius"),
    fuelStatus: searchParams.get("fuelStatus") || "ALL",
    fuelType: searchParams.get("fuelType") || "ALL",
    brand: searchParams.get("brand") || "ALL",
  });

  if (!parsed.success) {
    return Response.json(
      { error: "ต้องระบุ lat, lng ที่ถูกต้อง", details: parsed.error.flatten() } satisfies ApiResponse,
      { status: 400 }
    );
  }

  const { lat, lng, radius, fuelStatus, fuelType, brand } = parsed.data;

  try {
    // Bounding box pre-filter to reduce DB rows before haversine
    const latDelta = radius / 111;
    const lngDelta = radius / (111 * Math.cos((lat * Math.PI) / 180));

    // Construct relational where clause based on filters
    const supabase = supabaseAdmin();
    let query = supabase
      .from('Station')
      .select('*, owner:User(id, name), fuels:StationFuel(*)')
      .eq('status', 'ACTIVE')
      .gte('lat', lat - latDelta)
      .lte('lat', lat + latDelta)
      .gte('lng', lng - lngDelta)
      .lte('lng', lng + lngDelta);

    if (brand !== "ALL") {
      query = query.eq('brand', brand);
    }

    // Filter by fuel status/type if requested
    // Note: To filter stations by fuel properties in Supabase JS client, 
    // it's often easier to do the specific filtering in JS downstream 
    // unless using a complex RPC or !inner join which might hide some fuels.
    // For now, we'll fetch then filter in JS to ensure the station object is complete.

    const { data: stations, error: fetchError } = await query;
    if (fetchError) throw fetchError;

    const now = Date.now();

    const result: StationWithDistance[] = (stations as any[])
      .map((s) => {
        const dist = haversine(lat, lng, s.lat, s.lng);
        const mappedFuels = (s.fuels as any[]).map((f) => ({
          ...f,
          isStale: now - new Date(f.updatedAt).getTime() > FUEL_EXPIRE_MS,
        }));

        // Compute summary status (same as /api/stations)
        let summaryStatus: "AVAILABLE" | "LOW" | "EMPTY" = "EMPTY";
        if (mappedFuels.some((f) => f.status === "AVAILABLE")) {
          summaryStatus = "AVAILABLE";
        } else if (mappedFuels.some((f) => f.status === "LOW")) {
          summaryStatus = "LOW";
        }

        const latestUpdate = mappedFuels.reduce(
          (latest, f) => (new Date(f.updatedAt).getTime() > new Date(latest).getTime() ? f.updatedAt : latest),
          s.updatedAt
        );

        const isStale = now - new Date(latestUpdate).getTime() > FUEL_EXPIRE_MS;
        
        return { 
          ...s, 
          distance: Math.round(dist * 100) / 100,
          fuelStatus: summaryStatus,
          fuelUpdatedAt: latestUpdate,
          isStale,
          fuels: mappedFuels 
        };
      })
      .filter((s) => {
        // Apply fuel filters if they weren't fully applied in DB
        const distanceMatch = s.distance <= radius;
        const fuelStatusMatch = fuelStatus === "ALL" || s.fuels.some((f: any) => f.status === fuelStatus);
        const fuelTypeMatch = fuelType === "ALL" || s.fuels.some((f: any) => f.fuelType === fuelType);
        return distanceMatch && fuelStatusMatch && fuelTypeMatch;
      })
      .sort((a: StationWithDistance, b: StationWithDistance) => a.distance - b.distance);

    return Response.json({ data: result } satisfies ApiResponse);
  } catch (err) {
    console.error("[GET /api/stations/nearby]", err);
    return Response.json({ error: "เกิดข้อผิดพลาด กรุณาลองใหม่" } satisfies ApiResponse, { status: 500 });
  }
}
