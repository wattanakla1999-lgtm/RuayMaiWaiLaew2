import { type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types";

export async function POST(request: NextRequest): Promise<Response> {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "ข้อมูลไม่ถูกต้อง" } satisfies ApiResponse, { status: 400 });
  }

  const { name, email, password } = body;

  if (!email || !password || password.length < 8) {
    return Response.json({ error: "กรุณาระบุอีเมลและรหัสผ่าน (อย่างน้อย 8 ตัวอักษร)" } satisfies ApiResponse, { status: 400 });
  }

  try {
    const admin = supabaseAdmin();
    // 1. Create User in Supabase Auth
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: name || "" },
    });

    if (authError || !authData.user) {
      if (authError?.message.includes("already registered")) {
        return Response.json({ error: "อีเมลนี้มีการใช้งานแล้วในระบบ" } satisfies ApiResponse, { status: 400 });
      }
      return Response.json({ error: authError?.message || "สมัครสมาชิกผ่านระบบล้มเหลว" } satisfies ApiResponse, { status: 400 });
    }

    // 2. Synchronize to Prisma
    await prisma.user.upsert({
      where: { email: authData.user.email! },
      create: {
        email: authData.user.email!,
        name: name || null,
        role: "USER",
      },
      update: {
        name: name || undefined,
      },
    });

    return Response.json({ data: { success: true } } satisfies ApiResponse, { status: 201 });
  } catch (err) {
    console.error("[POST /api/auth/register]", err);
    return Response.json({ error: "เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่" } satisfies ApiResponse, { status: 500 });
  }
}
