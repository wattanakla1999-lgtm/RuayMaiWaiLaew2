import type { StationWithDistance } from "@/types";
import { StatusBadge } from "@/components/StatusBadge";
import { FUEL_TYPE_LABELS, BRAND_LOGOS } from "@/lib/constants";
import Link from "next/link";

interface StationPopupProps {
  station: StationWithDistance;
  onReportSuccess?: () => void;
}

export function StationPopup({ station, onReportSuccess }: StationPopupProps) {
  return (
    <div className="w-full min-w-[240px] sm:min-w-[280px] max-h-[320px] sm:max-h-[380px] flex flex-col bg-white rounded-lg overflow-hidden border border-gray-200 shadow-2xl">
      {/* Header - Sticky */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-3 sm:px-4 pt-3 sm:pt-4 pb-2 sm:pb-3 border-b border-gray-100 flex gap-2 sm:gap-3 items-start shrink-0">
        {/* Logo Display */}
        {station.brand && BRAND_LOGOS[station.brand] ? (
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white p-1 shrink-0 flex items-center justify-center shadow-md pointer-events-none border border-gray-50">
            <img src={BRAND_LOGOS[station.brand]} alt={station.brand} className="w-full h-full object-contain" />
          </div>
        ) : (
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gray-800 shrink-0 flex items-center justify-center border border-white/10 text-[9px] sm:text-[10px] font-bold text-gray-400">
            {station.brand || "?"}
          </div>
        )}
        <div className="pt-0.5">
          <h3 className="font-black text-sm sm:text-base text-gray-900 leading-snug line-clamp-1">{station.name}</h3>
          {station.address && (
            <p className="text-[9px] sm:text-[10px] text-gray-500 mt-0.5 leading-snug font-medium line-clamp-1">{station.address}</p>
          )}
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="overflow-y-auto flex-1 p-3 sm:p-4 space-y-3 sm:space-y-4 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
        {/* Main Status Badge + time */}
        <div className="flex items-center gap-2">
          <div className="scale-90 sm:scale-100 origin-left">
            <StatusBadge status={station.fuelStatus || "AVAILABLE"} />
          </div>
          <span suppressHydrationWarning className="text-[9px] sm:text-[10px] text-gray-400 font-black uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded-md font-mono border border-gray-100">
            {station.fuelUpdatedAt
              ? `อัปเดต ${new Date(station.fuelUpdatedAt).toLocaleString("th-TH", { timeZone: "Asia/Bangkok", day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })} น.`
              : "ไม่มีข้อมูล"}
          </span>
        </div>

        {station.fuels.length > 0 && (
          <div className="bg-gray-50 p-2 sm:p-3 rounded-xl border border-gray-100 space-y-2">
            <p className="text-[8px] sm:text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">ชนิดน้ำมัน</p>
            {[...station.fuels].sort((a, b) => {
              const priority = { AVAILABLE: 1, LOW: 2, EMPTY: 3 };
              return priority[a.status] - priority[b.status];
            }).map((f) => (
              <div key={f.id} className="flex justify-between items-center text-[11px] sm:text-xs">
                <span className="text-gray-600 font-bold truncate pr-2">
                  {FUEL_TYPE_LABELS[f.fuelType] || f.fuelType}
                </span>
                <div className="flex items-center gap-2 shrink-0 justify-end">
                  <span className={`font-black uppercase tracking-tighter text-[10px] sm:text-[11px] ${f.status === "AVAILABLE" ? "text-[#008952]" :
                    f.status === "LOW" ? "text-amber-500" : "text-red-500"
                    }`}>
                    {f.status === "AVAILABLE" ? "มีน้ำมัน" : f.status === "LOW" ? "ใกล้หมด" : "หมด"}
                  </span>
                  {f.status === "EMPTY" && f.restockEstimate && (
                    <div className="text-[8px] sm:text-[9px] font-black text-amber-700 whitespace-nowrap bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 shadow-sm animate-pulse-subtle flex items-center gap-1">
                      จะเติม: {new Date(f.restockEstimate).toLocaleString("th-TH", { timeZone: "Asia/Bangkok", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false })} น.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Distance / phone */}
        <p className="text-[9px] sm:text-[10px] text-gray-400 font-black tracking-widest flex items-center gap-1.5 uppercase">

          {station.phone && ` 📞 ${station.phone}`}
        </p>

        {/* Edit Station Button */}
        <div className="flex justify-center pt-2">
        </div>
      </div>

      {/* Footer - Sticky Navigate button */}
      {/* <div className="sticky bottom-0 z-30 bg-white/95 backdrop-blur-md p-3 sm:p-4 border-t border-gray-100 shrink-0 shadow-lg">
         <a
           href={`https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`}
           target="_blank"
           rel="noopener noreferrer"
           onClick={() => onReportSuccess?.()}
           className="flex items-center justify-center gap-2 w-full text-xs sm:text-sm font-black py-2.5 sm:py-3 px-4 rounded-xl bg-[#008952] hover:bg-[#007445] text-white transition-all shadow-xl shadow-[#008952]/20 active:scale-95"
         >
            นำทาง
         </a>
       </div> */}
    </div>
  );
}
