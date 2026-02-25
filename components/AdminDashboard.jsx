import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AdminDashboard = ({ user, onLogout }) => {
  const [systemHealth, setSystemHealth] = useState({ totalUsers: 0, totalLiquidity: 0, activeAgents: 0 });
  const [systemStatus, setSystemStatus] = useState(true);
  
  // Agent Management States
  const [agentPhone, setAgentPhone] = useState('');
  const [floatAmount, setFloatAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSystemMetrics();
    fetchSystemStatus();
  }, []);

  const fetchSystemMetrics = async () => {
    // Note: In a production app with millions of users, you would use a backend cron job 
    // to calculate these sums. For the 200 pilot users, we can aggregate directly.
    
    // 1. Total Liquidity (Sum of all wallets)
    const { data: wallets } = await supabase.from('wallets').select('balance');
    const totalLiq = wallets ? wallets.reduce((sum, w) => sum + Number(w.balance), 0) : 0;

    // 2. User & Agent Counts
    const { data: profiles } = await supabase.from('profiles').select('role');
    const totalU = profiles ? profiles.length : 0;
    const totalA = profiles ? profiles.filter(p => p.role === 'AGENT').length : 0;

    setSystemHealth({ totalUsers: totalU, totalLiquidity: totalLiq, activeAgents: totalA });
  };

  const fetchSystemStatus = async () => {
    const { data } = await supabase.from('system_settings').select('is_active').eq('id', 1).single();
    if (data) setSystemStatus(data.is_active);
  };

  const toggleSystemStatus = async () => {
    const newStatus = !systemStatus;
    const confirmMsg = newStatus 
      ? "Are you sure you want to RE-OPEN the financial system?" 
      : "EMERGENCY OVERRIDE: Are you sure you want to FREEZE all transactions?";
      
    if (window.confirm(confirmMsg)) {
      await supabase.from('system_settings').update({ is_active: newStatus }).eq('id', 1);
      setSystemStatus(newStatus);
      setMessage(`System is now ${newStatus ? 'ONLINE' : 'FROZEN'}.`);
    }
  };

  const handleAllocateFloat = async (e) => {
    e.preventDefault();
    setLoading(true); setMessage('');

    try {
      const { data, error } = await supabase.rpc('allocate_agent_float', {
        admin_uuid: user.id,
        agent_phone: agentPhone,
        amount_usd: parseFloat(floatAmount)
      });

      if (error) throw new Error(error.message);

      setMessage(`Success! $${floatAmount} allocated to Agent ${agentPhone}.`);
      setAgentPhone(''); setFloatAmount('');
      fetchSystemMetrics(); // Refresh total liquidity
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }
    setLoading(false);
  };

  const handleCreateAgent = async () => {
    // Upgrades a standard user to an Agent
    if (!agentPhone) return alert("Please enter a phone number in the form below first.");
    
    const { data, error } = await supabase.from('profiles').update({ role: 'AGENT' }).eq('phone_number', agentPhone);
    if (error) {
      setMessage("Error upgrading user. Make sure they have registered an account.");
    } else {
      setMessage(`User ${agentPhone} upgraded to AGENT.`);
      fetchSystemMetrics();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 pb-20 font-sans">
      {/* HEADER & EMERGENCY OVERRIDE */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 pt-4 border-b border-slate-800 pb-6">
        <div>
          <p className="text-red-500 font-black text-xs uppercase tracking-widest">Command Center</p>
          <h2 className="text-2xl font-bold text-slate-100">System Admin</h2>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleSystemStatus}
            className={`px-6 py-3 rounded-xl font-black tracking-wide shadow-2xl transition ${systemStatus ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-green-600 hover:bg-green-500 text-white'}`}
          >
            {systemStatus ? 'HALT SYSTEM' : 'RE-OPEN SYSTEM'}
          </button>
          <button onClick={onLogout} className="text-sm bg-slate-800 px-4 py-3 rounded-xl text-slate-300 hover:text-white transition">Exit</button>
        </div>
      </div>

      {/* SYSTEM HEALTH METRICS (Liquidity Monitoring) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-lg relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-full h-1 ${systemStatus ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <p className="text-slate-400 text-sm font-medium mb-1">Network Status</p>
          <h1 className={`text-3xl font-black ${systemStatus ? 'text-green-400' : 'text-red-500'}`}>
            {systemStatus ? 'ONLINE' : 'FROZEN'}
          </h1>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-lg">
          <p className="text-slate-400 text-sm font-medium mb-1">Total System Liquidity</p>
          <h1 className="text-3xl font-black text-blue-400 tracking-tight">${systemHealth.totalLiquidity.toFixed(2)}</h1>
          <p className="text-xs text-slate-500 mt-2">Master Wallet must hold exactly this amount.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-lg flex justify-between items-center">
          <div>
            <p className="text-slate-400 text-sm font-medium mb-1">Total Users</p>
            <h1 className="text-3xl font-black text-white">{systemHealth.totalUsers}</h1>
          </div>
          <div className="text-right">
            <p className="text-slate-400 text-sm font-medium mb-1">Active Agents</p>
            <h1 className="text-3xl font-black text-yellow-500">{systemHealth.activeAgents}</h1>
          </div>
        </div>
      </div>

      {/* AGENT MANAGEMENT TERMINAL */}
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl max-w-2xl">
        <h3 className="font-bold text-xl mb-2 text-slate-100">Agent Float Allocation</h3>
        <p className="text-sm text-slate-400 mb-6">Mint digital dollars and assign them to an authorized Agent's float. Ensure physical KES has been received before minting.</p>
        
        {message && (
          <div className={`p-4 rounded-xl mb-6 text-sm font-bold border ${message.includes('Error') ? 'bg-red-500/10 border-red-500/50 text-red-400' : 'bg-green-500/10 border-green-500/50 text-green-400'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleAllocateFloat} className="flex flex-col gap-5">
          <div>
            <label className="text-xs text-slate-400 uppercase font-bold ml-1">Agent Phone Number</label>
            <div className="flex gap-2 mt-2">
              <input 
                type="tel" 
                required
                placeholder="07XX..." 
                className="flex-1 p-4 bg-slate-950 border border-slate-800 text-white rounded-2xl outline-none font-mono text-lg focus:border-blue-500 transition"
                value={agentPhone} 
                onChange={e => setAgentPhone(e.target.value)} 
              />
              <button 
                type="button"
                onClick={handleCreateAgent}
                className="bg-slate-800 text-slate-300 font-bold px-6 rounded-2xl border border-slate-700 hover:bg-slate-700 transition"
                title="Upgrade this user to an Agent"
              >
                Make Agent
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 uppercase font-bold ml-1">Float Amount (USD)</label>
            <input 
              type="number" 
              required
              min="1"
              step="0.01"
              placeholder="$0.00" 
              className="w-full mt-2 p-4 bg-slate-950 border border-slate-800 text-white rounded-2xl outline-none font-mono text-2xl focus:border-blue-500 transition"
              value={floatAmount} 
              onChange={e => setFloatAmount(e.target.value)} 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading || !agentPhone || !floatAmount} 
            className="w-full bg-blue-600 text-white font-black text-lg py-4 rounded-2xl mt-4 hover:bg-blue-500 transition disabled:opacity-50 shadow-lg"
          >
            {loading ? 'Authorizing Mint...' : 'Mint & Allocate Float'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminDashboard;
