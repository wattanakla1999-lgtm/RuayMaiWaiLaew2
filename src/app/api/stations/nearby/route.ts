import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
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
    const fuelsWhere: any = {};
    if (fuelStatus !== "ALL") fuelsWhere.status = fuelStatus;
    if (fuelType !== "ALL") fuelsWhere.fuelType = fuelType;

    const stations = await prisma.station.findMany({
      where: {
        status: "ACTIVE",
        ...(brand !== "ALL" ? { brand } : {}),
        lat: { gte: lat - latDelta, lte: lat + latDelta },
        lng: { gte: lng - lngDelta, lte: lng + lngDelta },
        ...(Object.keys(fuelsWhere).length > 0
          ? {
              fuels: {
                some: fuelsWhere,
              },
            }
          : {}),
      },
      include: {
        owner: { select: { id: true, name: true } },
        fuels: true,
      },
    });

    const now = Date.now();

    const result: StationWithDistance[] = stations
      .map((s) => {
        const dist = haversine(lat, lng, s.lat, s.lng);
        const mappedFuels = s.fuels.map((f) => ({
          ...f,
          isStale: now - f.updatedAt.getTime() > FUEL_EXPIRE_MS,
        }));

        // Compute summary status (same as /api/stations)
        let summaryStatus: "AVAILABLE" | "LOW" | "EMPTY" = "EMPTY";
        if (s.fuels.some((f) => f.status === "AVAILABLE")) {
          summaryStatus = "AVAILABLE";
        } else if (s.fuels.some((f) => f.status === "LOW")) {
          summaryStatus = "LOW";
        }

        const latestUpdate = s.fuels.reduce(
          (latest, f) => (f.updatedAt > latest ? f.updatedAt : latest),
          s.updatedAt
        );

        const isStale = now - latestUpdate.getTime() > FUEL_EXPIRE_MS;
        
        return { 
          ...s, 
          distance: Math.round(dist * 100) / 100,
          fuelStatus: summaryStatus,
          fuelUpdatedAt: latestUpdate,
          isStale,
          fuels: mappedFuels 
        };
      })
      .filter((s) => s.distance <= radius)
      .sort((a: StationWithDistance, b: StationWithDistance) => a.distance - b.distance);

    return Response.json({ data: result } satisfies ApiResponse);
  } catch (err) {
    console.error("[GET /api/stations/nearby]", err);
    return Response.json({ error: "เกิดข้อผิดพลาด กรุณาลองใหม่" } satisfies ApiResponse, { status: 500 });
  }
}
