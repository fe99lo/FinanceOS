import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AgentDashboard = ({ user, onLogout }) => {
  const [floatBalance, setFloatBalance] = useState(0);
  const [recentActivity, setRecentActivity] = useState([]);
  
  // Transaction Form States
  const [customerPhone, setCustomerPhone] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAgentData();
  }, []);

  const fetchAgentData = async () => {
    // 1. Fetch the Agent's Float Balance
    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('profile_id', user.id)
      .single();
      
    if (wallet) setFloatBalance(wallet.balance);

    // 2. Fetch Agent's Recent Transactions (Deposits given & Withdrawals received)
    const { data: txs } = await supabase
      .from('transactions')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(8);
      
    if (txs) setRecentActivity(txs);
  };

  const handleAgentDeposit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      // Execute the secure SQL Smart Contract
      const { data, error: rpcError } = await supabase.rpc('process_agent_deposit', {
        agent_uuid: user.id,
        customer_phone: customerPhone,
        amount_usd: parseFloat(depositAmount)
      });
      
      if (rpcError) throw new Error(rpcError.message);

      setMessage(`Success! $${depositAmount} has been credited to ${customerPhone}. Collect the physical cash.`);
      setCustomerPhone('');
      setDepositAmount('');
      
      // Refresh the dashboard data
      fetchAgentData();
      
    } catch (err) {
      setError(err.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-20">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 pt-4">
        <div>
          <p className="text-yellow-500 font-bold text-xs uppercase tracking-widest">Agent Terminal</p>
          <h2 className="text-xl font-bold">{user.full_name}</h2>
        </div>
        <button onClick={onLogout} className="text-sm bg-slate-800 px-4 py-2 rounded-lg text-red-400 font-bold hover:bg-slate-700 transition">Log Out</button>
      </div>

      {/* AGENT FLOAT METRIC */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl mb-8 shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-slate-400 text-sm mb-1 font-medium">Available Float</p>
            <h1 className="text-4xl font-black tracking-tight text-white">${floatBalance.toFixed(2)}</h1>
          </div>
          <div className="bg-yellow-500/10 p-3 rounded-2xl border border-yellow-500/20">
            <p className="text-yellow-500 text-xs font-bold uppercase">Active</p>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-4 bg-slate-800 inline-block px-3 py-1 rounded-full">Earn 2% commission on all transactions.</p>
      </div>

      {/* DEPOSIT ACTION TERMINAL */}
      <div className="bg-slate-800 p-6 rounded-3xl shadow-xl border border-slate-700 mb-8">
        <h3 className="font-bold text-lg mb-6 text-slate-100">Process Customer Deposit</h3>
        
        {message && <div className="bg-green-500/20 border border-green-500/50 text-green-400 p-4 rounded-xl mb-6 text-sm font-bold">{message}</div>}
        {error && <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-4 rounded-xl mb-6 text-sm font-bold">{error}</div>}

        <form onSubmit={handleAgentDeposit} className="flex flex-col gap-5">
          <div>
            <label className="text-xs text-slate-400 uppercase font-bold ml-1">Customer Phone Number</label>
            <input 
              type="tel" 
              required
              placeholder="07XX..." 
              className="w-full mt-2 p-4 bg-slate-900 border border-slate-700 text-white rounded-2xl outline-none font-mono text-xl focus:border-yellow-500 transition"
              value={customerPhone} 
              onChange={e => setCustomerPhone(e.target.value)} 
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 uppercase font-bold ml-1">Deposit Amount (USD)</label>
            <input 
              type="number" 
              required
              min="1"
              step="0.01"
              placeholder="$0.00" 
              className="w-full mt-2 p-4 bg-slate-900 border border-slate-700 text-white rounded-2xl outline-none font-mono text-3xl focus:border-yellow-500 transition"
              value={depositAmount} 
              onChange={e => setDepositAmount(e.target.value)} 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading || !customerPhone || !depositAmount} 
            className="w-full bg-yellow-600 text-black font-black text-lg py-4 rounded-2xl mt-2 hover:bg-yellow-500 transition disabled:opacity-50 shadow-lg"
          >
            {loading ? 'Processing...' : 'Confirm Deposit'}
          </button>
        </form>
      </div>

      {/* SHIFT ACTIVITY LOG */}
      <div>
        <h3 className="text-lg font-bold mb-4 text-slate-200">Shift Activity</h3>
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col gap-4">
          {recentActivity.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-4">No transactions recorded yet.</p>
          ) : (
            recentActivity.map(tx => {
              const isIncome = tx.receiver_id === user.id; // Income means a user withdrew cash AT the agent
              return (
                <div key={tx.id} className="flex justify-between items-center border-b border-slate-800 pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="font-bold text-sm text-slate-200">{tx.tx_type.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-slate-500 mt-1">{new Date(tx.created_at).toLocaleTimeString()}</p>
                  </div>
                  <p className={`font-black text-lg ${isIncome ? 'text-green-500' : 'text-slate-300'}`}>
                    {isIncome ? '+' : '-'}${tx.amount.toFixed(2)}
                  </p>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;
