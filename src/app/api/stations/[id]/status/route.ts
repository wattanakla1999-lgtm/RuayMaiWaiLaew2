import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
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
    const station = await prisma.station.findUnique({ where: { id } });
    if (!station) {
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

    const [fuelUpdated] = await prisma.$transaction([
      prisma.stationFuel.upsert({
        where: {
          stationId_fuelType: {
            stationId: id,
            fuelType: fuelType as any,
          },
        },
        update: { 
          status: fuelStatus,
          restockEstimate: finalRestockEstimate,
        },
        create: {
          stationId: id,
          fuelType: fuelType as any,
          status: fuelStatus,
          restockEstimate: finalRestockEstimate,
        },
      }),
      prisma.fuelStatusLog.create({
        data: {
          stationId: id,
          fuelType: fuelType as any,
          fuelStatus,
          updatedById: session.user.id,
          note,
        },
      }),
    ]);

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
