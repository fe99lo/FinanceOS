import React from 'react';

export default function MpesaComingSoonCard() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#151c2c] to-[#0b1121] border border-emerald-500/30 p-6 md:p-8 rounded-2xl shadow-2xl mb-8 group">
      {/* Background ambient glow effect */}
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl transition-all duration-700 group-hover:bg-emerald-500/10"></div>
      
      {/* Abstract geometric lines for the "tech" feel */}
      <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
        <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path d="M100 0 L200 100 L100 200 L0 100 Z" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="10 10"/>
        </svg>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-start justify-between gap-6">
        <div className="flex-1">
          {/* Active Status Indicator */}
          <div className="flex items-center gap-3 mb-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <h3 className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">Phase 2 Infrastructure</h3>
          </div>
          
          <h2 className="text-2xl md:text-3xl font-black text-white mb-3">Direct M-Pesa Integration</h2>
          
          <p className="text-slate-400 text-sm leading-relaxed max-w-2xl font-medium">
            We are currently running strict cryptographic audits on our Safaricom Daraja bridge. 
            Frictionless M-Pesa deposits and instant B2C withdrawals directly to your Safaricom line will be available shortly. 
            Your digital vault is about to connect to the physical economy.
          </p>
          
          <div className="mt-6 flex flex-wrap gap-3">
            <div className="bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-lg text-[10px] uppercase font-black tracking-widest border border-emerald-500/20">
              Status: Final Audits
            </div>
            <div className="bg-slate-800/50 text-slate-300 px-3 py-1.5 rounded-lg text-[10px] uppercase font-black tracking-widest border border-slate-700/50">
              ETA: Coming Soon
            </div>
          </div>
        </div>
        
        {/* Visual Icon Box */}
        <div className="hidden md:flex flex-col items-center justify-center w-24 h-24 rounded-2xl bg-[#0b1121] border border-emerald-500/20 shadow-inner">
          <span className="text-4xl mb-1">📱</span>
          <span className="text-[8px] text-emerald-500 font-black uppercase tracking-widest">KES ⇌ USD</span>
        </div>
      </div>
    </div>
  );
}