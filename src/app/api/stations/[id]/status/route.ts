import { type NextRequest } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase";
import { auth } from "@/lib/auth";
import { UpdateStatusSchema } from "@/lib/validations";
import type { ApiResponse } from "@/types";

// POST /api/stations/[id]/status — owner updates fuel status
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "กรุณาเข้าสู่ระบบก่อน" } satisfies ApiResponse, { status: 401 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "ข้อมูลไม่ถูกต้อง" } satisfies ApiResponse, { status: 400 });
  }

  const parsed = UpdateStatusSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() } satisfies ApiResponse,
      { status: 400 }
    );
  }

  try {
    const supabase = supabaseAdmin();
    const { data: station, error: findError } = await supabase
      .from('Station')
      .select()
      .eq('id', id)
      .single();

    if (findError || !station) {
      return Response.json({ error: "ไม่พบปั๊มน้ำมัน" } satisfies ApiResponse, { status: 404 });
    }

    // Only the owner or admin can update
    const isOwner = station.ownerId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";
    if (!isOwner && !isAdmin) {
      return Response.json({ error: "ไม่มีสิทธิ์อัปเดตปั๊มนี้" } satisfies ApiResponse, { status: 403 });
    }

    // Backwards compatibility: use DIESEL as default if not provided
    // (Wait, the validation schema requires fuelType, so it should be there if we update the dashboard)
    const { fuelStatus, fuelType = "GASOHOL_95", note, restockEstimate } = parsed.data as any;

    const finalRestockEstimate = fuelStatus === "EMPTY" && restockEstimate ? new Date(restockEstimate) : null;

    const { data: fuelUpdated, error: upsertError } = await supabase
      .from('StationFuel')
      .upsert({
        id: crypto.randomUUID(),
        stationId: id,
        fuelType: fuelType as any,
        status: fuelStatus,
        restockEstimate: finalRestockEstimate ? finalRestockEstimate.toISOString() : null,
        updatedAt: new Date().toISOString(),
      }, { onConflict: 'stationId,fuelType' })
      .select()
      .single();

    if (upsertError) throw upsertError;

    const { error: logError } = await supabase
      .from('FuelStatusLog')
      .insert({
        id: crypto.randomUUID(),
        stationId: id,
        fuelType: fuelType as any,
        fuelStatus,
        updatedById: session.user.id,
        note,
        createdAt: new Date().toISOString(),
      });

    if (logError) {
      console.error("[POST /api/stations/[id]/status] Log insert failed", logError);
    }

    // Return the updated status in a format the dashboard expects
    return Response.json({
      data: {
        id: fuelUpdated.id,
        fuelStatus: fuelUpdated.status,
        fuelUpdatedAt: fuelUpdated.updatedAt,
      },
    } satisfies ApiResponse);
  } catch (err) {
    console.error("[POST /api/stations/[id]/status]", err);
    return Response.json({ error: "เกิดข้อผิดพลาด กรุณาลองใหม่" } satisfies ApiResponse, { status: 500 });
  }
}
