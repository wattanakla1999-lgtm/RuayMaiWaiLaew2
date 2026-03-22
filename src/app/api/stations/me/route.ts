import { supabaseAdmin } from "@/lib/supabase";
import { auth } from "@/lib/auth";
import type { ApiResponse } from "@/types";

// GET /api/stations/me — list only stations owned by the current user
export async function GET(): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "กรุณาเข้าสู่ระบบ" } satisfies ApiResponse, { status: 401 });
    }

    const supabase = supabaseAdmin();
    const { data: stations, error: fetchError } = await supabase
      .from('Station')
      .select('*, owner:User(id, name), fuels:StationFuel(*)')
      .eq('ownerId', session.user.id)
      .order('updatedAt', { ascending: false });

    if (fetchError) throw fetchError;

    const result = stations.map((s: any) => {
      let summaryStatus: "AVAILABLE" | "LOW" | "EMPTY" = "EMPTY";
      if (s.fuels.some((f: any) => f.status === "AVAILABLE")) {
        summaryStatus = "AVAILABLE";
      } else if (s.fuels.some((f: any) => f.status === "LOW")) {
        summaryStatus = "LOW";
      }

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
    console.error("[GET /api/stations/me]", err);
    return Response.json({ error: "เกิดข้อผิดพลาด กรุณาลองใหม่" } satisfies ApiResponse, { status: 500 });
  }
}
