"use client";

export function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAF9] text-slate-900 font-sans p-6 overflow-hidden">
      {/* Skeleton Header */}
      <div className="max-w-md mx-auto flex items-center justify-between mb-12">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-200 animate-pulse" />
          <div className="space-y-2">
            <div className="w-24 h-5 bg-slate-200 rounded-full animate-pulse" />
            <div className="w-16 h-3 bg-slate-100 rounded-full animate-pulse" />
          </div>
        </div>
        <div className="w-10 h-10 bg-slate-200 rounded-xl animate-pulse" />
      </div>

      {/* Skeleton Card */}
      <div className="max-w-md mx-auto space-y-10">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-[3rem] p-8 shadow-sm border border-slate-100 overflow-hidden relative">
            <div className="flex items-center justify-between mb-8">
              <div className="w-28 h-6 bg-slate-100 rounded-full animate-pulse" />
              <div className="w-10 h-10 bg-slate-50 rounded-full" />
            </div>

            <div className="flex items-start gap-5 mb-10">
              <div className="w-16 h-16 bg-slate-100 rounded-3xl animate-pulse" />
              <div className="space-y-3 pt-2">
                <div className="w-40 h-8 bg-slate-200 rounded-lg animate-pulse" />
                <div className="w-32 h-5 bg-slate-100 rounded-full animate-pulse" />
              </div>
            </div>

            <div className="space-y-6">
              {[1, 2].map((j) => (
                <div key={j} className="bg-[#F8FAF9] rounded-[1.25rem] p-1.5 border border-slate-50 h-14 relative overflow-hidden">
                  <div className="absolute inset-x-1.5 inset-y-1.5 w-1/3 bg-slate-200/50 rounded-xl animate-skeleton" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
