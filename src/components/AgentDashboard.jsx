import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient.js';

export default function AgentDashboard({ user, onLogout }) {
  // Core Data States
  const [floatBalance, setFloatBalance] = useState(0);
  const [recentActivity, setRecentActivity] = useState([]);
  const [exchangeRates, setExchangeRates] = useState({});
  const [loadingData, setLoadingData] = useState(true);
  
  // Terminal Form States
  const [customerTag, setCustomerTag] = useState('');
  const [inputCurrency, setInputCurrency] = useState('KES');
  const [localAmount, setLocalAmount] = useState('');
  
  // UI Feedback States
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Supported physical currencies for the Agent Network
  const currencies = ['KES', 'UGX', 'TZS', 'RWF', 'USD'];

  // 1. Fetch Agent Data & Exchange Rates
  const fetchAgentData = async () => {
    try {
      // Fetch Live FX Rates
      const rateResponse = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const rateData = await rateResponse.json();
      setExchangeRates(rateData.rates);

      // Fetch Agent's Vault Float
      const { data: wallet } = await supabase
        .from('wallets')
        .select('id, balance')
        .eq('profile_id', user.id)
        .single();
        
      if (wallet) {
        setFloatBalance(Number(wallet.balance));

        // Fetch Agent's Ledger (using the new Gen-2 transactions schema)
        const { data: txs } = await supabase
          .from('transactions')
          .select('*')
          .eq('wallet_id', wallet.id)
          .order('created_at', { ascending: false })
          .limit(8);
          
        if (txs) setRecentActivity(txs);
      }
    } catch (err) {
      console.error("Dashboard error:", err.message);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user?.id) fetchAgentData();
  }, [user]);

  // 2. The Auto-Conversion Engine
  // This calculates the USD equivalent live as the agent types
  const calculateUSD = () => {
    if (!localAmount || !exchangeRates[inputCurrency]) return 0;
    if (inputCurrency === 'USD') return Number(localAmount);
    return Number(localAmount) / exchangeRates[inputCurrency];
  };

  const usdEquivalent = calculateUSD();

  // 3. Process the Deposit
  const handleAgentDeposit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      if (usdEquivalent <= 0) throw new Error("Please enter a valid amount.");
      if (usdEquivalent > floatBalance) throw new Error("Insufficient digital float.");

      // Clean the tag input
      const cleanTag = customerTag.replace('@', '').trim().toLowerCase();

      // Execute the Gen-2 SQL Engine (Reusing our P2P infrastructure)
      const { data, error: rpcError } = await supabase.rpc('p2p_transfer', {
        sender_id: user.id,
        recipient_tag: cleanTag,
        transfer_amount: Number(usdEquivalent.toFixed(2))
      });
      
      if (rpcError) throw new Error(rpcError.message || "Failed to locate user tag.");

      setMessage(`Success! $${usdEquivalent.toFixed(2)} USD credited to @${cleanTag}. Collect the physical ${inputCurrency}.`);
      setCustomerTag('');
      setLocalAmount('');
      
      // Refresh the vault data instantly
      fetchAgentData();
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1121] text-white p-4 pb-20 font-sans flex flex-col items-center">
      <div className="w-full max-w-md">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6 pt-4">
          <div>
            <p className="text-amber-500 font-black text-[10px] uppercase tracking-widest bg-amber-500/10 inline-block px-2 py-1 rounded-md mb-1 border border-amber-500/20">
              Agent Terminal
            </p>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              {user?.full_name?.split(' ')[0]} 
              {user?.finance_tag && (
                <span className="text-amber-500/70 text-[10px] uppercase tracking-widest font-bold">
                  @{user.finance_tag}
                </span>
              )}
            </h2>
          </div>
          <button onClick={onLogout} className="text-sm bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-slate-400 font-bold hover:text-white hover:border-slate-600 transition shadow-sm">
            Log Out
          </button>
        </div>

        {/* AGENT FLOAT METRIC */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-amber-500/20 p-6 rounded-3xl mb-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500 opacity-5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          <div className="flex justify-between items-center relative z-10">
            <div>
              <p className="text-amber-500/80 text-xs font-bold uppercase tracking-wider mb-1">Available Float</p>
              <h1 className="text-4xl font-black tracking-tight text-white flex items-baseline gap-2">
                {loadingData ? '...' : `$${floatBalance.toFixed(2)}`}
                <span className="text-lg font-medium text-slate-400">USD</span>
              </h1>
            </div>
            <div className="bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/30">
              <span className="text-amber-500 text-xl">⚡</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-4 bg-black/40 inline-block px-3 py-1.5 rounded-lg border border-slate-700/50 uppercase tracking-wide font-semibold">
            Agent Status: Active
          </p>
        </div>

        {/* THE EXCHANGE TERMINAL */}
        <div className="bg-[#151c2c] p-6 rounded-3xl shadow-2xl border border-slate-800 mb-8">
          <h3 className="font-bold text-lg mb-6 text-white tracking-tight">Process Cash-In</h3>
          
          {message && <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-xl mb-6 text-sm font-bold text-center">{message}</div>}
          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl mb-6 text-sm font-bold text-center">{error}</div>}

          <form onSubmit={handleAgentDeposit} className="space-y-5">
            
            {/* Currency & Amount Split Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider ml-1 mb-2 block">Currency</label>
                <select 
                  value={inputCurrency} 
                  onChange={(e) => setInputCurrency(e.target.value)}
                  className="w-full bg-[#1b2438] border border-slate-700/50 text-amber-500 font-bold rounded-xl p-3.5 focus:outline-none focus:border-amber-500 transition appearance-none cursor-pointer"
                >
                  {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider ml-1 mb-2 block">Physical Cash Received</label>
                <input 
                  type="number" required min="1" step="any"
                  className="w-full bg-[#1b2438] border border-slate-700/50 text-white rounded-xl px-4 py-3.5 focus:outline-none focus:border-amber-500 transition font-mono text-lg"
                  placeholder="0.00" value={localAmount} onChange={(e) => setLocalAmount(e.target.value)} 
                />
              </div>
            </div>

            {/* Live Auto-Conversion Display */}
            <div className="bg-black/30 rounded-xl p-4 flex justify-between items-center border border-slate-800/50">
              <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Will Send (USD)</span>
              <span className="text-amber-500 font-mono font-bold text-xl">${usdEquivalent.toFixed(2)}</span>
            </div>

            {/* Customer Finance Tag */}
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider ml-1 mb-2 block">Customer Finance Tag</label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-slate-500 font-bold">@</span>
                <input 
                  type="text" required placeholder="username"
                  className="w-full bg-[#1b2438] border border-slate-700/50 text-white rounded-xl pl-9 pr-4 py-3.5 focus:outline-none focus:border-amber-500 transition"
                  value={customerTag} onChange={(e) => setCustomerTag(e.target.value)} 
                />
              </div>
            </div>

            <button 
              type="submit" disabled={loading || !localAmount || !customerTag} 
              className="w-full bg-amber-600 text-white font-black uppercase tracking-wider text-sm py-4 rounded-xl mt-2 hover:bg-amber-500 transition disabled:opacity-50 shadow-lg shadow-amber-900/20"
            >
              {loading ? 'Processing...' : 'Execute Deposit'}
            </button>
          </form>
        </div>

        {/* SHIFT ACTIVITY LOG */}
        <div>
          <h3 className="text-[11px] text-slate-400 uppercase font-bold tracking-wider mb-3 px-1">Shift Ledger</h3>
          <div className="bg-[#151c2c] border border-slate-800 rounded-2xl p-2 shadow-lg">
            {loadingData ? (
              <p className="text-slate-500 text-sm text-center py-6">Syncing ledger...</p>
            ) : recentActivity.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-6">No transactions recorded yet.</p>
            ) : (
              recentActivity.map(tx => {
                const isIncome = tx.amount > 0;
                return (
                  <div key={tx.id} className="flex justify-between items-center p-3 border-b border-slate-800/50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isIncome ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-500'}`}>
                        {isIncome ? '↓' : '↑'}
                      </div>
                      <div>
                        <p className="text-slate-200 text-sm font-semibold">{tx.type}</p>
                        <p className="text-slate-500 text-[10px]">{new Date(tx.created_at).toLocaleTimeString()}</p>
                      </div>
                    </div>
                    <p className={`font-bold text-sm ${isIncome ? 'text-emerald-400' : 'text-slate-200'}`}>
                      {isIncome ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                    </p>
                  </div>
                )
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}