import React from 'react';

export default function MpesaComingSoonCard() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-[#151c2c] to-[#0b1121] border border-emerald-500/30 p-3.5 rounded-2xl shadow-lg mb-6 flex items-center justify-between gap-3 group cursor-default">
      
      {/* Subtle background glow */}
      <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl pointer-events-none transition-all duration-700 group-hover:bg-emerald-500/20"></div>

      <div className="flex items-center gap-3 relative z-10">
        {/* Radar Icon */}
        <div className="w-10 h-10 rounded-full bg-[#0b1121] border border-emerald-500/20 shadow-inner flex items-center justify-center shrink-0">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
        </div>

        {/* Text Content */}
        <div>
          <h3 className="text-white text-[13px] font-bold tracking-tight">
            Direct M-Pesa Bridge
          </h3>
          <p className="text-slate-400 text-[11px] leading-tight mt-0.5">
            Undergoing final security audits.
          </p>
        </div>
      </div>

      {/* Tiny Status Badge */}
      <div className="relative z-10 shrink-0 pr-1">
        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest shadow-sm">
          Phase 2
        </span>
      </div>
      
    </div>
  );
}