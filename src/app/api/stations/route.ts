import { type NextRequest } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { CreateStationSchema } from "@/lib/validations";
import type { ApiResponse } from "@/types";

// GET /api/stations — list all ACTIVE stations
export async function GET(): Promise<Response> {
  try {
    const supabase = supabaseAdmin();
    const { data: stations, error: fetchError } = await supabase
      .from('Station')
      .select('*, owner:User(id, name), fuels:StationFuel(*)')
      .eq('status', 'ACTIVE')
      .order('updatedAt', { ascending: false });

    if (fetchError) throw fetchError;

    const result = stations.map((s: any) => {
      // Simple summary logic:
      // - If any fuel is AVAILABLE, status is AVAILABLE
      // - Else if any is LOW, status is LOW
      // - Else EMPTY
      let summaryStatus: "AVAILABLE" | "LOW" | "EMPTY" = "EMPTY";
      if (s.fuels.some((f: any) => f.status === "AVAILABLE")) {
        summaryStatus = "AVAILABLE";
      } else if (s.fuels.some((f: any) => f.status === "LOW")) {
        summaryStatus = "LOW";
      }

      // Latest fuel update
      const latestUpdate = s.fuels.reduce(
        (latest: string, f: any) => (f.updatedAt > latest ? f.updatedAt : latest),
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
    const supabase = supabaseAdmin();
    const { data: station, error: createError } = await supabase
      .from('Station')
      .insert({
        id: crypto.randomUUID(),
        name: parsed.data.name,
        lat: parsed.data.lat,
        lng: parsed.data.lng,
        address: parsed.data.address,
        phone: parsed.data.phone,
        brand: parsed.data.brand,
        image: parsed.data.image,
        status: "ACTIVE",
        ownerId: session?.user?.id ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) throw createError;

    let finalFuels: any[] = [];
    if (parsed.data.fuels && parsed.data.fuels.length > 0) {
      const fuelsToCreate = parsed.data.fuels.map(f => ({
        ...f,
        id: crypto.randomUUID(),
        stationId: station.id,
        updatedAt: new Date().toISOString(),
      }));
      console.log("[POST /api/stations] Inserting fuels:", fuelsToCreate);
      const { error: fuelsError } = await supabase
        .from('StationFuel')
        .insert(fuelsToCreate);
      
      if (fuelsError) {
        console.error("[POST /api/stations] Fuels direct insert failed", fuelsError);
        throw new Error("สร้างปั๊มสำเร็จแต่บันทึกชนิดน้ำมันล้มเหลว");
      }
      finalFuels = fuelsToCreate;
    }

    return Response.json(
      { data: { ...station, fuels: finalFuels } } satisfies ApiResponse,
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[POST /api/stations]", err);
    return Response.json({ error: err.message || "เกิดข้อผิดพลาด กรุณาลองใหม่" } satisfies ApiResponse, { status: 500 });
  }
}
