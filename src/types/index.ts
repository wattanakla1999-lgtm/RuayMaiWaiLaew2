export type Role = "USER" | "OWNER" | "ADMIN";
export type StationStatus = "PENDING" | "ACTIVE" | "REJECTED";
export type FuelStatus = "AVAILABLE" | "LOW" | "EMPTY";
export type FuelType = 
  | "DIESEL" | "DIESEL_B7" | "DIESEL_B20" | "DIESEL_PREMIUM"
  | "GASOHOL_91" | "GASOHOL_95" | "GASOHOL_E20" | "GASOHOL_E85"
  | "BENZINE";

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Station {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string | null;
  phone: string | null;
  brand: string | null;
  image: string | null;
  status: StationStatus;
  ownerId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StationFuel {
  id: string;
  stationId: string;
  fuelType: FuelType;
  status: FuelStatus;
  restockEstimate: string | null;
  updatedAt: string;
}

export interface StationWithDistance extends Omit<Station, "fuelStatus" | "fuelUpdatedAt"> {
  fuelStatus?: FuelStatus;
  fuelUpdatedAt?: string | Date;
  isStale?: boolean;
  distance: number;
  owner?: Pick<User, "id" | "name"> | null;
  fuels: (StationFuel & { isStale?: boolean })[];
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  details?: unknown;
}
