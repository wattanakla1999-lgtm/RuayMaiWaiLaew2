import type { FuelStatus } from "@/generated/prisma";

const CONFIG: Record<FuelStatus, { label: string; bg: string; dot: string; border: string; text: string }> = {
  AVAILABLE: {
    label: "มีน้ำมัน",
    bg: "bg-emerald-50",
    dot: "bg-emerald-500",
    border: "border-emerald-200",
    text: "text-emerald-700",
  },
  LOW: {
    label: "ใกล้หมด",
    bg: "bg-amber-50",
    dot: "bg-amber-500",
    border: "border-amber-200",
    text: "text-amber-700",
  },
  EMPTY: {
    label: "หมดแล้ว",
    bg: "bg-red-50",
    dot: "bg-red-500",
    border: "border-red-200",
    text: "text-red-700",
  },
};

export function StatusBadge({
  status,
}: {
  status: FuelStatus;
}) {
  const cfg = CONFIG[status];
  if (!cfg) return <span className="text-gray-500 text-xs italic">ไม่ระบุ</span>;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.border} ${cfg.text}`}
    >
      <span className={`w-2 h-2 rounded-full ${cfg.dot} animate-pulse`} />
      {status !== "AVAILABLE" && cfg.label}
    </span>
  );
}
