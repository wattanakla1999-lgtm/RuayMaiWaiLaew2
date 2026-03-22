"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }
    if (password.length < 8) {
      setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (res.ok) {
        // Redirect to login page with success message
        router.push("/auth?success=registered");
      } else {
        setError(data.error || "เกิดข้อผิดพลาดในการสมัครสมาชิก");
      }
    } catch {
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setLoading(false);
    }
  }


  return (
    <main className="min-h-screen bg-slate-50/50 flex items-center justify-center px-6 py-12 selection:bg-emerald-100 selection:text-emerald-900">
      <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-8 duration-700">
        <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-emerald-600 text-xs font-bold mb-10 transition-all hover:-translate-x-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          กลับหน้าหลัก
        </Link>

        <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-slate-200/50 border border-slate-100/50">
          <div className="text-center mb-10">

            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-3">สมัครใช้งาน</h1>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">เริ่มลงทะเบียนปั๊มใหม่</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 px-1">
                ชื่อ-นามสกุล / ชื่อปั๊ม
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="ชื่อ-นามสกุล / ชื่อปั๊ม"
                className="w-full bg-slate-50 border border-slate-100 text-slate-900 placeholder-slate-300 rounded-[1.5rem] px-6 py-4 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 px-1">
                อีเมลผู้ใช้งาน
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="อีเมลผู้ใช้งาน"
                className="w-full bg-slate-50 border border-slate-100 text-slate-900 placeholder-slate-300 rounded-[1.5rem] px-6 py-4 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold"
              />
            </div>

            <div className="relative">
              <label className="block text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 px-1">
                รหัสผ่าน <span className="text-[8px] opacity-50 lowercase tracking-normal">(8+ ตัวอักษร)</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-100 text-slate-900 placeholder-slate-300 rounded-[1.5rem] px-6 py-4 pr-14 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-300 hover:text-emerald-500 transition-colors"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  )}
                </button>
              </div>
            </div>

            <div className="relative">
              <label className="block text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 px-1">
                ยืนยันรหัสผ่าน
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-100 text-slate-900 placeholder-slate-300 rounded-[1.5rem] px-6 py-4 pr-14 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-300 hover:text-emerald-500 transition-colors"
                >
                  {showConfirmPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-bold px-5 py-4 rounded-2xl animate-in shake-1">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-5 rounded-[1.5rem] transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-lg shadow-emerald-100"
            >
              {loading ? "กำลังสมัคร..." : "สร้างบัญชีใหม่"}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            มีบัญชีอยู่แล้ว?{" "}
            <Link href="/auth" className="text-emerald-400 hover:text-emerald-300 font-semibold hover:underline transition-colors">
              เข้าสู่ระบบ
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
