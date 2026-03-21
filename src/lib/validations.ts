import { z } from "zod";

// =====================
// Station Schemas
// =====================

export const CreateStationSchema = z.object({
  name: z.string().min(2, "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร").max(100),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  address: z.string().max(255).optional(),
  phone: z.string().max(20).optional(),
  brand: z.string().max(100).optional(),
  image: z.string().optional(),
  fuels: z.array(z.object({
    fuelType: z.enum(["DIESEL", "DIESEL_B7", "DIESEL_B20", "DIESEL_PREMIUM", "GASOHOL_91", "GASOHOL_95", "GASOHOL_E20", "GASOHOL_E85", "BENZINE"]),
    status: z.enum(["AVAILABLE", "LOW", "EMPTY"]).default("AVAILABLE"),
  })).optional(),
});

export const NearbyQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(0.1).max(60).default(5), // km, allows up to 55 as requested
  fuelStatus: z.enum(["AVAILABLE", "LOW", "EMPTY", "ALL"]).default("ALL"),
  fuelType: z.string().optional().default("ALL"),
  brand: z.string().optional().default("ALL"),
});

export const UpdateStatusSchema = z.object({
  fuelType: z.string(),
  fuelStatus: z.enum(["AVAILABLE", "LOW", "EMPTY"]),
  note: z.string().max(200).optional(),
  restockEstimate: z.string().datetime().nullable().optional(),
});

export const ApproveStationSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
});

// =====================
// Report Schema
// =====================

export const CreateReportSchema = z.object({
  stationId: z.string().cuid("ID ปั๊มไม่ถูกต้อง"),
  fuelType: z.string(),
  fuelStatus: z.enum(["AVAILABLE", "LOW", "EMPTY"]),
});

// =====================
// Auth Schemas
// =====================

export const LoginSchema = z.object({
  email: z.string().email("อีเมลไม่ถูกต้อง"),
  password: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"),
});

// =====================
// Types inferred from schemas
// =====================

export type CreateStationInput = z.infer<typeof CreateStationSchema>;
export type NearbyQuery = z.infer<typeof NearbyQuerySchema>;
export type UpdateStatusInput = z.infer<typeof UpdateStatusSchema>;
export type CreateReportInput = z.infer<typeof CreateReportSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
