import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient.js';

export default function AdminDashboard({ user, onLogout }) {
  // Department Navigation State
  const [activeDept, setActiveDept] = useState('TREASURY'); // TREASURY, AGENT_OPS, SECURITY
  
  // Global Data States
  const [systemStats, setSystemStats] = useState({ totalUsers: 0, totalAgents: 0, deployedFloat: 0 });
  const [agentsList, setAgentsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Security Desk States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedUser, setSearchedUser] = useState(null);

  // 1. Master Data Fetcher (Requires God-Mode SQL to work)
  const fetchGodModeData = async () => {
    setLoading(true);
    try {
      // Fetch all profiles to calculate stats
      const { data: profiles } = await supabase.from('profiles').select('id, role, finance_tag, account_status, full_name, phone_number');
      const { data: wallets } = await supabase.from('wallets').select('balance');

      if (profiles && wallets) {
        const users = profiles.filter(p => p.role === 'USER');
        const agents = profiles.filter(p => p.role === 'AGENT');
        const totalDeployed = wallets.reduce((sum, wallet) => sum + Number(wallet.balance), 0);

        setSystemStats({
          totalUsers: users.length,
          totalAgents: agents.length,
          deployedFloat: totalDeployed
        });

        setAgentsList(agents);
      }
    } catch (err) {
      console.error("God Mode fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGodModeData();
  }, [activeDept]);

  // 2. Department Action: Mint Float to Agent
  const handleMintFloat = async (agentId, amount) => {
    if (!window.confirm(`WARNING: Minting $${amount} from Master Treasury to Agent. Proceed?`)) return;
    
    try {
      // In production, this will call a secure RPC to debit the Master Treasury and credit the Agent
      alert(`[SYSTEM MOCK] $${amount} successfully deployed to Agent ID: ${agentId}`);
      // fetchGodModeData();
    } catch (err) {
      alert("Minting failed: " + err.message);
    }
  };

  // 3. Department Action: The Code Red Kill Switch
  const handleSecuritySearch = async (e) => {
    e.preventDefault();
    const cleanQuery = searchQuery.replace('@', '').trim().toLowerCase();
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*, wallets(balance, escrow_balance)')
      .or(`finance_tag.eq.${cleanQuery},phone_number.eq.${cleanQuery}`)
      .single();

    if (error) {
      alert("Target not found on the network.");
      setSearchedUser(null);
    } else {
      setSearchedUser(data);
    }
  };

  const toggleAccountFreeze = async (targetId, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'FROZEN' : 'ACTIVE';
    const msg = currentStatus === 'ACTIVE' 
      ? "CODE RED: Are you sure you want to FREEZE this account? All funds will be locked."
      : "Are you sure you want to UNFREEZE this account?";

    if (!window.confirm(msg)) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ account_status: newStatus })
        .eq('id', targetId);

      if (error) throw error;
      alert(`Account status updated to: ${newStatus}`);
      setSearchedUser({ ...searchedUser, account_status: newStatus });
    } catch (err) {
      alert("Failed to update security status.");
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-300 font-sans flex">
      
      {/* MOBILE BLOCKER: Only visible on small screens */}
      <div className="md:hidden fixed inset-0 z-50 bg-red-900 flex flex-col items-center justify-center p-6 text-center">
        <span className="text-6xl mb-4">🛡️</span>
        <h1 className="text-2xl font-black text-white mb-2 tracking-widest">SECURITY PROTOCOL</h1>
        <p className="text-red-200 font-medium">
          UNAUTHORIZED DEVICE.<br/><br/>
          The God Mode Command Centre can only be accessed from a secure desktop terminal.
        </p>
        <button onClick={onLogout} className="mt-8 bg-black/50 text-white px-6 py-3 rounded-lg font-bold border border-red-500/30">
          Sign Out
        </button>
      </div>

      {/* DESKTOP UI: SIDEBAR NAVIGATION */}
      <div className="hidden md:flex w-64 bg-[#0b1121] border-r border-slate-800/60 flex-col justify-between h-screen sticky top-0">
        <div>
          <div className="p-6 border-b border-slate-800/60">
            <h1 className="text-2xl font-black text-white tracking-tighter">FinanceOS</h1>
            <p className="text-[#2a68ff] text-[10px] font-bold uppercase tracking-widest mt-1">Command Centre</p>
          </div>
          
          <nav className="p-4 space-y-2 mt-4">
            <button 
              onClick={() => setActiveDept('TREASURY')}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold tracking-wide transition-all ${activeDept === 'TREASURY' ? 'bg-[#2a68ff]/10 text-[#2a68ff] border border-[#2a68ff]/30' : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300'}`}
            >
              📊 Treasury Desk
            </button>
            <button 
              onClick={() => setActiveDept('AGENT_OPS')}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold tracking-wide transition-all ${activeDept === 'AGENT_OPS' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30' : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300'}`}
            >
              ⚡ Agent Operations
            </button>
            <button 
              onClick={() => setActiveDept('SECURITY')}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold tracking-wide transition-all ${activeDept === 'SECURITY' ? 'bg-red-500/10 text-red-500 border border-red-500/30' : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300'}`}
            >
              🛡️ Security & Ops
            </button>
          </nav>
        </div>

        <div className="p-6 border-t border-slate-800/60">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center font-bold border border-purple-500/30">
              A
            </div>
            <div>
              <p className="text-white text-sm font-bold">{user?.full_name}</p>
              <p className="text-slate-500 text-[10px] uppercase tracking-widest">Master Admin</p>
            </div>
          </div>
          <button onClick={onLogout} className="w-full bg-slate-800/50 hover:bg-slate-800 text-slate-400 text-xs font-bold py-2.5 rounded-lg border border-slate-700/50 transition">
            Terminate Session
          </button>
        </div>
      </div>

      {/* DESKTOP UI: MAIN CONTENT AREA */}
      <div className="hidden md:block flex-1 p-8 overflow-y-auto h-screen">
        
        {/* DEPARTMENT: TREASURY */}
        {activeDept === 'TREASURY' && (
          <div className="animate-fade-in">
            <h2 className="text-3xl font-black text-white mb-6 tracking-tight">System Liquidity</h2>
            
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="bg-[#151c2c] border border-slate-800 rounded-2xl p-6 shadow-xl">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Total Deployed Float</p>
                <h3 className="text-4xl font-black text-[#2a68ff]">${loading ? '...' : systemStats.deployedFloat.toFixed(2)}</h3>
              </div>
              <div className="bg-[#151c2c] border border-slate-800 rounded-2xl p-6 shadow-xl">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Active Users</p>
                <h3 className="text-4xl font-black text-white">{loading ? '...' : systemStats.totalUsers}</h3>
              </div>
              <div className="bg-[#151c2c] border border-slate-800 rounded-2xl p-6 shadow-xl">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Agent Network</p>
                <h3 className="text-4xl font-black text-amber-500">{loading ? '...' : systemStats.totalAgents}</h3>
              </div>
            </div>

            <div className="bg-[#151c2c] border border-slate-800 rounded-2xl p-8 text-center shadow-xl">
              <span className="text-4xl mb-4 block">🏦</span>
              <h3 className="text-xl font-bold text-white mb-2">Master Treasury Vault</h3>
              <p className="text-slate-400 text-sm max-w-lg mx-auto mb-6">
                The core $1,000,000 treasury is currently operating in isolation. To view real-time bank reconciliation, the God-Mode SQL policies must be executed.
              </p>
            </div>
          </div>
        )}

        {/* DEPARTMENT: AGENT OPERATIONS */}
        {activeDept === 'AGENT_OPS' && (
          <div className="animate-fade-in">
            <h2 className="text-3xl font-black text-white mb-6 tracking-tight">Agent Fleet Manager</h2>
            
            <div className="bg-[#151c2c] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0b1121] text-slate-500 text-[10px] uppercase tracking-widest">
                    <th className="p-4 font-bold border-b border-slate-800">Agent Name & Tag</th>
                    <th className="p-4 font-bold border-b border-slate-800">Phone Number</th>
                    <th className="p-4 font-bold border-b border-slate-800">Status</th>
                    <th className="p-4 font-bold border-b border-slate-800 text-right">Liquidity Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="4" className="p-8 text-center text-slate-500">Scanning network...</td></tr>
                  ) : agentsList.length === 0 ? (
                    <tr><td colSpan="4" className="p-8 text-center text-slate-500">No agents deployed on the network.</td></tr>
                  ) : (
                    agentsList.map(agent => (
                      <tr key={agent.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-4 border-b border-slate-800/50">
                          <p className="text-white font-bold text-sm">{agent.full_name}</p>
                          <p className="text-amber-500 text-xs font-mono">@{agent.finance_tag}</p>
                        </td>
                        <td className="p-4 border-b border-slate-800/50 text-slate-400 text-sm">{agent.phone_number}</td>
                        <td className="p-4 border-b border-slate-800/50">
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2 py-1 rounded-md uppercase font-bold">
                            {agent.account_status}
                          </span>
                        </td>
                        <td className="p-4 border-b border-slate-800/50 text-right space-x-2">
                          <button onClick={() => handleMintFloat(agent.id, 500)} className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 text-xs font-bold px-3 py-1.5 rounded transition">
                            Mint $500
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* DEPARTMENT: SECURITY & OPS */}
        {activeDept === 'SECURITY' && (
          <div className="animate-fade-in">
            <h2 className="text-3xl font-black text-white mb-6 tracking-tight">Global Security Radar</h2>
            
            <form onSubmit={handleSecuritySearch} className="flex gap-4 mb-8">
              <input 
                type="text" 
                placeholder="Search by @finance_tag or Phone Number..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-[#1b2438] border border-slate-700/50 text-white rounded-xl px-6 py-4 focus:outline-none focus:border-red-500 transition font-mono"
              />
              <button type="submit" className="bg-red-600 hover:bg-red-500 text-white font-black px-8 py-4 rounded-xl transition shadow-lg shadow-red-900/20">
                LOCATE TARGET
              </button>
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
                        <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold mb-1">Escrow Locked</p>
                        <p className="text-2xl font-black text-purple-400">${searchedUser.wallets[0]?.escrow_balance.toFixed(2) || '0.00'}</p>
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