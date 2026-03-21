import { Station, FuelStatus, User, FuelType, StationFuel } from "@/generated/prisma/client";
import type { StationStatus } from "@/generated/prisma";

export type { FuelStatus, StationStatus, FuelType, StationFuel };

export interface StationWithDistance extends Omit<Station, "owner" | "fuelStatus" | "fuelUpdatedAt"> {
  fuelStatus?: FuelStatus;
  fuelUpdatedAt?: Date;
  isStale?: boolean;
  distance: number;
  owner: Pick<User, "id" | "name"> | null;
  fuels: (StationFuel & { isStale: boolean })[];
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  details?: unknown;
}
