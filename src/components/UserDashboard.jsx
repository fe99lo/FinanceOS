import React, { useState, useEffect } from 'react';
// Import your secure Supabase connection
import { supabase } from '../supabaseClient.js'; 

export default function UserDashboard({ user, onLogout }) {
  const [balance, setBalance] = useState(0); 
  const [loading, setLoading] = useState(true);

  // This runs automatically when the dashboard loads
  useEffect(() => {
    fetchWalletBalance();
  }, []);

  const fetchWalletBalance = async () => {
    try {
      // Look inside the wallets table for this specific user's balance
      const { data, error } = await supabase
        .from('wallets')
        .select('balance')
        .eq('profile_id', user.id)
        .single();

      if (error) throw error;
      
      if (data) {
        setBalance(data.balance);
      }
    } catch (err) {
      console.error("Error fetching vault balance:", err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 pb-24 font-sans selection:bg-blue-500/30">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 pt-2">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Hi, {user.full_name?.split(' ')[0] || 'User'} 👋</h2>
          <p className="text-slate-500 text-sm font-medium">{user.phone_number}</p>
        </div>
        <button onClick={onLogout} className="bg-slate-900 border border-slate-800 p-2 rounded-xl text-slate-400 hover:text-white transition shadow-sm">
          Log Out
        </button>
      </div>

      {/* BALANCE CARD (Now connected to Supabase!) */}
      <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-3xl p-6 shadow-2xl shadow-emerald-900/20 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
        <p className="text-emerald-100 text-sm font-medium mb-1">Available Balance</p>
        
        <h1 className="text-4xl font-black text-white tracking-tight">
          {loading ? '...' : `$${balance.toFixed(2)}`}
        </h1>
        
        <p className="text-emerald-200 text-xs mt-4 bg-black/20 inline-block px-3 py-1 rounded-full border border-emerald-400/30">
          Digital USD Vault
        </p>
      </div>

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <button className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex flex-col items-center justify-center gap-3 hover:border-blue-500/50 hover:bg-slate-800 transition group shadow-lg">
          <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center group-hover:bg-blue-500/30 transition">
            <span className="text-blue-400 text-xl font-black">↑</span>
          </div>
          <span className="text-slate-300 font-bold text-sm">Send Money</span>
        </button>

        <button className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex flex-col items-center justify-center gap-3 hover:border-emerald-500/50 hover:bg-slate-800 transition group shadow-lg">
          <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center group-hover:bg-emerald-500/30 transition">
            <span className="text-emerald-400 text-xl font-black">↓</span>
          </div>
          <span className="text-slate-300 font-bold text-sm">Withdraw</span>
        </button>
      </div>

    </div>
  );
}