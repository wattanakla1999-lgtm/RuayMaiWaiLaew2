import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const station = await prisma.station.findUnique({
      where: { id },
      include: {
        fuels: true,
      },
    });

    if (!station) {
      return NextResponse.json({ error: "ไม่พบข้อมูลปั๊ม" }, { status: 404 });
    }

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

    const existing = await prisma.station.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "ไม่พบข้อมูลปั๊ม" }, { status: 404 });
    }

    const updated = await prisma.station.update({
      where: { id },
      data: {
        name,
        lat,
        lng,
        address,
        phone,
        brand,
        image,
      },
    });

    // Handle fuels update if provided
    if (fuels && Array.isArray(fuels)) {
      // Very simple strategy: delete existing and recreate
      await prisma.fuelStatusLog.deleteMany({
        where: { stationId: id }
      });
      await prisma.stationFuel.deleteMany({
        where: { stationId: id }
      });
      
      const fuelData = fuels.map((f: any) => ({
        stationId: id,
        fuelType: f.fuelType,
        status: f.status,
      }));
      
      if (fuelData.length > 0) {
        await prisma.stationFuel.createMany({
          data: fuelData
        });
      }
    }

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "เกิดข้อผิดพลาดในการอัปเดตข้อมูล" }, { status: 500 });
  }
}
