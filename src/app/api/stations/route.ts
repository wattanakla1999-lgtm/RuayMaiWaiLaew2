import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { CreateStationSchema } from "@/lib/validations";
import type { ApiResponse } from "@/types";

// GET /api/stations — list all ACTIVE stations
export async function GET(): Promise<Response> {
  try {
    const stations = await prisma.station.findMany({
      where: { status: "ACTIVE" },
      include: {
        owner: { select: { id: true, name: true } },
        fuels: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    const result = stations.map((s) => {
      // Simple summary logic:
      // - If any fuel is AVAILABLE, status is AVAILABLE
      // - Else if any is LOW, status is LOW
      // - Else EMPTY
      let summaryStatus: "AVAILABLE" | "LOW" | "EMPTY" = "EMPTY";
      if (s.fuels.some((f) => f.status === "AVAILABLE")) {
        summaryStatus = "AVAILABLE";
      } else if (s.fuels.some((f) => f.status === "LOW")) {
        summaryStatus = "LOW";
      }

      // Latest fuel update
      const latestUpdate = s.fuels.reduce(
        (latest, f) => (f.updatedAt > latest ? f.updatedAt : latest),
        s.updatedAt
      );

      return {
        ...s,
        fuelStatus: summaryStatus,
        fuelUpdatedAt: latestUpdate,
      };
    });

    return Response.json({ data: result } satisfies ApiResponse);
  } catch (err) {
    console.error("[GET /api/stations]", err);
    return Response.json({ error: "เกิดข้อผิดพลาด กรุณาลองใหม่" } satisfies ApiResponse, { status: 500 });
  }
}

// POST /api/stations — add new station (default PENDING)
export async function POST(request: NextRequest): Promise<Response> {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";

  // Rate limit: max 3 station submissions per IP per hour
  const rl = rateLimit(`add-station:${ip}`, 3, 60 * 60 * 1000);
  if (!rl.success) {
    return Response.json(
      { error: `ส่งคำขอบ่อยเกินไป กรุณารอ ${rl.retryAfter} วินาที` } satisfies ApiResponse,
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "ข้อมูลไม่ถูกต้อง" } satisfies ApiResponse, { status: 400 });
  }

  const parsed = CreateStationSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() } satisfies ApiResponse,
      { status: 400 }
    );
  }

  try {
    const session = await auth();
    const station = await prisma.station.create({
      data: {
        name: parsed.data.name,
        lat: parsed.data.lat,
        lng: parsed.data.lng,
        address: parsed.data.address,
        phone: parsed.data.phone,
        brand: parsed.data.brand,
        image: parsed.data.image,
        status: "PENDING",
        ownerId: session?.user?.id ?? null,
        fuels: parsed.data.fuels ? {
          create: parsed.data.fuels,
        } : undefined,
      },
    });
    return Response.json(
      { data: station } satisfies ApiResponse,
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/stations]", err);
    return Response.json({ error: "เกิดข้อผิดพลาด กรุณาลองใหม่" } satisfies ApiResponse, { status: 500 });
  }
}
