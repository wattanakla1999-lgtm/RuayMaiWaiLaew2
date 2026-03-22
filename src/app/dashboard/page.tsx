"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { StationWithDistance } from "@/types";
import { FUEL_TYPE_LABELS, BRAND_LOGOS } from "@/lib/constants";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";

const FUEL_OPTIONS = [
  { value: "AVAILABLE", label: "มีน้ำมัน" },
  { value: "LOW", label: "ใกล้หมด" },
  { value: "EMPTY", label: "หมดแล้ว" },
] as const;

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stations, setStations] = useState<StationWithDistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [restockModal, setRestockModal] = useState<{ isOpen: boolean; stationId: string; fuelType: string } | null>(null);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [restockDate, setRestockDate] = useState("");

  useEffect(() => {
    fetch("/api/stations/me")
      .then((r) => r.json())
      .then((d) => setStations(d.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  const handleStatusClick = (stationId: string, fuelType: string, fuelStatus: string) => {
    if (fuelStatus === "EMPTY") {
      setRestockDate("");
      setRestockModal({ isOpen: true, stationId, fuelType });
    } else {
      updateStatus(stationId, fuelType, fuelStatus);
    }
  };

  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockModal) return;
    updateStatus(restockModal.stationId, restockModal.fuelType, "EMPTY", restockDate ? new Date(restockDate).toISOString() : undefined);
    setRestockModal(null);
  };

  async function updateStatus(stationId: string, fuelType: string, fuelStatus: string, restockEstimate?: string) {
    const updateKey = `${stationId}-${fuelType}-${fuelStatus}`;
    setUpdating(updateKey);
    setMessage(null);
    try {
      const res = await fetch(`/api/stations/${stationId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fuelStatus, fuelType, restockEstimate }),
      });
      const data = await res.json();
      if (res.ok) {
        setStations((prev) =>
          prev.map((s) =>
            s.id === stationId && s.fuels
              ? {
                ...s,
                fuels: s.fuels.map((f: any) =>
                  f.fuelType === fuelType
                    ? { ...f, status: data.data.fuelStatus, updatedAt: data.data.fuelUpdatedAt }
                    : f
                ),
                fuelStatus: data.data.fuelStatus,
                fuelUpdatedAt: new Date(data.data.fuelUpdatedAt),
              }
              : s
          )
        );
      } else {
        setMessage({ type: "error", text: data.error ?? "เกิดข้อผิดพลาด" });
      }
    } finally {
      setUpdating(null);
    }
  }

  if (!session || loading) return <LoadingSkeleton />;

  const myStations = stations;

  return (
    <main className="min-h-screen bg-[#F8FAF9] text-slate-900 font-sans selection:bg-[#008952]/10 selection:text-[#008952]">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-[#008952]/5 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -left-[10%] w-[30%] h-[30%] bg-emerald-500/5 blur-[100px] rounded-full" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-2xl px-6 py-5 border-b border-[#008952]/5 transition-all duration-300">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white hover:bg-slate-50 text-slate-400 hover:text-[#008952] transition-all border border-slate-100 group shadow-sm"
              id="back-home-dashboard"
            >
              <span className="group-hover:-translate-x-0.5 transition-transform text-xl font-black">←</span>
            </Link>
            <div>
              <h1 className="font-black text-xl tracking-tighter text-slate-900 leading-none">จัดการปั๊ม</h1>
              {/* <p className="text-[10px] font-bold text-[#008952] uppercase tracking-[0.2em] mt-1 opacity-70">ศูนย์รวมเจ้าของปั๊ม</p> */}
            </div>
          </div>
          <div className="relative">
            <button
              id="profile-dropdown-btn"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100 overflow-hidden hover:border-[#008952]/30 transition-all p-0.5"
            >
              {session?.user?.image ? (
                <img src={session.user.image} alt={session.user.name || "User"} className="w-full h-full object-cover rounded-lg" />
              ) : (
                <div className="w-full h-full bg-[#008952]/10 text-[#008952] flex items-center justify-center rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </div>
              )}
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowProfileMenu(false)}
                />
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-3xl shadow-2xl border border-slate-100 z-50 p-6 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-50">
                    <div className="w-12 h-12 rounded-2xl bg-[#008952]/10 flex items-center justify-center text-[#008952] overflow-hidden shrink-0">
                      {session?.user?.image ? (
                        <img src={session.user.image} alt="User" className="w-full h-full object-cover" />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-black text-slate-900 truncate tracking-tight">{session?.user?.name || "ผู้ใช้งาน"}</p>
                      <p className="text-[10px] font-bold text-slate-400 truncate uppercase mt-0.5">{session?.user?.email}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-600 hover:bg-[#F8FAF9] hover:text-[#008952] transition-all font-bold text-sm text-left group"
                      onClick={() => {
                        setShowProfileMenu(false);
                        setShowProfileModal(true);
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-50 group-hover:opacity-100 transition-opacity"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                      ดูโปรไฟล์
                    </button>

                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        setShowSignOutModal(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-500 hover:bg-red-50 transition-all font-bold text-sm text-left group"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                      ออกจากระบบ
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-6 pb-24 pt-6 relative z-10">
        {message && message.type === "error" && (
          <div className="mb-8 px-5 py-4 rounded-3xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500 bg-red-50 text-red-700 border border-red-100">
            <span>⚠️</span>
            {message.text}
          </div>
        )}

        {myStations.length === 0 ? (
          <div className="text-center py-20 bg-white/80 backdrop-blur-md rounded-[3rem] border border-white shadow-2xl shadow-[#008952]/5">
            <h3 className="text-2xl font-black text-slate-900 mb-3 p-4 tracking-tighter">ไม่มีข้อมูล</h3>
            <Link href="/add-station" className="inline-flex items-center gap-3 bg-[#008952] hover:bg-[#007445] text-white font-black px-10 py-4 rounded-2xl transition-all active:scale-95 shadow-xl shadow-[#008952]/30 group">
              <span className="text-lg">+</span>
              <span>เพิ่มปั๊มน้ำมันแรก</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-10">
            {myStations.map((s) => (
              <div key={s.id} className="group animate-in fade-in slide-in-from-bottom-8 duration-700">
                {/* Station Card */}
                <div className="bg-white rounded-[3rem] overflow-hidden shadow-2xl shadow-slate-200/40 border border-[#008952]/5 transition-all duration-500 hover:shadow-3xl hover:shadow-[#008952]/5">
                  <div className="p-8 pb-4">
                    <div className="flex items-center justify-between mb-6">
                      <div className="inline-flex items-center gap-2 bg-[#F8FAF9] text-[#008952] text-[10px] font-black uppercase tracking-[0.15em] px-4 py-1.5 rounded-full border border-[#008952]/10">
                        <span className="w-2 h-2 rounded-full bg-[#008952] animate-pulse shadow-[0_0_8px_rgba(0,137,82,0.4)]" />
                        ออนไลน์อยู่
                      </div>

                      {/* Edit Station Tiny Button */}
                      <Link href={`/edit-station/${s.id}`} className="w-10 h-10 rounded-full bg-[#F8FAF9] border border-[#008952]/10 flex items-center justify-center text-[#008952] hover:bg-[#008952] hover:text-white transition-all transform hover:rotate-12">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </Link>
                    </div>

                    <div className="flex items-start gap-5 mb-8">
                      {/* Brand Logo Display */}
                      <div className="w-16 h-16 rounded-3xl bg-slate-50 p-2.5 shrink-0 flex items-center justify-center shadow-xl shadow-slate-100 border border-white overflow-hidden transform transition-transform group-hover:scale-110">
                        {s.brand && BRAND_LOGOS[s.brand] ? (
                          <img src={BRAND_LOGOS[s.brand]} alt={s.brand} className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-3xl">⛽</span>
                        )}
                      </div>
                      <div>
                        <h2 className="text-3xl font-black text-slate-900 leading-none tracking-tighter mb-3 uppercase">{s.name}</h2>
                        <div className="flex items-center gap-2 text-slate-400 text-xs font-bold bg-[#F8FAF9]/50 py-1.5 px-3 rounded-full border border-slate-50 inline-flex">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-[#008952]"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                          {s.address || "กรุงเทพมหานคร"}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="h-[1px] flex-1 bg-slate-100" />
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] shrink-0">สถานะสต็อกน้ำมัน</span>
                        <div className="h-[1px] flex-1 bg-slate-100" />
                      </div>

                      {/* Fuel Cards List */}
                      <div className="space-y-5">
                        {s.fuels?.map((fuel: any) => (
                          <div key={fuel.id} className="relative transition-all duration-300">
                            <div className="flex items-center justify-between mb-4 px-2">
                              <h4 className="text-base font-black text-slate-800 tracking-tight">
                                {FUEL_TYPE_LABELS[fuel.fuelType] || fuel.fuelType}
                              </h4>
                              {fuel.status === "AVAILABLE" && <span className="text-[9px] font-black text-[#008952] bg-[#008952]/10 px-3 py-1 rounded-full uppercase tracking-widest border border-[#008952]/10">มีจำหน่าย</span>}
                              {fuel.status === "LOW" && <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-widest border border-amber-100">ใกล้หมด</span>}
                              {fuel.status === "EMPTY" && <span className="text-[9px] font-black text-red-600 bg-red-50 px-3 py-1 rounded-full uppercase tracking-widest border border-red-100">หมดแล้ว</span>}
                            </div>

                            {/* Status Segmented Control */}
                            <div className="relative h-14 bg-[#F8FAF9] rounded-[1.25rem] flex items-center p-1.5 border border-slate-100 transition-all overflow-hidden group/bar">

                              {FUEL_OPTIONS.map((opt) => {
                                const isUpdatingThis = updating === `${s.id}-${fuel.fuelType}-${opt.value}`;
                                const isActive = fuel.status === opt.value;

                                return (
                                  <button
                                    key={opt.value}
                                    id={`update-${opt.value.toLowerCase()}-${s.id}-${fuel.fuelType}`}
                                    onClick={() => handleStatusClick(s.id, fuel.fuelType, opt.value)}
                                    disabled={!!updating}
                                    className={`relative z-20 flex-1 h-full rounded-xl text-[10px] font-black transition-all duration-500 flex items-center justify-center gap-2 ${isActive
                                      ? "text-white"
                                      : isUpdatingThis ? "text-slate-300 pointer-events-none" : "text-slate-400 hover:text-slate-600"
                                      }`}
                                  >
                                    <div className="flex items-center justify-center gap-2 relative z-30">
                                      {isUpdatingThis && (
                                        <div className="relative w-4 h-4 shrink-0 flex items-center justify-center">
                                          <div className={`absolute inset-0 border-2 rounded-full opacity-20 ${isActive ? 'border-white' : 'border-[#008952]'}`} />
                                          <div className={`absolute inset-0 border-2 border-t-transparent rounded-full animate-spin ${isActive ? 'border-white' : 'border-[#008952]'}`} />
                                        </div>
                                      )}
                                      {opt.label}
                                    </div>

                                    {/* Active background pill */}
                                    {isActive && (
                                      <div className={`absolute inset-0 z-10 rounded-xl transition-all duration-500 shadow-lg ${opt.value === "AVAILABLE" ? "bg-[#008952] shadow-[#008952]/20" :
                                        opt.value === "LOW" ? "bg-amber-500 shadow-amber-500/20" :
                                          "bg-red-500 shadow-red-500/20"
                                        } ${isUpdatingThis ? "opacity-70 scale-[0.98]" : ""}`} />
                                    )}
                                  </button>
                                );
                              })}
                            </div>

                            {fuel.status === "EMPTY" && fuel.restockEstimate && (
                              <div className="mt-3 px-4 py-3 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-between gap-3 animate-pulse-subtle shadow-sm">
                                <span className="text-[10px] font-black text-amber-600 uppercase tracking-[0.15em] flex items-center gap-1.5">
                                  คาดว่าน้ำมันจะมา:
                                </span>
                                <span className="text-[10px] font-black text-amber-700 bg-white px-3 py-1 rounded-xl border border-amber-200">
                                  {new Date(fuel.restockEstimate).toLocaleDateString("th-TH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })} น.
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* <div className="bg-[#F8FAF9]/50 px-8 py-6 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">อัปเดตสต็อกบ่อยๆ เพื่อความน่าเชื่อถือ</p>
                    <Link href={`/edit-station/${s.id}`} className="text-[11px] font-black text-[#008952] flex items-center gap-2 bg-white px-6 py-3 rounded-2xl shadow-sm border border-[#008952]/10 transition-all hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 uppercase tracking-widest">
                      ✎ จัดการปั๊ม
                    </Link>
                  </div> */}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>


      {restockModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-3xl animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] p-10 w-full max-w-sm shadow-3xl relative animate-in zoom-in-95 slide-in-from-bottom-12 duration-500 border border-white">
            <h3 className="text-3xl font-black text-slate-900 mb-2 leading-none tracking-tighter uppercase">น้ำมันจะมาเมื่อไหร่?</h3>
            <p className="text-slate-400 text-sm font-bold mb-10 leading-relaxed uppercase tracking-tight opacity-70">แจ้งเวลาโดยประมาณที่น้ำมันจะมาเติม</p>

            <form onSubmit={handleRestockSubmit} className="space-y-8">
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-300 uppercase tracking-[0.25em] px-2 leading-none">ระบุเวลาที่คาดว่าน้ำมันจะเข้า</label>
                <input
                  type="datetime-local"
                  value={restockDate}
                  onChange={(e) => setRestockDate(e.target.value)}
                  className="w-full bg-[#F8FAF9] border border-slate-100 text-slate-900 rounded-[1.5rem] px-6 py-5 focus:outline-none focus:ring-4 focus:ring-[#008952]/10 focus:border-[#008952] transition-all font-black text-sm"
                />
              </div>
              <div className="flex flex-col gap-4">
                <button
                  type="submit"
                  className="w-full px-6 py-5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black transition-all active:scale-95 shadow-xl shadow-red-500/20 uppercase tracking-[0.1em]"
                >
                  ยืนยัน
                </button>
                <button
                  type="button"
                  onClick={() => setRestockModal(null)}
                  className="w-full px-6 py-5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-400 font-black transition-all active:scale-95 uppercase tracking-[0.1em]"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSignOutModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-3xl animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-500 border border-slate-100 text-center relative z-20">

            <h3 className="text-2xl font-black text-slate-900 mb-2 leading-none tracking-tighter uppercase">ออกจากระบบ?</h3>
            <p className="text-slate-400 text-sm font-bold leading-relaxed mb-10 tracking-tight opacity-70 uppercase">คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ?</p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full py-5 rounded-[1.5rem] text-sm font-black bg-red-500 text-white shadow-xl shadow-red-500/20 hover:bg-red-600 transition-all active:scale-95 uppercase tracking-[0.1em]"
              >
                ยืนยัน
              </button>
              <button
                onClick={() => setShowSignOutModal(false)}
                className="w-full py-4 rounded-[1.5rem] text-sm font-black text-slate-400 hover:bg-slate-50 transition-all active:scale-95 uppercase tracking-[0.1em]"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {showProfileModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-3xl animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] p-10 max-w-sm w-full shadow-3xl animate-in zoom-in-95 duration-500 border border-white relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute top-0 left-0 w-full h-32 bg-slate-50 border-b border-slate-100 -z-10" />

            <button
              onClick={() => setShowProfileModal(false)}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all hover:rotate-90"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <div className="flex flex-col items-center text-center mt-4">
              <div className="w-24 h-24 rounded-[2.5rem] bg-white p-2 shadow-2xl shadow-slate-200 border border-slate-50 mb-6">
                <div className="w-full h-full rounded-[2rem] bg-[#008952]/10 flex items-center justify-center text-[#008952] overflow-hidden">
                  {session?.user?.image ? (
                    <img src={session.user.image} alt="User" className="w-full h-full object-cover" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  )}
                </div>
              </div>

              <h3 className="text-3xl font-black text-slate-900 mb-1 tracking-tighter uppercase">{session?.user?.name || "ผู้ใช้งาน"}</h3>
              <p className="text-sm font-bold text-[#008952] uppercase tracking-[0.2em] mb-8 opacity-70">
                {(session?.user as any)?.role || "เจ้าของปั๊ม"}
              </p>

              <div className="w-full space-y-4 text-left">
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1.5">อีเมลผู้ใช้งาน</p>
                  <p className="font-bold text-slate-800 break-all">{session?.user?.email}</p>
                </div>

                {/* <div className="bg-emerald-50/30 rounded-2xl p-5 border border-emerald-100/50">
                  <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest mb-1.5">สถานะบัญชี</p>
                  <p className="font-bold text-[#008952] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#008952] animate-pulse" />
                    ยืนยันตัวตนเรียบร้อย
                  </p>
                </div> */}
              </div>

              <button
                onClick={() => setShowProfileModal(false)}
                className="w-full mt-10 py-5 rounded-2xl bg-slate-900 text-white font-black hover:bg-slate-800 transition-all active:scale-95 uppercase tracking-widest shadow-xl shadow-slate-200"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
