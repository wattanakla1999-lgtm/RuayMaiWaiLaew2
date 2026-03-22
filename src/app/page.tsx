import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";

// บังคับให้หน้านี้เป็น Dynamic ไม่ต้อง Cache เพื่อให้ข้อมูลอัปเดตเสมอ
export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const supabase = supabaseAdmin();
  const [
    { count: totalStations },
    { count: updatesToday },
    { count: totalUsers }
  ] = await Promise.all([
    supabase.from('Station').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
    supabase.from('FuelStatusLog').select('*', { count: 'exact', head: true }).gte('createdAt', startOfToday.toISOString()),
    supabase.from('User').select('*', { count: 'exact', head: true }),
  ]);

  return (
    <main className="min-h-screen bg-white flex flex-col items-center py-12 px-5 font-sans relative">
      <div className="w-full max-w-md space-y-5">

        {/* Hero Section */}
        {/* <section className="bg-[#F4F5F6] rounded-[3rem] p-10 text-center space-y-6 shadow-sm border border-gray-100 flex flex-col items-center">
          <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-2xl shadow-[#008952]/20 border-4 border-white transform hover:scale-105 transition-transform duration-500">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-[#F1E9D2] px-4 py-2 rounded-full text-[10px] font-black tracking-widest text-[#9C7C3E] shadow-sm uppercase">
              สถานการณ์น้ำมันขาดแคลน
            </div>
            <h1 className="text-4xl font-black text-[#1A1C1E] tracking-tight pt-2 leading-tight">
              รวยไม่ไหวแล้ว
            </h1>
            <p className="text-[#5E6266] text-sm font-medium leading-relaxed px-4 opacity-80">
              ข้อมูลน้ำมันแบบเรียลไทม์สำหรับนักเดินทางสมัยใหม่
            </p>
          </div>
        </section> */}

        {/* Find Fuel Card */}
        <section className="bg-white rounded-[2rem] p-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-8 right-8 text-[#D1D5D8]">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <circle cx="12" cy="12" r="3"></circle>
              <line x1="12" y1="2" x2="12" y2="4"></line>
              <line x1="12" y1="20" x2="12" y2="22"></line>
              <line x1="2" y1="12" x2="4" y2="12"></line>
              <line x1="20" y1="12" x2="22" y2="12"></line>
            </svg>
          </div>
          <h2 className="text-2xl font-black text-[#1A1C1E] mb-2 tracking-tight">ค้นหาน้ำมัน</h2>
          <p className="text-[#5E6266] text-[15px] font-medium leading-relaxed mb-8 pr-12">
            ค้นหาปั๊มน้ำมันใกล้เคียง
          </p>
          <Link
            href="/map"
            className="flex items-center justify-center gap-2 bg-[#008952] hover:bg-[#007445] text-white font-black py-4 rounded-full transition-all active:scale-[0.98] shadow-lg shadow-[#008952]/20 group"
          >
            <span>ค้นหาใกล้ฉัน</span>
            <span className="text-lg group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </section>

        {/* Owner Hub Card */}
        <section className="bg-[#E4E6E7] rounded-[2rem] p-8">
          <h2 className="text-2xl font-black text-[#1A1C1E] mb-2 tracking-tight">สำหรับเจ้าของปั๊ม</h2>
          <p className="text-[#5E6266] text-[15px] font-medium leading-relaxed mb-8 pr-4">
            จัดการสถานะปั๊มและอัปเดตสต็อกน้ำมันได้ทันทีแบบเรียลไทม์
          </p>
          <Link
            href="/auth"
            className="flex items-center justify-center gap-2 bg-white text-[#008952] font-black py-4 rounded-full transition-all active:scale-[0.98] shadow-sm hover:bg-[#F8F9FA] group border border-transparent hover:border-[#008952]/10"
          >
            <span>เข้าสู่ระบบเจ้าของปั๊ม</span>
            <span className="text-lg group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </section>

        {/* Network Insights */}
        <section className="pt-2 space-y-4">
          <h3 className="text-[11px] font-black text-[#8E9598] tracking-[0.05em] px-2 text-left">
            ข้อมูลสรุปในระบบ
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {/* Active Stations */}
            <div className="bg-[#F0F2F3] rounded-[1.5rem] p-5 text-left flex flex-col justify-center">
              <p className="text-[32px] font-black text-[#1A513E] mb-2 leading-none">{(totalStations ?? 0) > 0 ? `${totalStations}+` : "0"}</p>
              <p className="text-[10px] font-black text-[#5E6266] opacity-80 leading-[1.2] tracking-wide">ปั๊มที่<br />เปิดอยู่</p>
            </div>
            {/* Updates Today */}
            <div className="bg-[#008952] rounded-[1.5rem] p-5 text-left text-white shadow-lg shadow-[#008952]/20 flex flex-col justify-center">
              <p className="text-[32px] font-black mb-2 leading-none">{updatesToday}</p>
              <p className="text-[10px] font-black opacity-90 leading-[1.2] tracking-wide">อัปเดต<br />วันนี้</p>
            </div>
            {/* Active Users */}
            <div className="bg-[#F0F2F3] rounded-[1.5rem] p-5 text-left flex flex-col justify-center">
              <p className="text-[32px] font-black text-[#1A513E] mb-2 leading-none">{(totalUsers ?? 0) > 0 ? `${totalUsers}+` : "0"}</p>
              <p className="text-[10px] font-black text-[#5E6266] opacity-80 leading-[1.2] tracking-wide">ผู้ใช้งาน<br />ในระบบ</p>
            </div>
          </div>
        </section>

      </div>
      {/* Footer */}
      <footer className="relative text-center py-6 text-gray-400 text-xs font-medium">
        ข้อมูลอัปเดต · รายงานสถานะได้ทันที
      </footer>
    </main>
  );
}
