import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient.js'; 

export default function UserDashboard({ user, onLogout }) {
  // Core Financial State
  const [balanceUSD, setBalanceUSD] = useState(0); 
  const [exchangeRate, setExchangeRate] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Navigation / Modal Engine State
  const [activeView, setActiveView] = useState('DASHBOARD'); // DASHBOARD, DEPOSIT, SEND, WITHDRAW
  const [txAmount, setTxAmount] = useState('');
  const [txRecipient, setTxRecipient] = useState('');
  const [txMethod, setTxMethod] = useState('AGENT'); // For Withdrawals: 'AGENT' or 'MPESA'
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState('');

  // 1. Fetch Core Data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: walletData, error: walletError } = await supabase
          .from('wallets')
          .select('id, balance')
          .eq('profile_id', user.id)
          .single();

        if (walletError) throw walletError;
        setBalanceUSD(walletData ? Number(walletData.balance) : 0);

        const rateResponse = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const rateData = await rateResponse.json();
        if (rateData?.rates?.KES) setExchangeRate(rateData.rates.KES);

        if (walletData) {
          const { data: txData, error: txError } = await supabase
            .from('transactions')
            .select('*')
            .eq('wallet_id', walletData.id)
            .order('created_at', { ascending: false })
            .limit(5);
            
          if (!txError && txData) setTransactions(txData);
        }
      } catch (err) {
        console.error("Data error:", err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) fetchDashboardData();
  }, [user]);

  // 2. Transaction Handlers
  const handleMpesaDeposit = async (e) => {
    e.preventDefault();
    setTxLoading(true); setTxError('');
    try {
      console.log(`Initiating M-Pesa STK push for ${txAmount} KES`);
      setTimeout(() => {
        setTxLoading(false); setActiveView('DASHBOARD');
      }, 1500);
    } catch (err) {
      setTxError(err.message); setTxLoading(false);
    }
  };

  const handleP2PSend = async (e) => {
    e.preventDefault();
    setTxLoading(true); setTxError('');
    try {
      console.log(`Sending $${txAmount} to ${txRecipient}`);
      setTimeout(() => {
        setTxLoading(false); setActiveView('DASHBOARD');
      }, 1500);
    } catch (err) {
      setTxError(err.message); setTxLoading(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setTxLoading(true); setTxError('');
    try {
      if (Number(txAmount) > balanceUSD) {
        throw new Error("Insufficient funds for this withdrawal.");
      }
      console.log(`Initiating ${txMethod} withdrawal for $${txAmount}`);
      // TODO: Call Supabase Edge Function to lock funds and alert Agent/M-Pesa
      setTimeout(() => {
        setTxLoading(false); setActiveView('DASHBOARD');
      }, 1500);
    } catch (err) {
      setTxError(err.message); setTxLoading(false);
    }
  };

  const balanceKES = exchangeRate ? (balanceUSD * exchangeRate).toFixed(2) : '...';

  // ==========================================
  // VIEW RENDERERS (Memory Efficient UIs)
  // ==========================================

  if (activeView === 'DEPOSIT') {
    return (
      <div className="min-h-screen bg-slate-950 p-4 font-sans flex flex-col items-center pt-8">
        <div className="w-full max-w-md bg-[#151c2c] rounded-2xl p-6 border border-slate-800 shadow-2xl">
          <button onClick={() => { setActiveView('DASHBOARD'); setTxAmount(''); setTxError(''); }} className="text-slate-400 text-sm mb-6 flex items-center gap-2 hover:text-white transition">
            ← Back to Dashboard
          </button>
          <h2 className="text-2xl font-bold text-white mb-2">Deposit Funds</h2>
          <p className="text-slate-400 text-sm mb-6">Add KES via M-Pesa to your global USD vault.</p>
          
          {txError && <div className="bg-red-500/10 text-red-400 p-3 rounded-lg mb-4 text-sm">{txError}</div>}

          <form onSubmit={handleMpesaDeposit} className="space-y-4">
            <div>
              <label className="text-slate-400 text-xs uppercase tracking-wider mb-2 block">Amount (KES)</label>
              <input type="number" required min="10" value={txAmount} onChange={(e) => setTxAmount(e.target.value)}
                className="w-full bg-[#1b2438] text-white border border-slate-700/50 rounded-lg px-4 py-3 focus:outline-none focus:border-emerald-500" 
                placeholder="e.g. 1000" />
            </div>
            <button type="submit" disabled={txLoading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg py-3.5 transition">
              {txLoading ? 'Connecting to Safaricom...' : 'Trigger M-Pesa Express'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (activeView === 'SEND') {
    return (
      <div className="min-h-screen bg-slate-950 p-4 font-sans flex flex-col items-center pt-8">
        <div className="w-full max-w-md bg-[#151c2c] rounded-2xl p-6 border border-slate-800 shadow-2xl">
          <button onClick={() => { setActiveView('DASHBOARD'); setTxAmount(''); setTxRecipient(''); setTxError(''); }} className="text-slate-400 text-sm mb-6 flex items-center gap-2 hover:text-white transition">
            ← Back to Dashboard
          </button>
          <h2 className="text-2xl font-bold text-white mb-2">Send Money</h2>
          <p className="text-slate-400 text-sm mb-6">Instantly send USD to any FinanceOS user globally.</p>
          
          {txError && <div className="bg-red-500/10 text-red-400 p-3 rounded-lg mb-4 text-sm">{txError}</div>}

          <form onSubmit={handleP2PSend} className="space-y-4">
            <div>
              <label className="text-slate-400 text-xs uppercase tracking-wider mb-2 block">Recipient Phone</label>
              <input type="tel" required value={txRecipient} onChange={(e) => setTxRecipient(e.target.value)}
                className="w-full bg-[#1b2438] text-white border border-slate-700/50 rounded-lg px-4 py-3 focus:outline-none focus:border-[#2a68ff]" 
                placeholder="e.g. 0712345678" />
            </div>
            <div>
              <label className="text-slate-400 text-xs uppercase tracking-wider mb-2 block">Amount (USD)</label>
              <input type="number" step="0.01" required max={balanceUSD} value={txAmount} onChange={(e) => setTxAmount(e.target.value)}
                className="w-full bg-[#1b2438] text-white border border-slate-700/50 rounded-lg px-4 py-3 focus:outline-none focus:border-[#2a68ff]" 
                placeholder="0.00" />
            </div>
            <button type="submit" disabled={txLoading} className="w-full bg-[#2a68ff] hover:bg-blue-600 text-white font-bold rounded-lg py-3.5 transition mt-2">
              {txLoading ? 'Processing...' : 'Send Securely'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // === THE MISSING WITHDRAWAL VIEW ===
  if (activeView === 'WITHDRAW') {
    return (
      <div className="min-h-screen bg-slate-950 p-4 font-sans flex flex-col items-center pt-8">
        <div className="w-full max-w-md bg-[#151c2c] rounded-2xl p-6 border border-slate-800 shadow-2xl">
          <button onClick={() => { setActiveView('DASHBOARD'); setTxAmount(''); setTxError(''); }} className="text-slate-400 text-sm mb-6 flex items-center gap-2 hover:text-white transition">
            ← Back to Dashboard
          </button>
          <h2 className="text-2xl font-bold text-white mb-2">Withdraw Funds</h2>
          <p className="text-slate-400 text-sm mb-6">Cash out via a local Agent or directly to M-Pesa.</p>

          {txError && <div className="bg-red-500/10 text-red-400 p-3 rounded-lg mb-4 text-sm">{txError}</div>}

          <form onSubmit={handleWithdraw} className="space-y-4">
            <div>
              <label className="text-slate-400 text-xs uppercase tracking-wider mb-2 block">Withdrawal Method</label>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setTxMethod('AGENT')} className={`p-3 rounded-lg border text-sm font-semibold transition ${txMethod === 'AGENT' ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'bg-[#1b2438] border-slate-700/50 text-slate-400'}`}>
                  Agent (Free)
                </button>
                <button type="button" onClick={() => setTxMethod('MPESA')} className={`p-3 rounded-lg border text-sm font-semibold transition ${txMethod === 'MPESA' ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'bg-[#1b2438] border-slate-700/50 text-slate-400'}`}>
                  M-Pesa (Fee)
                </button>
              </div>
            </div>
            <div>
              <label className="text-slate-400 text-xs uppercase tracking-wider mb-2 block">Amount (USD)</label>
              <input type="number" step="0.01" required max={balanceUSD} value={txAmount} onChange={(e) => setTxAmount(e.target.value)}
                className="w-full bg-[#1b2438] text-white border border-slate-700/50 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500"
                placeholder="0.00" />
            </div>
            <button type="submit" disabled={txLoading} className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg py-3.5 transition mt-2">
              {txLoading ? 'Processing...' : `Initiate ${txMethod === 'AGENT' ? 'Agent' : 'M-Pesa'} Withdrawal`}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN DASHBOARD VIEW
  // ==========================================
  
  return (
    <div className="min-h-screen bg-slate-950 p-4 pb-24 font-sans flex flex-col items-center">
      <div className="w-full max-w-md">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6 pt-2">
          <div>
            <h2 className="text-xl font-bold text-slate-100 tracking-tight">Hi, {user?.full_name?.split(' ')[0] || 'User'} 👋</h2>
            <p className="text-slate-500 text-sm font-medium">{user?.phone_number}</p>
          </div>
          <button onClick={onLogout} className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-slate-400 hover:text-white transition shadow-sm text-sm">
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

        {/* PRIMARY ACTIONS */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <button onClick={() => setActiveView('DEPOSIT')} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-emerald-500/50 hover:bg-slate-800 transition group shadow-lg">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center group-hover:bg-emerald-500/30 transition">
              <span className="text-emerald-400 text-lg font-black">+</span>
            </div>
            <span className="text-slate-200 font-bold text-[11px] uppercase tracking-wider">Deposit</span>
          </button>

          <button onClick={() => setActiveView('SEND')} className="bg-[#2a68ff]/10 border border-[#2a68ff]/30 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-[#2a68ff]/20 transition group shadow-lg">
            <div className="w-10 h-10 bg-[#2a68ff]/20 rounded-full flex items-center justify-center transition">
              <span className="text-[#2a68ff] text-lg font-black">⇄</span>
            </div>
            <span className="text-[#2a68ff] font-bold text-[11px] uppercase tracking-wider">Send</span>
          </button>

          <button onClick={() => setActiveView('WITHDRAW')} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-orange-500/50 hover:bg-slate-800 transition group shadow-lg">
            <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center group-hover:bg-orange-500/30 transition">
              <span className="text-orange-400 text-lg font-black">−</span>
            </div>
            <span className="text-slate-200 font-bold text-[11px] uppercase tracking-wider">Withdraw</span>
          </button>
        </div>

        {/* RECENT ACTIVITY */}
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
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${tx.type === 'BONUS' ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-800 text-slate-400'}`}>
                      {tx.type === 'BONUS' ? '🎁' : 'tx'}
                    </div>
                    <div>
                      <p className="text-slate-200 text-sm font-semibold">{tx.type === 'BONUS' ? 'Early Adopter Reward' : tx.type}</p>
                      <p className="text-slate-500 text-[10px]">{new Date(tx.created_at).toLocaleString()}</p>
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
    </div>
  );
}