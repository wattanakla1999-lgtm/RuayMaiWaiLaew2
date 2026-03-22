"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { StationWithDistance } from "@/types";
import { StatusBadge } from "@/components/StatusBadge";
import { FUEL_TYPE_LABELS, AVAILABLE_BRANDS, BRAND_LOGOS } from "@/lib/constants";

const MapView = dynamic(
  () => import("@/components/MapView").then((m) => m.MapView),
  { ssr: false, loading: () => <div className="w-full h-full bg-gray-50 flex items-center justify-center"><p className="text-gray-400">กำลังโหลดแผนที่...</p></div> }
);

export default function MapPage() {
  const [stations, setStations] = useState<StationWithDistance[]>([]);
  const [userLat, setUserLat] = useState<number | undefined>();
  const [userLng, setUserLng] = useState<number | undefined>();

  // Selection & Filters State
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [radius, setRadius] = useState<number>(5);
  const [fuelStatus, setFuelStatus] = useState<string>("ALL");
  const [fuelType, setFuelType] = useState<string>("ALL");
  const [brand, setBrand] = useState<string>("ALL");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [geoError, setGeoError] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchNearby = useCallback(async (lat: number, lng: number, rad: number, fs: string, ft: string, bd: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/stations/nearby?lat=${lat}&lng=${lng}&radius=${rad}&fuelStatus=${fs}&fuelType=${ft}&brand=${bd}`);
      const data = await res.json();
      if (res.ok) {
        setStations(data.data ?? []);
      } else {
        setError(data.error ?? "เกิดข้อผิดพลาด");
      }
    } catch {
      setError("เชื่อมต่อไม่ได้ กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  }, []);

  // Get User Location Once
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError(true);
      setUserLat(13.7563);
      setUserLng(100.5018);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
      },
      () => {
        setGeoError(true);
        setUserLat(13.7563);
        setUserLng(100.5018);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
  }, []);

  // Fetch when filters or location change
  useEffect(() => {
    if (userLat && userLng) {
      fetchNearby(userLat, userLng, radius, fuelStatus, fuelType, brand);
    }
  }, [userLat, userLng, radius, fuelStatus, fuelType, brand, fetchNearby]);


  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans selection:bg-[#008952]/30">
      {/* Header - Premium Light Glassmorphism */}
      <header className="flex items-center gap-4 px-6 py-3 bg-white/80 backdrop-blur-md border-b border-gray-200/50 z-20 shrink-0 shadow-sm">
        <Link
          href="/"
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 transition-all border border-gray-200 group"
          id="back-home"
        >
          <span className="group-hover:-translate-x-0.5 transition-transform text-xl">←</span>
        </Link>
        <div className="flex-1">
          <h1 className="text-gray-900 font-extrabold text-lg tracking-tight">ปั๊มน้ำมันใกล้ฉัน</h1>
          {/* {geoError ? (
            <p suppressHydrationWarning className="text-gray-500/80 text-[10px] uppercase tracking-widest font-bold">⚠️ GPS ปิดอยู่ • แสดงเขตกทม.</p>
          ) : (
            <p suppressHydrationWarning className="text-emerald-600/80 text-[10px] uppercase tracking-widest font-bold">🛰️ ระบุตำแหน่งด้วยดาวเทียม</p>
          )} */}
        </div>
        <button
          id="refresh-btn"
          onClick={() => userLat && userLng && fetchNearby(userLat, userLng, radius, fuelStatus, fuelType, brand)}
          disabled={loading}
          className="group relative w-9 h-9 flex items-center justify-center rounded-xl bg-[#008952]/10 hover:bg-[#008952]/20 text-[#008952] transition-all border border-[#008952]/20 disabled:opacity-30 overflow-hidden"
        >
          <span className={`${loading ? "animate-spin" : "group-hover:rotate-180"} transition-transform duration-500 text-lg`}>
            {loading ? "⌛" : "🔄"}
          </span>
        </button>
      </header>

      {/* Filters & Status Bar */}
      <div className="relative px-6 py-2 bg-white border-b border-gray-200 z-10 shrink-0 shadow-sm">
        <div className="grid grid-cols-2 gap-3 lg:flex lg:items-center lg:gap-x-5">
          {/* Radius Filter */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">รัศมีค้นหา</span>
            <div className="relative group">
              <select
                suppressHydrationWarning
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="appearance-none w-full bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 hover:border-[#008952]/40 rounded-xl pl-3 pr-8 py-2.5 outline-none transition-all cursor-pointer text-xs font-bold shadow-sm"
              >
                {mounted && (
                  <>
                    <option value={1}>1 กม.</option>
                    <option value={3}>3 กม.</option>
                    <option value={5}>5 กม.</option>
                    <option value={10}>10 กม.</option>
                    <option value={15}>15 กม.</option>
                    <option value={20}>20 กม.</option>
                    <option value={25}>25 กม.</option>
                    <option value={30}>30 กม.</option>
                    <option value={35}>35 กม.</option>
                    <option value={40}>40 กม.</option>
                    <option value={45}>45 กม.</option>
                    <option value={50}>50 กม.</option>
                    <option value={55}>55 กม.</option>
                  </>
                )}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-[#008952] transition-colors text-[9px]">
                ▼
              </div>
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">สถานะปั๊ม</span>
            <div className="relative group">
              <select
                suppressHydrationWarning
                value={fuelStatus}
                onChange={(e) => setFuelStatus(e.target.value)}
                className="appearance-none w-full bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 hover:border-[#008952]/40 rounded-xl pl-3 pr-8 py-2.5 outline-none transition-all cursor-pointer text-xs font-bold shadow-sm"
              >
                {mounted && (
                  <>
                    <option value="ALL">ทั้งหมด</option>
                    <option value="AVAILABLE">✅ มีน้ำมัน</option>
                    <option value="LOW">⚠️ ใกล้หมด</option>
                    <option value="EMPTY">❌ หมดแล้ว</option>
                  </>
                )}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-[#008952] transition-colors text-[9px]">
                ▼
              </div>
            </div>
          </div>

          {/* Type Filter */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">ประเภทน้ำมัน</span>
            <div className="relative group">
              <select
                suppressHydrationWarning
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value)}
                className="appearance-none w-full bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 hover:border-[#008952]/40 rounded-xl pl-3 pr-8 py-2.5 outline-none transition-all cursor-pointer text-xs font-bold shadow-sm"
              >
                {mounted && (
                  <>
                    <option value="ALL">ทุกประเภท</option>
                    <option value="DIESEL">ดีเซล (Diesel)</option>
                    <option value="GASOHOL_95">แก๊สโซฮอล์ 95</option>
                    <option value="GASOHOL_91">แก๊สโซฮอล์ 91</option>
                    <option value="GASOHOL_E20">E20</option>
                    <option value="BENZINE">เบนซิน</option>
                  </>
                )}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-[#008952] transition-colors text-[9px]">
                ▼
              </div>
            </div>
          </div>

          {/* Brand Filter */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">ยี่ห้อ</span>
            <div className="relative group">
              <select
                suppressHydrationWarning
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="appearance-none w-full bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 hover:border-[#008952]/40 rounded-xl pl-3 pr-8 py-2.5 outline-none transition-all cursor-pointer text-xs font-bold shadow-sm"
              >
                {mounted && AVAILABLE_BRANDS.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-[#008952] transition-colors text-[9px]">
                ▼
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">

        {/* Map Component - Proportional Height on Mobile */}
        <div className="h-[40vh] md:h-auto md:flex-[2] relative group min-h-0 border-b md:border-b-0 border-gray-200">
          {error && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-red-600/90 backdrop-blur text-white text-xs font-black rounded-full shadow-2xl z-[50] flex items-center gap-2 border border-red-500">
              ⚠️ {error}
            </div>
          )}
          {userLat && userLng ? (
            <MapView
              stations={stations}
              userLat={userLat}
              userLng={userLng}
              radius={radius}
              onRefresh={() => userLat && userLng && fetchNearby(userLat, userLng, radius, fuelStatus, fuelType, brand)}
              selectedStationId={selectedStationId}
              onSelectStationId={setSelectedStationId}
            />
          ) : (
            <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-gray-200 border-t-[#008952] rounded-full animate-spin" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl">📍</div>
              </div>
              <p className="text-gray-500 font-bold tracking-tight animate-pulse">กำลังระบุตำแหน่งของคุณ...</p>
            </div>
          )}
        </div>

        {/* Station List Sidebar - Flex Remaining Space */}
        <div className="flex-1 md:flex-[1] bg-white border-t md:border-t-0 md:border-l border-gray-200 flex flex-col min-h-0 shadow-inner relative z-10 overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-white sticky top-0 shrink-0 flex items-center justify-between shadow-sm">
            <h2 className="text-gray-900 font-black text-base flex items-center gap-2">
              <span className="w-1.5 h-6 bg-[#008952] rounded-full" />
              ปั๊มน้ำมันใกล้คุณ
              <span className="bg-gray-100 text-gray-500 py-0.5 px-2 rounded-full text-[10px] font-black ml-1 uppercase tracking-wider">
                {stations.length}
              </span>
            </h2>
            <div className="text-[10px] font-black text-[#008952] uppercase tracking-widest">
              เรียงตามระยะทาง
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-20 space-y-4 pt-2 custom-scrollbar">
            {stations.map((station) => (
              <div
                key={station.id}
                onClick={() => setSelectedStationId(station.id)}
                className={`group relative p-3 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden ${selectedStationId === station.id
                  ? "bg-white border-[#008952] shadow-[0_10px_30px_rgba(0,137,82,0.15)] ring-1 ring-[#008952] scale-[1.02] z-10"
                  : "bg-white border-gray-200 hover:border-[#008952]/30 hover:shadow-md shadow-sm"
                  }`}
              >
                {/* Highlight Effect for Selected */}
                {selectedStationId === station.id && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#008952]/5 blur-3xl -mr-16 -mt-16 rounded-full" />
                )}

                <div className="flex justify-between items-start gap-2 relative">
                  <div className="flex-1 flex items-start gap-3">
                    {/* Logo Display */}
                    {station.brand && BRAND_LOGOS[station.brand] ? (
                      <div className="w-12 h-12 rounded-lg bg-white p-1 shrink-0 flex items-center justify-center shadow-md border border-gray-100 pointer-events-none group-hover:scale-110 transition-transform">
                        <img src={BRAND_LOGOS[station.brand]} alt={station.brand} className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center border border-gray-200 text-[10px] font-black text-gray-400">
                        {station.brand || "?"}
                      </div>
                    )}

                    <div className="pt-0.5">
                      <h3 className="font-black text-gray-900 text-base leading-snug group-hover:text-[#008952] transition-colors">
                        {station.name}
                        <span className="text-[10px] text-gray-500 font-bold mt-0.5 uppercase tracking-wider flex items-center gap-1">
                          <span className="text-[#008952] text-xs">📍</span> {station.distance} กม.
                        </span>
                      </h3>

                    </div>
                  </div>
                  <div className={`px-2 py-0.5 rounded-md text-[8px] font-black tracking-widest transition-all ${selectedStationId === station.id ? "bg-[#008952] text-white shadow-md shadow-[#008952]/20" : "bg-white text-gray-400 uppercase"
                    }`}>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className={`w-full flex items-center justify-center gap-2 text-sm font-black py-3 px-5 rounded-2xl transition-all duration-300 border shadow-sm ${selectedStationId === station.id
                        ? "bg-[#008952] text-white border-[#008952] shadow-xl shadow-[#008952]/30 hover:shadow-[#008952]/40 hover:scale-[1.03] active:scale-95 translate-y-[-2px]"
                        : "bg-white hover:bg-gray-50 text-gray-700 border-gray-200"
                        }`}
                    >
                      นำทาง
                    </a>
                  </div>

                </div>

                {/* <div className="flex items-center justify-between gap-2 mb-3 relative">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={station.fuelStatus || "AVAILABLE"} />
                  </div>
                  {station.fuelUpdatedAt && (
                    <span suppressHydrationWarning className="text-[9px] text-gray-400 font-black uppercase tracking-widest bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded">
                      {new Date(station.fuelUpdatedAt).toLocaleString("th-TH", { timeZone: "Asia/Bangkok", day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })} น.
                    </span>
                  )}
                  {station.fuels?.some(f => f.status === "EMPTY" && f.restockEstimate) && (
                    <div className="mb-2 space-y-1">
                      {station.fuels.filter(f => f.status === "EMPTY" && f.restockEstimate).map(f => (
                        <div key={f.id} className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-[#92400e]/80">
                          <span className="flex h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                          คาดการณ์เติม: {f.fuelType} {new Date(f.restockEstimate!).toLocaleString("th-TH", { timeZone: "Asia/Bangkok", day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })} น.
                        </div>
                      ))}
                    </div>
                  )}
                </div> */}



                {/* <div className="flex flex-wrap gap-1.5 mb-4">
                  {station.fuels?.map(f => (
                    <div
                      key={f.id}
                      className={`px-2 py-1 rounded-lg text-[9px] font-black tracking-wider transition-all border flex items-center gap-1.5 ${f.status === "EMPTY"
                        ? "bg-red-50 text-red-500 border-red-100"
                        : "bg-gray-50 text-gray-600 border-gray-100"
                        }`}
                    >
                      {f.status === "EMPTY" ? "❌" : "⛽"} {f.fuelType}
                    </div>
                  ))}
                </div> */}


              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
