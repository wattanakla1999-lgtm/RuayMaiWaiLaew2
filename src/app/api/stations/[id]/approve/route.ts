import { type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { auth } from "@/lib/auth";
import { ApproveStationSchema } from "@/lib/validations";
import type { ApiResponse } from "@/types";

// PATCH /api/stations/[id]/approve — admin approve or reject station
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return Response.json({ error: "เฉพาะ Admin เท่านั้น" } satisfies ApiResponse, { status: 403 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "ข้อมูลไม่ถูกต้อง" } satisfies ApiResponse, { status: 400 });
  }

  const parsed = ApproveStationSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "action ต้องเป็น APPROVE หรือ REJECT", details: parsed.error.flatten() } satisfies ApiResponse,
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

    const newStatus = parsed.data.action === "APPROVE" ? "ACTIVE" : "REJECTED";
    const { data: updated, error: updateError } = await supabase
      .from('Station')
      .update({ 
        status: newStatus,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    return Response.json({ data: updated } satisfies ApiResponse);
  } catch (err) {
    console.error("[PATCH /api/stations/[id]/approve]", err);
    return Response.json({ error: "เกิดข้อผิดพลาด กรุณาลองใหม่" } satisfies ApiResponse, { status: 500 });
  }
}
