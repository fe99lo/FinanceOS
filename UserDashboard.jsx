import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const UserDashboard = ({ user, onLogout }) => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  
  // Modal States
  const [activeModal, setActiveModal] = useState(null); // 'deposit', 'withdraw', 'send'
  const [actionMethod, setActionMethod] = useState('agent'); // 'agent', 'mpesa'
  
  // Form States
  const [targetPhone, setTargetPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchWalletData();
  }, [activeModal]); // Refresh data when a modal closes

  const fetchWalletData = async () => {
    const { data: wallet } = await supabase.from('wallets').select('balance').eq('profile_id', user.id).single();
    if (wallet) setBalance(wallet.balance);

    const { data: txs } = await supabase.from('transactions')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(10);
    if (txs) setTransactions(txs);
  };

  // --- ACTION HANDLERS (These will connect to Supabase RPCs) ---
  
  const handleSendMoney = async (e) => {
    e.preventDefault();
    setLoading(true); setMessage('');
    // Logic: Call Supabase RPC 'process_p2p_transfer'
    // It will deduct from user.id and add to targetPhone's wallet.
    setTimeout(() => {
      setMessage(`Successfully sent $${amount} to ${targetPhone}`);
      setLoading(false); setAmount(''); setTargetPhone('');
    }, 1500); // Simulated delay for UI
  };

  const handleWithdrawAgent = async (e) => {
    e.preventDefault();
    setLoading(true); setMessage('');
    // Logic: Call Supabase RPC 'process_agent_withdrawal'
    // Moves funds from User to Agent. Agent hands over physical cash.
    setTimeout(() => {
      setMessage(`Success! Agent ${targetPhone} has received the funds. Collect your cash.`);
      setLoading(false); setAmount(''); setTargetPhone('');
    }, 1500);
  };

  const handleWithdrawMpesa = async (e) => {
    e.preventDefault();
    setLoading(true); setMessage('');
    // Logic: Call Supabase RPC 'queue_mpesa_withdrawal'
    // Deducts funds, sets status to PENDING for the Admin to batch process.
    setTimeout(() => {
      setMessage(`Request queued. KES will be sent to your M-Pesa shortly.`);
      setLoading(false); setAmount('');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 pb-20">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8 pt-4">
        <div>
          <p className="text-slate-400 text-sm">Welcome back,</p>
          <h2 className="text-xl font-bold">{user.full_name}</h2>
        </div>
        <button onClick={onLogout} className="text-sm bg-slate-800 px-4 py-2 rounded-lg text-red-400 font-bold hover:bg-slate-700">Logout</button>
      </div>

      {/* BALANCE & QUICK ACTIONS CARD */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-3xl shadow-2xl mb-8">
        <p className="text-blue-200 text-sm font-semibold mb-1">Available Balance</p>
        <h1 className="text-5xl font-black tracking-tight mb-6">${balance.toFixed(2)}</h1>
        
        <div className="flex gap-3">
          <button onClick={() => { setActiveModal('send'); setMessage(''); }} className="flex-1 bg-white text-blue-900 font-bold py-3 rounded-xl shadow-lg hover:bg-slate-100">
            Send
          </button>
          <button onClick={() => { setActiveModal('deposit'); setActionMethod('agent'); setMessage(''); }} className="flex-1 bg-blue-500/30 text-white font-bold py-3 rounded-xl border border-blue-400/30 hover:bg-blue-500/50">
            Deposit
          </button>
          <button onClick={() => { setActiveModal('withdraw'); setActionMethod('agent'); setMessage(''); }} className="flex-1 bg-blue-900/50 text-white font-bold py-3 rounded-xl border border-blue-400/30 hover:bg-blue-900/70">
            Withdraw
          </button>
        </div>
      </div>

      {/* TRANSACTION HISTORY */}
      <div>
        <h3 className="text-lg font-bold mb-4 text-slate-200">Recent Activity</h3>
        <div className="bg-slate-800 rounded-3xl p-5 flex flex-col gap-5 shadow-lg">
          {transactions.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-4">No transactions yet.</p>
          ) : (
            transactions.map(tx => {
              const isIncome = tx.receiver_id === user.id;
              return (
                <div key={tx.id} className="flex justify-between items-center border-b border-slate-700 pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="font-bold text-sm text-slate-100">{tx.tx_type.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-slate-400 mt-1">{new Date(tx.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-black text-lg ${isIncome ? 'text-green-400' : 'text-slate-300'}`}>
                      {isIncome ? '+' : '-'}${tx.amount.toFixed(2)}
                    </p>
                    {tx.status === 'PENDING' && <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded-md">PENDING</span>}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* --- MODALS --- */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/90 flex items-end sm:items-center justify-center p-4 z-50">
          <div className="bg-slate-800 w-full max-w-md rounded-[2rem] p-6 shadow-2xl slide-up">
            
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black capitalize">{activeModal} Funds</h2>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 text-3xl leading-none hover:text-white">&times;</button>
            </div>

            {message && <div className="bg-green-500/20 text-green-400 p-3 rounded-xl mb-6 text-sm font-bold text-center">{message}</div>}

            {/* SEND MONEY MODAL */}
            {activeModal === 'send' && (
              <form onSubmit={handleSendMoney} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs text-slate-400 uppercase font-bold ml-1">Recipient Phone Number</label>
                  <input type="tel" required placeholder="07XX..." className="w-full mt-1 p-4 bg-slate-900 border border-slate-700 text-white rounded-2xl outline-none text-lg" value={targetPhone} onChange={e => setTargetPhone(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase font-bold ml-1">Amount (USD)</label>
                  <input type="number" required min="1" step="0.01" placeholder="$0.00" className="w-full mt-1 p-4 bg-slate-900 border border-slate-700 text-white rounded-2xl outline-none font-mono text-2xl" value={amount} onChange={e => setAmount(e.target.value)} />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold text-lg py-4 rounded-2xl mt-4 hover:bg-blue-500 disabled:opacity-50">
                  {loading ? 'Sending...' : 'Send Instantly'}
                </button>
              </form>
            )}

            {/* DEPOSIT & WITHDRAW ROUTER (Tabs) */}
            {(activeModal === 'deposit' || activeModal === 'withdraw') && (
              <>
                <div className="flex gap-2 mb-6 bg-slate-900 p-1.5 rounded-xl">
                  <button onClick={() => setActionMethod('agent')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition ${actionMethod === 'agent' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}>Agent</button>
                  <button onClick={() => setActionMethod('mpesa')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition ${actionMethod === 'mpesa' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}>M-Pesa</button>
                </div>

                {/* --- AGENT DEPOSIT --- */}
                {activeModal === 'deposit' && actionMethod === 'agent' && (
                  <div className="bg-slate-900 p-6 rounded-2xl text-center border border-slate-700">
                    <p className="text-sm text-slate-300 mb-3">Give this number to a FinanceOS Agent (e.g., The Washlab staff):</p>
                    <p className="text-3xl font-black text-white tracking-widest py-2">{user.phone_number}</p>
                    <p className="text-xs text-green-400 mt-4 font-bold bg-green-400/10 inline-block px-3 py-1 rounded-full">Funds reflect instantly.</p>
                  </div>
                )}

                {/* --- MPESA DEPOSIT --- */}
                {activeModal === 'deposit' && actionMethod === 'mpesa' && (
                  <div className="text-center p-6 bg-slate-900 rounded-2xl border border-slate-700">
                    <p className="text-slate-300 mb-4 font-medium">To load your wallet via M-Pesa, go to Paybill:</p>
                    <div className="bg-slate-800 p-4 rounded-xl mb-4">
                      <p className="text-sm text-slate-400">Business Number</p>
                      <p className="text-xl font-bold text-white">123456 (KejaLink)</p>
                      <div className="h-px bg-slate-700 my-2"></div>
                      <p className="text-sm text-slate-400">Account Number</p>
                      <p className="text-xl font-bold text-white">{user.phone_number}</p>
                    </div>
                  </div>
                )}

                {/* --- AGENT WITHDRAWAL --- */}
                {activeModal === 'withdraw' && actionMethod === 'agent' && (
                  <form onSubmit={handleWithdrawAgent} className="flex flex-col gap-4">
                    <div>
                      <label className="text-xs text-slate-400 uppercase font-bold ml-1">Agent Phone / Till Number</label>
                      <input type="tel" required placeholder="07XX..." className="w-full mt-1 p-4 bg-slate-900 border border-slate-700 text-white rounded-2xl outline-none text-lg" value={targetPhone} onChange={e => setTargetPhone(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 uppercase font-bold ml-1">Amount to Withdraw (USD)</label>
                      <input type="number" required min="1" max={balance} step="0.01" placeholder="$0.00" className="w-full mt-1 p-4 bg-slate-900 border border-slate-700 text-white rounded-2xl outline-none font-mono text-2xl" value={amount} onChange={e => setAmount(e.target.value)} />
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-yellow-600 text-black font-black text-lg py-4 rounded-2xl mt-4 hover:bg-yellow-500 disabled:opacity-50">
                      {loading ? 'Processing...' : 'Send to Agent'}
                    </button>
                  </form>
                )}

                {/* --- MPESA WITHDRAWAL (The Inclusive Fee Model) --- */}
                {activeModal === 'withdraw' && actionMethod === 'mpesa' && (
                  <form onSubmit={handleWithdrawMpesa} className="flex flex-col gap-4">
                    <div>
                      <label className="text-xs text-slate-400 uppercase font-bold ml-1">Amount to Withdraw (USD)</label>
                      <input type="number" required min="1" max={balance} step="0.01" placeholder="$0.00" className="w-full mt-1 p-4 bg-slate-900 border border-slate-700 text-white rounded-2xl outline-none font-mono text-2xl" value={amount} onChange={e => setAmount(e.target.value)} />
                    </div>
                    
                    {/* The Transparent Fee Calculator */}
                    {amount && (
                      <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 text-sm">
                        <div className="flex justify-between mb-1">
                          <span className="text-slate-400">Withdrawal Amount:</span>
                          <span className="text-white font-mono">${parseFloat(amount).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between mb-2 pb-2 border-b border-slate-700">
                          <span className="text-slate-400">Network Fee:</span>
                          <span className="text-red-400 font-mono">-$0.50</span>
                        </div>
                        <div className="flex justify-between font-bold">
                          <span className="text-slate-300">You Receive (Approx):</span>
                          <span className="text-green-400 font-mono">KES {((parseFloat(amount) - 0.50) * 130).toFixed(0)}</span>
                        </div>
                      </div>
                    )}

                    <button type="submit" disabled={loading || !amount} className="w-full bg-green-600 text-white font-black text-lg py-4 rounded-2xl mt-2 hover:bg-green-500 disabled:opacity-50">
                      {loading ? 'Queuing Request...' : 'Withdraw to M-Pesa'}
                    </button>
                    <p className="text-xs text-center text-slate-400 mt-2">M-Pesa withdrawals are processed in batches daily.</p>
                  </form>
                )}
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
