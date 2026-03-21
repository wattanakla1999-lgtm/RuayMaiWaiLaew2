import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { CreateReportSchema } from "@/lib/validations";

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await request.json();
    const parsed = CreateReportSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }

    const { stationId, fuelStatus, fuelType } = parsed.data;

    const station = await prisma.station.findUnique({ where: { id: stationId } });
    if (!station) {
      return Response.json({ error: "ไม่พบปั๊มน้ำมัน" }, { status: 404 });
    }

    const ip = request.headers.get("x-forwarded-for") ?? "unknown";

    // Rate limiting: 1 report per IP per station per fuel per 5 minutes
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentReport = await prisma.fuelReport.findFirst({
      where: { stationId, ip, fuelType: fuelType as any, createdAt: { gte: fiveMinsAgo } },
    });

    if (recentReport) {
      return Response.json({ error: "คุณรายงานไปแล้ว กรุณารอสักครู่" }, { status: 429 });
    }

    await prisma.$transaction([
      prisma.fuelReport.create({
        data: { stationId, fuelStatus, fuelType: fuelType as any, ip },
      }),
      prisma.stationFuel.upsert({
        where: { stationId_fuelType: { stationId, fuelType: fuelType as any } },
        update: { status: fuelStatus, updatedAt: new Date() },
        create: { stationId, fuelType: fuelType as any, status: fuelStatus },
      }),
      prisma.fuelStatusLog.create({
        data: { stationId, fuelStatus, fuelType: fuelType as any, note: "User reported" },
      })
    ]);

    return Response.json({ success: true });
  } catch (err) {
    console.error("[POST /api/report]", err);
    return Response.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
