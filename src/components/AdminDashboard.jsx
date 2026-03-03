import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient.js';

export default function AdminDashboard({ user, onLogout }) {
  // 1. Navigation State
  const [activeDept, setActiveDept] = useState('TECH_OPS'); // FINANCE, AGENT_OPS, SALES, SECURITY, TECH_OPS
  
  // 2. Global Metrics & Data States
  const [loading, setLoading] = useState(true);
  const [systemStats, setSystemStats] = useState({ totalUsers: 0, totalAgents: 0, totalBusinesses: 0, deployedFloat: 0 });
  const [fleetList, setFleetList] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  
  // 3. Terminal States: Finance & Agent Ops
  const [businessTag, setBusinessTag] = useState('');
  const [onboardTag, setOnboardTag] = useState('');
  const [targetAgentTag, setTargetAgentTag] = useState('');
  const [floatAmount, setFloatAmount] = useState('');
  
  // 4. Terminal States: Sales & Marketing
  const [currentJazia, setCurrentJazia] = useState(50.00); 
  const [newJazia, setNewJazia] = useState('');
  
  // 5. Terminal States: Security Radar
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedUser, setSearchedUser] = useState(null);

  // ==========================================
  // MASTER DATA FETCHER
  // ==========================================
 // ==========================================
  // MASTER DATA FETCHER (BULLETPROOF VERSION)
  // ==========================================
  const fetchGodModeData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Profiles (Using '*' prevents crashes if a column is missing)
      const { data: profiles, error: profileErr } = await supabase.from('profiles').select('*');
      if (profileErr) console.error("Vault Error (Profiles):", profileErr.message);

      // 2. Fetch Wallets
      const { data: wallets, error: walletErr } = await supabase.from('wallets').select('*');
      if (walletErr) console.error("Vault Error (Wallets):", walletErr.message);

      if (profiles && wallets) {
        const users = profiles.filter(p => p.role === 'USER');
        const agents = profiles.filter(p => p.role === 'AGENT');
        const businesses = profiles.filter(p => p.role === 'BUSINESS');
        const totalDeployed = wallets.reduce((sum, wallet) => sum + Number(wallet.balance), 0);

        setSystemStats({
          totalUsers: users.length,
          totalAgents: agents.length,
          totalBusinesses: businesses.length,
          deployedFloat: totalDeployed
        });

        setFleetList([...agents, ...businesses]);
      } else {
        console.warn("Data returned null. Check your RLS policies or database connection.");
      }

      // 3. Fetch Telemetry Logs
      const { data: logs, error: logErr } = await supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);
      
      if (logErr) console.error("Radar Error (Logs):", logErr.message);
      if (logs) setSystemLogs(logs);

    } catch (err) {
      console.error("Critical Dashboard crash:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGodModeData();
  }, [activeDept]);

  // ==========================================
  // DEPARTMENT EXECUTIONS
  // ==========================================
  
  // FINANCE
  const handleOnboardBusiness = async (e) => {
    e.preventDefault();
    const cleanTag = businessTag.replace('@', '').trim().toLowerCase();
    if (!window.confirm(`Promote @${cleanTag} to a BUSINESS Merchant Account?`)) return;

    try {
      const { error } = await supabase.from('profiles').update({ role: 'BUSINESS' }).eq('finance_tag', cleanTag);
      if (error) throw error;
      alert(`@${cleanTag} upgraded to BUSINESS status.`);
      setBusinessTag(''); fetchGodModeData();
    } catch (err) { alert("Promotion failed: " + err.message); }
  };

  // AGENT OPS
  const handleOnboardAgent = async (e) => {
    e.preventDefault();
    const cleanTag = onboardTag.replace('@', '').trim().toLowerCase();
    if (!window.confirm(`Promote @${cleanTag} to AGENT status?`)) return;

    try {
      const { error } = await supabase.from('profiles').update({ role: 'AGENT' }).eq('finance_tag', cleanTag);
      if (error) throw error;
      alert(`@${cleanTag} is now a FinanceOS Agent.`);
      setOnboardTag(''); fetchGodModeData();
    } catch (err) { alert("Promotion failed."); }
  };

  const handleMintFloat = async (e) => {
    e.preventDefault();
    if (!window.confirm(`WARNING: Deploying $${floatAmount} to @${targetAgentTag}. Proceed?`)) return;
    try {
      const { error } = await supabase.rpc('allocate_agent_float', {
        admin_uuid: user.id,
        target_agent_tag: targetAgentTag,
        amount_usd: parseFloat(floatAmount)
      });
      if (error) throw error;
      alert(`SUCCESS: $${floatAmount} deployed.`);
      setTargetAgentTag(''); setFloatAmount(''); fetchGodModeData();
    } catch (err) { alert("Allocation Failed: " + err.message); }
  };

  // SALES
  const handleUpdateJazia = async (e) => {
    e.preventDefault();
    if (!window.confirm(`Update the global Jazia signup bonus to $${newJazia}?`)) return;
    try {
      // Update the secure system settings table
      await supabase.from('system_settings').upsert({ key: 'jazia_bonus_amount', value: parseFloat(newJazia) });
      setCurrentJazia(parseFloat(newJazia));
      setNewJazia('');
      alert("Marketing acquisition algorithm updated.");
    } catch (err) { alert("Failed to update system settings."); }
  };

  // SECURITY
  const handleSecuritySearch = async (e) => {
    e.preventDefault();
    const cleanQuery = searchQuery.replace('@', '').trim().toLowerCase();
    const { data, error } = await supabase
      .from('profiles')
      .select('*, wallets(balance, escrow_balance)')
      .or(`finance_tag.eq.${cleanQuery},phone_number.eq.${cleanQuery}`)
      .single();
    if (error) { alert("Target not found."); setSearchedUser(null); } 
    else { setSearchedUser(data); }
  };

  const toggleAccountFreeze = async (targetId, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'FROZEN' : 'ACTIVE';
    const msg = currentStatus === 'ACTIVE' 
      ? "CODE RED: Are you sure you want to FREEZE this account? All funds will be locked."
      : "Are you sure you want to UNFREEZE this account?";

    if (!window.confirm(msg)) return;

    try {
      const { error } = await supabase.from('profiles').update({ account_status: newStatus }).eq('id', targetId);
      if (error) throw error;
      alert(`Account status updated to: ${newStatus}`);
      setSearchedUser({ ...searchedUser, account_status: newStatus });
    } catch (err) { alert("Failed to update security status."); }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-300 font-sans flex">
      {/* 🛑 MOBILE SECURITY BLOCKER */}
      <div className="md:hidden fixed inset-0 z-50 bg-red-900 flex flex-col items-center justify-center p-6 text-center">
        <span className="text-6xl mb-4">🛡️</span>
        <h1 className="text-2xl font-black text-white mb-2 tracking-widest">SECURITY PROTOCOL</h1>
        <p className="text-red-200">UNAUTHORIZED DEVICE.<br/>Command Centre requires desktop architecture.</p>
        <button onClick={onLogout} className="mt-8 bg-black/50 hover:bg-black text-white px-6 py-3 rounded-lg font-bold border border-red-500/30 transition">Terminate Session</button>
      </div>

      {/* 🧭 SIDEBAR NAVIGATION */}
      <div className="hidden md:flex w-64 bg-[#0b1121] border-r border-slate-800/60 flex-col justify-between h-screen sticky top-0 shadow-2xl z-10">
        <div>
          <div className="p-6 border-b border-slate-800/60">
            <h1 className="text-2xl font-black text-white tracking-tighter">FinanceOS</h1>
            <p className="text-[#2a68ff] text-[10px] font-bold uppercase tracking-widest mt-1">Command Centre</p>
          </div>
          <nav className="p-4 space-y-2 mt-2">
            <button onClick={() => setActiveDept('TECH_OPS')} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition ${activeDept === 'TECH_OPS' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300'}`}>📡 Tech Ops & Glitches</button>
            <button onClick={() => setActiveDept('FINANCE')} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition ${activeDept === 'FINANCE' ? 'bg-[#2a68ff]/10 text-[#2a68ff] border border-[#2a68ff]/30' : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300'}`}>🏦 Finance & Treasury</button>
            <button onClick={() => setActiveDept('AGENT_OPS')} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition ${activeDept === 'AGENT_OPS' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30' : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300'}`}>⚡ Agent Operations</button>
            <button onClick={() => setActiveDept('SALES')} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition ${activeDept === 'SALES' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30' : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300'}`}>📈 Sales & Marketing</button>
            <button onClick={() => setActiveDept('SECURITY')} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition ${activeDept === 'SECURITY' ? 'bg-red-500/10 text-red-500 border border-red-500/30' : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300'}`}>🛡️ Security Radar</button>
          </nav>
        </div>
        <div className="p-6 border-t border-slate-800/60">
          <p className="text-white text-sm font-bold mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> {user?.full_name}
          </p>
          <button onClick={onLogout} className="w-full bg-slate-800/50 hover:bg-slate-800 text-slate-400 text-xs font-bold py-2.5 rounded-lg border border-slate-700/50 transition">Log Out</button>
        </div>
      </div>

      {/* 🖥️ MAIN CONTENT AREA */}
      <div className="hidden md:block flex-1 p-8 overflow-y-auto h-screen bg-gradient-to-br from-[#070b14] to-[#0a0f1c]">
        
        {/* ========================================== */}
        {/* DEPARTMENT 1: TECH OPS & GLITCH RADAR      */}
        {/* ========================================== */}
        {activeDept === 'TECH_OPS' && (
          <div className="animate-fade-in">
            <h2 className="text-3xl font-black text-white mb-6">Tech Ops & Glitch Radar</h2>

            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="bg-[#151c2c] border border-emerald-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl"></div>
                <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-2">FinanceOS Core DB</p>
                <h3 className="text-2xl font-black text-white flex items-center gap-2">ONLINE <span className="text-emerald-500 text-[10px] uppercase bg-emerald-500/10 px-2 py-1 rounded">12ms ping</span></h3>
              </div>
              
              <div className="bg-[#151c2c] border border-amber-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-full blur-xl"></div>
                <p className="text-amber-500 text-xs font-bold uppercase tracking-widest mb-2">Safaricom Daraja API</p>
                <h3 className="text-2xl font-black text-white flex items-center gap-2">STANDBY <span className="text-amber-500 text-[10px] uppercase bg-amber-500/10 px-2 py-1 rounded">Awaiting Auth</span></h3>
              </div>

              <div className="bg-[#151c2c] border border-red-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 rounded-full blur-xl"></div>
                <p className="text-red-500 text-xs font-bold uppercase tracking-widest mb-2">Unresolved Glitches</p>
                <h3 className="text-4xl font-black text-white">{systemLogs.filter(l => !l.resolved).length}</h3>
              </div>
            </div>

            <div className="bg-[#0b1121] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-[#151c2c]">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Live Telemetry & Crash Feed</h3>
                <button onClick={fetchGodModeData} className="text-[10px] uppercase tracking-widest font-bold bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded transition">Refresh Feed</button>
              </div>
              
              <div className="p-2 h-96 overflow-y-auto font-mono text-sm">
                {systemLogs.length === 0 ? (
                  <p className="text-slate-500 text-center py-10">System operating flawlessly. No errors detected.</p>
                ) : (
                  systemLogs.map(log => (
                    <div key={log.id} className={`p-4 mb-2 rounded-xl border ${log.severity === 'CRITICAL_ERROR' ? 'bg-red-900/10 border-red-500/30 text-red-200' : log.severity === 'WARNING' ? 'bg-amber-900/10 border-amber-500/30 text-amber-200' : 'bg-slate-800/30 border-slate-800 text-slate-300'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex gap-3 items-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${log.severity === 'CRITICAL_ERROR' ? 'bg-red-500 text-white' : log.severity === 'WARNING' ? 'bg-amber-500 text-black' : 'bg-slate-600 text-white'}`}>
                            {log.severity}
                          </span>
                          <span className="text-slate-500 text-[10px]">{new Date(log.created_at).toLocaleTimeString()}</span>
                        </div>
                        <span className="text-slate-500 text-[10px] font-bold">SRC: {log.source}</span>
                      </div>
                      <p className="font-bold">{log.message}</p>
                      {log.user_tag && <p className="text-slate-400 mt-2 text-[10px] uppercase tracking-widest">AFFECTED TAG: <span className="text-white">@{log.user_tag}</span></p>}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* DEPARTMENT 2: FINANCE & TREASURY           */}
        {/* ========================================== */}
        {activeDept === 'FINANCE' && (
          <div className="animate-fade-in">
            <h2 className="text-3xl font-black text-white mb-6">Finance & Business Ecosystem</h2>
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="bg-[#151c2c] border border-slate-800 rounded-2xl p-6 shadow-xl">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Deployed Liquidity</p>
                <h3 className="text-4xl font-black text-[#2a68ff]">${loading ? '...' : systemStats.deployedFloat.toFixed(2)}</h3>
              </div>
              <div className="bg-[#151c2c] border border-slate-800 rounded-2xl p-6 shadow-xl">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Total Users</p>
                <h3 className="text-4xl font-black text-white">{loading ? '...' : systemStats.totalUsers}</h3>
              </div>
              <div className="bg-[#151c2c] border border-purple-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-xl"></div>
                <p className="text-purple-400 text-xs font-bold uppercase tracking-widest mb-2">Business Accounts</p>
                <h3 className="text-4xl font-black text-white relative z-10">{loading ? '...' : systemStats.totalBusinesses}</h3>
              </div>
            </div>

            <div className="bg-[#151c2c] border border-slate-800 p-6 rounded-2xl shadow-xl max-w-xl">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2"><span className="text-[#2a68ff]">🏢</span> Onboard Merchant Account</h3>
              <p className="text-xs text-slate-400 mb-4">Upgrading a user to a BUSINESS role lifts standard P2P transfer limits.</p>
              <form onSubmit={handleOnboardBusiness} className="flex gap-3">
                <input type="text" required placeholder="@business_tag" value={businessTag} onChange={e => setBusinessTag(e.target.value)} className="flex-1 bg-[#1b2438] border border-slate-700/50 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#2a68ff] transition" />
                <button type="submit" className="bg-[#2a68ff] hover:bg-blue-600 text-white font-bold px-6 py-3 rounded-xl transition">Authorize</button>
              </form>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* DEPARTMENT 3: AGENT OPERATIONS             */}
        {/* ========================================== */}
        {activeDept === 'AGENT_OPS' && (
          <div className="animate-fade-in">
             <h2 className="text-3xl font-black text-white mb-6">Agent Fleet Manager</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              
              <div className="bg-[#151c2c] border border-slate-800 p-6 rounded-2xl shadow-xl">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2"><span className="text-emerald-500">✦</span> Promote User to Agent</h3>
                <form onSubmit={handleOnboardAgent} className="flex gap-3">
                  <input type="text" required placeholder="@finance_tag" value={onboardTag} onChange={e => setOnboardTag(e.target.value)} className="flex-1 bg-[#1b2438] border border-slate-700/50 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition" />
                  <button type="submit" className="bg-slate-800 hover:bg-emerald-600 text-white font-bold px-6 py-3 rounded-xl transition">Promote</button>
                </form>
              </div>

              <div className="bg-[#151c2c] border border-slate-800 p-6 rounded-2xl shadow-xl">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2"><span className="text-amber-500">⚡</span> Deploy Treasury Float</h3>
                <form onSubmit={handleMintFloat} className="flex flex-col gap-3">
                  <div className="flex gap-3">
                    <input type="text" required placeholder="@agent_tag" value={targetAgentTag} onChange={e => setTargetAgentTag(e.target.value)} className="w-1/2 bg-[#1b2438] border border-slate-700/50 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition" />
                    <input type="number" required min="1" placeholder="$ USD" value={floatAmount} onChange={e => setFloatAmount(e.target.value)} className="w-1/2 bg-[#1b2438] border border-slate-700/50 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition font-mono" />
                  </div>
                  <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-white font-black px-6 py-3 rounded-xl transition shadow-lg shadow-amber-900/20">AUTHORIZE DEPLOYMENT</button>
                </form>
              </div>
            </div>

            <div className="bg-[#151c2c] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-4 border-b border-slate-800 bg-[#0b1121]">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Partner Network</h3>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0b1121] text-slate-500 text-[10px] uppercase tracking-widest">
                    <th className="p-4 font-bold border-b border-slate-800">Partner Details</th>
                    <th className="p-4 font-bold border-b border-slate-800">Role</th>
                    <th className="p-4 font-bold border-b border-slate-800">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="3" className="p-8 text-center text-slate-500">Scanning network...</td></tr>
                  ) : fleetList.map(partner => (
                    <tr key={partner.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 border-b border-slate-800/50">
                        <p className="text-white font-bold text-sm">{partner.full_name}</p>
                        <p className="text-slate-400 text-xs font-mono">@{partner.finance_tag}</p>
                      </td>
                      <td className="p-4 border-b border-slate-800/50">
                        <span className={`text-[10px] px-2 py-1 rounded-md uppercase font-bold border ${partner.role === 'BUSINESS' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                          {partner.role}
                        </span>
                      </td>
                      <td className="p-4 border-b border-slate-800/50">
                        <span className={`text-[10px] px-2 py-1 rounded-md uppercase font-bold border ${partner.account_status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                          {partner.account_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* DEPARTMENT 4: SALES & MARKETING            */}
        {/* ========================================== */}
        {activeDept === 'SALES' && (
          <div className="animate-fade-in">
            <h2 className="text-3xl font-black text-white mb-6">Marketing & Acquisition</h2>
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-br from-[#151c2c] to-[#1a2235] border border-purple-500/30 p-8 rounded-2xl shadow-2xl">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-black text-xl text-white">The Jazia Engine</h3>
                    <p className="text-xs text-slate-400 mt-1">Algorithmic User Acquisition Bonus</p>
                  </div>
                  <div className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-lg text-[10px] uppercase font-bold border border-purple-500/30">ACTIVE</div>
                </div>
                <div className="mb-6">
                  <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Current Global Reward</p>
                  <p className="text-5xl font-black text-white">${currentJazia.toFixed(2)}</p>
                </div>
                <form onSubmit={handleUpdateJazia} className="flex gap-3">
                  <input type="number" required min="0" step="0.5" placeholder="New Amount ($)" value={newJazia} onChange={e => setNewJazia(e.target.value)} className="w-1/2 bg-[#0b1121] border border-slate-700/50 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 transition font-mono" />
                  <button type="submit" className="w-1/2 bg-purple-600 hover:bg-purple-500 text-white font-black px-6 py-3 rounded-xl transition shadow-lg shadow-purple-900/20">Throttle Bonus</button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* DEPARTMENT 5: SECURITY RADAR               */}
        {/* ========================================== */}
        {activeDept === 'SECURITY' && (
          <div className="animate-fade-in">
            <h2 className="text-3xl font-black text-white mb-6">Global Security Radar</h2>
            <form onSubmit={handleSecuritySearch} className="flex gap-4 mb-8">
              <input type="text" placeholder="Search by @finance_tag or Phone Number..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 bg-[#1b2438] border border-slate-700/50 text-white rounded-xl px-6 py-4 focus:outline-none focus:border-red-500 transition font-mono" />
              <button type="submit" className="bg-red-600 hover:bg-red-500 text-white font-black px-8 py-4 rounded-xl transition shadow-lg shadow-red-900/20">LOCATE TARGET</button>
            </form>

            {searchedUser && (
              <div className="bg-[#151c2c] border border-red-500/30 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-500 opacity-5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <h3 className="text-2xl font-black text-white">{searchedUser.full_name}</h3>
                    <p className="text-slate-400 font-mono text-lg mb-4">@{searchedUser.finance_tag} | {searchedUser.phone_number}</p>
                    
                    <div className="flex gap-6 mb-8">
                      <div>
                        <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold mb-1">Vault Balance</p>
                        <p className="text-2xl font-black text-white">${searchedUser.wallets[0]?.balance.toFixed(2) || '0.00'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold mb-1">Current Status</p>
                        <span className={`text-sm px-3 py-1 rounded-md font-bold uppercase tracking-wider ${searchedUser.account_status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-500 border border-red-500/30'}`}>
                          {searchedUser.account_status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => toggleAccountFreeze(searchedUser.id, searchedUser.account_status)}
                    className={`px-8 py-4 rounded-xl font-black tracking-widest uppercase transition shadow-lg ${searchedUser.account_status === 'ACTIVE' ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/20' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20'}`}
                  >
                    {searchedUser.account_status === 'ACTIVE' ? 'INITIATE FREEZE' : 'LIFT RESTRICTION'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}