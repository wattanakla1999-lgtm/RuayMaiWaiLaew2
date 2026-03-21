"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FUEL_TYPE_LABELS } from "@/lib/constants";

const AddStationMap = dynamic(
  () => import("@/components/AddStationMap").then((m) => m.AddStationMap),
  { ssr: false, loading: () => <div className="w-full h-64 bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 text-sm">กำลังโหลดแผนที่...</div> }
);

interface FuelSelection {
  fuelType: string;
  status: "AVAILABLE" | "LOW" | "EMPTY";
}

const ALL_FUELS = Object.keys(FUEL_TYPE_LABELS);

const PREDEFINED_BRANDS = [
  { id: "PTT", name: "ปตท. (PTT)", logo: "/logos/ptt.png" },
  { id: "PT", name: "พีที (PT)", logo: "/logos/pt.png" },
  { id: "SHELL", name: "เชลล์ (Shell)", logo: "/logos/shell.png" },
  { id: "BANGCHAK", name: "บางจาก (Bangchak)", logo: "/logos/bangchak.png" },
  { id: "ESSO", name: "เอสโซ่ (Esso)", logo: "/logos/esso.png" },
  { id: "CALTEX", name: "คาลเท็กซ์ (Caltex)", logo: "/logos/caltex.png" },
  { id: "SUSCO", name: "ซัสโก้ (Susco)", logo: "/logos/susco.png" },
  { id: "OTHER", name: "ปั๊มส่วนตัว / อื่นๆ", logo: null },
];

export default function AddStationPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);

  const [lat, setLat] = useState(13.7563);
  const [lng, setLng] = useState(100.5018);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  const [brandSelect, setBrandSelect] = useState("PTT");
  const [customBrand, setCustomBrand] = useState("");
  const [imageBase64, setImageBase64] = useState("");

  const [selectedFuels, setSelectedFuels] = useState<FuelSelection[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get User Location on Mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude);
          setLng(pos.coords.longitude);
        },
        () => { },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      );
    }
  }, []);

  const handleLocationChange = useCallback((newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("ขนาดไฟล์รูปต้องไม่เกิน 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImageBase64(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const toggleFuel = (fuelType: string) => {
    const exists = selectedFuels.find((f) => f.fuelType === fuelType);
    if (exists) {
      setSelectedFuels(selectedFuels.filter((f) => f.fuelType !== fuelType));
    } else {
      setSelectedFuels([...selectedFuels, { fuelType, status: "AVAILABLE" }]);
    }
  };

  const updateFuelStatus = (fuelType: string, status: "AVAILABLE" | "LOW" | "EMPTY") => {
    setSelectedFuels(selectedFuels.map(f => f.fuelType === fuelType ? { ...f, status } : f));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step === 1) {
      if (brandSelect === "OTHER" && !customBrand.trim()) {
        setError("กรุณาระบุยี่ห้อหรือชื่อปั๊มส่วนตัวด้วยครับ");
        return;
      }
      setStep(2);
      return;
    }

    setLoading(true);
    setError(null);

    const finalBrand = brandSelect === "OTHER" ? customBrand : brandSelect;
    const finalImage = brandSelect === "OTHER" ? imageBase64 : undefined;

    try {
      const res = await fetch("/api/stations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          lat,
          lng,
          address: address || undefined,
          phone: phone || undefined,
          brand: finalBrand,
          image: finalImage || undefined,
          fuels: selectedFuels.length > 0 ? selectedFuels : undefined
        }),
      });

      if (!res.ok) {
        throw new Error("เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองใหม่อีกครั้ง");
      }

      // นำทางกลับไปหน้าแรกเมื่อสำเร็จ
      router.push("/");
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการส่งข้อมูล");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 pb-12 font-sans">
      <div className="max-w-lg mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <button
            type="button"
            onClick={() => step === 2 ? setStep(1) : router.push("/")}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white hover:bg-slate-50 text-slate-400 hover:text-amber-600 transition-all border border-gray-200 shadow-sm group"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform text-xl font-black">←</span>
          </button>

          <div className="flex gap-2 items-center bg-gray-200/50 p-1.5 rounded-full px-3">
            <div className={`h-2 w-8 rounded-full transition-all duration-500 ${step >= 1 ? "bg-amber-500 shadow-sm shadow-amber-500/20" : "bg-gray-300"}`} />
            <div className={`h-2 w-8 rounded-full transition-all duration-500 ${step >= 2 ? "bg-amber-500 shadow-sm shadow-amber-500/20" : "bg-gray-300"}`} />
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">
            {step === 1 ? "เพิ่มปั๊มน้ำมันใหม่" : "ระบุชนิดน้ำมัน"}
          </h1>
          <p className="text-gray-500 text-sm font-medium leading-relaxed">
            {step === 1
              ? "ปั๊มจะต้องผ่านการอนุมัติจาก Admin ก่อนแสดงในแผนที่"
              : "เลือกน้ำมันที่มีจำหน่ายในปั๊มนี้ เพื่อเป็นข้อมูลเบื้องต้น"}
          </p>
        </div>

        {step === 1 && (
          <div className="flex items-start gap-4 bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8 shadow-sm">
            <span className="text-2xl">⏳</span>
            <div>
              <p className="text-amber-800 font-black text-sm uppercase tracking-widest">รอการตรวจสอบ</p>
              <p className="text-amber-700/80 text-xs mt-1 font-medium">ทีมงานจะตรวจสอบข้อมูลและอนุมัติภายใน 24 ชั่วโมง</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className={step === 1 ? "block" : "hidden"}>
            <div className="space-y-6">

              {/* Brand Selection */}
              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                <label className="block text-sm font-black text-gray-700 mb-4 uppercase tracking-widest">
                  ⛽ ยี่ห้อปั๊มน้ำมัน *
                </label>
                <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-4 mb-6">
                  {PREDEFINED_BRANDS.map(b => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setBrandSelect(b.id);
                        setError(null);
                      }}
                      className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border transition-all overflow-hidden ${brandSelect === b.id
                        ? "bg-amber-50 border-amber-500 text-amber-700 shadow-md ring-1 ring-amber-500 scale-[1.05]"
                        : "bg-gray-50 border-gray-100 text-gray-400 hover:border-amber-200 hover:bg-white"
                        }`}
                    >
                      {b.id === "OTHER" ? (
                        <div className="w-12 h-12 mb-2 rounded-full bg-white flex items-center justify-center text-xl shadow-sm border border-gray-100">
                          🏪
                        </div>
                      ) : (
                        <div className="w-12 h-12 mb-2 rounded-full bg-white flex items-center justify-center p-1.5 shadow-sm border border-gray-100 shrink-0">
                          <img
                            src={b.logo!}
                            alt={b.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${b.id}&background=fff&color=333&rounded=true&bold=true`;
                            }}
                          />
                        </div>
                      )}
                      <span className="text-[10px] font-black text-center leading-tight mt-1 uppercase tracking-tighter">{b.name}</span>
                    </button>
                  ))}
                </div>

                {brandSelect === "OTHER" && (
                  <div className="p-5 bg-gray-50 border border-amber-200 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div>
                      <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-widest" htmlFor="custom-brand">
                        ระบุชื่อยี่ห้อ / ชื่อปั๊มส่วนตัว *
                      </label>
                      <input
                        id="custom-brand"
                        type="text"
                        value={customBrand}
                        onChange={(e) => setCustomBrand(e.target.value)}
                        placeholder="เช่น ปั๊มลุงทศพร, ปั๊มชุมชนรักษ์ไทย"
                        className="w-full bg-white border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-widest">
                        อัปโหลดโลโก้ / รูปร้าน (ถ้ามี)
                      </label>
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-white hover:bg-gray-50 text-gray-700 text-xs px-4 py-2.5 rounded-xl font-black border border-gray-200 transition-all shadow-sm active:scale-95"
                        >
                          📸 เลือกรูปภาพ...
                        </button>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          ref={fileInputRef}
                          onChange={handleImageUpload}
                        />
                        {imageBase64 && (
                          <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-amber-500 shadow-md shrink-0">
                            <img src={imageBase64} alt="Preview" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Basic Info */}
              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-widest" htmlFor="station-name">
                    ชื่อสาขา / ชื่อจุดสังเกต *
                  </label>
                  <input
                    id="station-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={step === 1}
                    minLength={2}
                    placeholder="เช่น สาขาลาดพร้าว 71"
                    className="w-full bg-gray-50 border border-gray-100 text-gray-900 placeholder-gray-400 rounded-xl px-4 py-3.5 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-widest">
                    📍 เลือกตำแหน่งบนแผนที่ *
                  </label>
                  <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-inner">
                    <AddStationMap lat={lat} lng={lng} onChange={handleLocationChange} />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 font-black font-mono text-right tracking-tighter">
                    พิกัด: {lat.toFixed(5)}, {lng.toFixed(5)}
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-widest" htmlFor="station-address">
                    ที่อยู่ <span className="text-gray-300">(ถ้ามี)</span>
                  </label>
                  <input
                    id="station-address"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="เช่น 123 ถ.ลาดพร้าว แขวงจอมพล"
                    className="w-full bg-gray-50 border border-gray-100 text-gray-900 placeholder-gray-400 rounded-xl px-4 py-3.5 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-widest" htmlFor="station-phone">
                    เบอร์โทรศัพท์ <span className="text-gray-300">(ถ้ามี)</span>
                  </label>
                  <input
                    id="station-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="เช่น 02-123-4567"
                    className="w-full bg-gray-50 border border-gray-100 text-gray-900 placeholder-gray-400 rounded-xl px-4 py-3.5 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={step === 2 ? "block" : "hidden"}>
            <div className="bg-white rounded-3xl border border-gray-200 p-3 shadow-sm">
              <div className="max-h-[55vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                <div className="grid grid-cols-1 gap-3">
                  {ALL_FUELS.map((fuel) => {
                    const sel = selectedFuels.find(f => f.fuelType === fuel);
                    const isSelected = !!sel;

                    return (
                      <div
                        key={fuel}
                        className={`flex flex-col p-5 rounded-2xl border transition-all duration-300 ${isSelected ? "bg-amber-50 border-amber-300 shadow-sm" : "bg-gray-50 border-gray-100 hover:border-amber-200"
                          }`}
                      >
                        <div
                          className="flex items-center gap-4 cursor-pointer mb-4"
                          onClick={() => toggleFuel(fuel)}
                        >
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all shrink-0 ${isSelected ? "bg-amber-500 border-amber-600 text-black shadow-sm" : "bg-white border-gray-200"
                            }`}>
                            {isSelected && <span className="text-sm font-black">✓</span>}
                          </div>
                          <span className={`font-black text-base tracking-tight ${isSelected ? "text-amber-800" : "text-gray-500"}`}>
                            {FUEL_TYPE_LABELS[fuel as keyof typeof FUEL_TYPE_LABELS]}
                          </span>
                        </div>

                        {isSelected && (
                          <div className="flex items-center gap-1.5 p-1.5 bg-white/50 backdrop-blur-sm rounded-xl border border-amber-200/50">
                            {(["AVAILABLE", "LOW", "EMPTY"] as const).map(s => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => updateFuelStatus(fuel, s)}
                                className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${sel?.status === s
                                  ? (s === "AVAILABLE" ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" : s === "LOW" ? "bg-amber-500 text-black shadow-md shadow-amber-500/20" : "bg-red-500 text-white shadow-md shadow-red-500/20")
                                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                                  }`}
                              >
                                {s === "AVAILABLE" ? "มีน้ำมัน" : s === "LOW" ? "ใกล้หมด" : "หมดแล้ว"}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            {selectedFuels.length === 0 && (
              <p className="text-amber-600 font-bold text-xs text-center mt-4">
                * หากไม่เลือกน้ำมันเลย จะถือว่าไม่มีข้อมูลเบื้องต้นแสดง
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-black px-5 py-4 rounded-2xl animate-shake shadow-sm flex items-center gap-3">
              <span className="text-xl">⚠️</span> {error}
            </div>
          )}

          <div className="pt-4">
            <button
              id="add-station-submit"
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-br from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-black font-black py-4 rounded-2xl transition-all disabled:opacity-50 active:scale-95 text-lg shadow-xl shadow-amber-500/30 border border-amber-400/50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  กำลังส่งข้อมูล...
                </span>
              ) : step === 1 ? (
                "ขั้นตอนถัดไป →"
              ) : (
                "✅ ยืนยันส่งข้อมูลปั๊ม"
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}