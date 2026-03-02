import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient.js'; 

export default function UserDashboard({ user, onLogout }) {
  const [balanceUSD, setBalanceUSD] = useState(0); 
  const [exchangeRate, setExchangeRate] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // 1. Fetch Wallet Balance
        const { data: walletData, error: walletError } = await supabase
          .from('wallets')
          .select('id, balance')
          .eq('profile_id', user.id)
          .single();

        if (walletError) throw walletError;
        setBalanceUSD(walletData ? Number(walletData.balance) : 0);

        // 2. Fetch the live exchange rate (USD to KES)
        const rateResponse = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const rateData = await rateResponse.json();
        if (rateData?.rates?.KES) {
          setExchangeRate(rateData.rates.KES);
        }

        // 3. Fetch Recent Transactions (This is where the Reward shows up!)
        if (walletData) {
          const { data: txData, error: txError } = await supabase
            .from('transactions')
            .select('*')
            .eq('wallet_id', walletData.id)
            .order('created_at', { ascending: false })
            .limit(5);
            
          if (!txError && txData) {
            setTransactions(txData);
          }
        }

      } catch (err) {
        console.error("Error fetching dashboard data:", err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) fetchDashboardData();
  }, [user]);

  const balanceKES = exchangeRate ? (balanceUSD * exchangeRate).toFixed(2) : '...';

  return (
    <div className="min-h-screen bg-slate-950 p-4 pb-24 font-sans selection:bg-blue-500/30">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 pt-2">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Hi, {user?.full_name?.split(' ')[0] || 'User'} 👋</h2>
          <p className="text-slate-500 text-sm font-medium">{user?.phone_number}</p>
        </div>
        <button onClick={onLogout} className="bg-slate-900 border border-slate-800 p-2 rounded-xl text-slate-400 hover:text-white transition shadow-sm text-sm">
          Log Out
        </button>
      </div>

      {/* DYNAMIC GLOBAL BALANCE CARD */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-800 rounded-3xl p-6 shadow-2xl shadow-blue-900/20 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
        <p className="text-blue-100 text-sm font-medium mb-1">Total Balance</p>
        
        <h1 className="text-4xl font-black text-white tracking-tight flex items-baseline gap-2">
          {loading ? '...' : `$${balanceUSD.toFixed(2)}`}
          <span className="text-lg font-medium text-blue-200">USD</span>
        </h1>
        
        <div className="mt-4 flex items-center justify-between bg-black/20 rounded-xl p-3 border border-blue-400/20">
          <div>
            <p className="text-blue-200 text-xs uppercase tracking-wider font-semibold">Live KES Value</p>
            <p className="text-white font-medium">KES {balanceKES}</p>
          </div>
        </div>
      </div>

      {/* PRIMARY ACTIONS - Mapped exactly to your business rules */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        
        {/* DEPOSIT ACTION */}
        <button className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-emerald-500/50 hover:bg-slate-800 transition group shadow-lg">
          <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center group-hover:bg-emerald-500/30 transition">
            <span className="text-emerald-400 text-lg font-black">+</span>
          </div>
          <span className="text-slate-200 font-bold text-[11px] uppercase tracking-wider">Deposit</span>
          <span className="text-slate-500 text-[9px] text-center leading-tight">Agent or<br/>M-Pesa</span>
        </button>

        {/* SEND MONEY ACTION (P2P Closed Loop) */}
        <button className="bg-[#2a68ff]/10 border border-[#2a68ff]/30 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-[#2a68ff]/20 transition group shadow-lg">
          <div className="w-10 h-10 bg-[#2a68ff]/20 rounded-full flex items-center justify-center transition">
            <span className="text-[#2a68ff] text-lg font-black">⇄</span>
          </div>
          <span className="text-[#2a68ff] font-bold text-[11px] uppercase tracking-wider">Send</span>
          <span className="text-[#2a68ff]/70 text-[9px] text-center leading-tight">FinanceOS<br/>Free Transfer</span>
        </button>

        {/* WITHDRAW ACTION */}
        <button className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-orange-500/50 hover:bg-slate-800 transition group shadow-lg">
          <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center group-hover:bg-orange-500/30 transition">
            <span className="text-orange-400 text-lg font-black">−</span>
          </div>
          <span className="text-slate-200 font-bold text-[11px] uppercase tracking-wider">Withdraw</span>
          <span className="text-slate-500 text-[9px] text-center leading-tight">Agent (Free)<br/>M-Pesa (Fee)</span>
        </button>

      </div>

      {/* RECENT ACTIVITY & REWARDS */}
      <div>
        <h3 className="text-slate-300 font-bold text-sm mb-3 px-1 uppercase tracking-wider">Recent Activity</h3>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 overflow-hidden shadow-lg">
          
          {loading ? (
            <p className="text-slate-500 text-sm text-center py-4">Loading ledger...</p>
          ) : transactions.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-4">No transactions yet.</p>
          ) : (
            transactions.map((tx) => (
              <div key={tx.id} className="flex justify-between items-center p-3 border-b border-slate-800/50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                    ${tx.type === 'BONUS' ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-800 text-slate-400'}`}>
                    {tx.type === 'BONUS' ? '🎁' : 'tx'}
                  </div>
                  <div>
                    <p className="text-slate-200 text-sm font-semibold">
                      {tx.type === 'BONUS' ? 'Early Adopter Reward' : tx.type}
                    </p>
                    <p className="text-slate-500 text-xs">{new Date(tx.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${tx.type === 'BONUS' ? 'text-purple-400' : 'text-slate-200'}`}>
                    +${Number(tx.amount).toFixed(2)}
                  </p>
                </div>
              </div>
            ))
          )}

        </div>
      </div>

    </div>
  );
}