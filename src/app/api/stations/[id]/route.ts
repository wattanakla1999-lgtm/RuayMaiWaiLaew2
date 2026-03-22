import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = supabaseAdmin();
    const { data: station, error } = await supabase
      .from('Station')
      .select('*, fuels:StationFuel(*)')
      .eq('id', id)
      .single();

    if (!station) {
      return NextResponse.json({ error: "ไม่พบข้อมูลปั๊ม" }, { status: 404 });
    }

    console.log(`[GET /api/stations/${id}] Found fuels:`, station.fuels?.length || 0);
    return NextResponse.json({ data: station });
  } catch (error: any) {
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, lat, lng, address, phone, brand, image, fuels } = body;

    const supabase = supabaseAdmin();
    const { data: existing, error: findError } = await supabase
      .from('Station')
      .select()
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "ไม่พบข้อมูลปั๊ม" }, { status: 404 });
    }

    const { data: updated, error: updateError } = await supabase
      .from('Station')
      .update({
        name,
        lat,
        lng,
        address,
        phone,
        brand,
        image,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Handle fuels update if provided
    if (fuels && Array.isArray(fuels)) {
      // Very simple strategy: delete existing and recreate
      await supabase.from('FuelStatusLog').delete().eq('stationId', id);
      await supabase.from('StationFuel').delete().eq('stationId', id);
      
      const fuelData = fuels.map((f: any) => ({
        id: crypto.randomUUID(),
        stationId: id,
        fuelType: f.fuelType,
        status: f.status,
        updatedAt: new Date().toISOString(),
      }));
      
      if (fuelData.length > 0) {
        const { error: fuelsError } = await supabase.from('StationFuel').insert(fuelData);
        if (fuelsError) throw fuelsError;
      }
    }

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "เกิดข้อผิดพลาดในการอัปเดตข้อมูล" }, { status: 500 });
  }
}
