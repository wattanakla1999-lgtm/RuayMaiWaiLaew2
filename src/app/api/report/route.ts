import { type NextRequest } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase";
import { CreateReportSchema } from "@/lib/validations";

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await request.json();
    const parsed = CreateReportSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }

    const { stationId, fuelStatus, fuelType } = parsed.data;

    const supabase = supabaseAdmin();
    const { data: station, error: findError } = await supabase
      .from('Station')
      .select()
      .eq('id', stationId)
      .single();

    if (findError || !station) {
      return Response.json({ error: "ไม่พบปั๊มน้ำมัน" }, { status: 404 });
    }

    const ip = request.headers.get("x-forwarded-for") ?? "unknown";

    // Rate limiting: 1 report per IP per station per fuel per 5 minutes
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: recentReport } = await supabase
      .from('FuelReport')
      .select()
      .eq('stationId', stationId)
      .eq('ip', ip)
      .eq('fuelType', fuelType as any)
      .gte('createdAt', fiveMinsAgo)
      .maybeSingle();

    if (recentReport) {
      return Response.json({ error: "คุณรายงานไปแล้ว กรุณารอสักครู่" }, { status: 429 });
    }

    await supabase
      .from('FuelReport')
      .insert({ 
        id: crypto.randomUUID(), 
        stationId, 
        fuelStatus, 
        fuelType: fuelType as any, 
        ip,
        createdAt: new Date().toISOString()
      });

    await supabase
      .from('StationFuel')
      .upsert({ 
        id: crypto.randomUUID(),
        stationId, 
        fuelType: fuelType as any, 
        status: fuelStatus,
        updatedAt: new Date().toISOString() 
      }, { onConflict: 'stationId,fuelType' });

    await supabase
      .from('FuelStatusLog')
      .insert({ 
        id: crypto.randomUUID(), 
        stationId, 
        fuelStatus, 
        fuelType: fuelType as any, 
        note: "User reported",
        createdAt: new Date().toISOString()
      });

    return Response.json({ success: true });
  } catch (err) {
    console.error("[POST /api/report]", err);
    return Response.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
