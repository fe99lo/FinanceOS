import React, { useState } from 'react';
import authApi from './services/authApi.js';

export default function AuthGateway({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      let user;
      if (isLogin) {
        user = await authApi.login(phone, password);
      } else {
        user = await authApi.register(phone, fullName, password);
      }
      onAuthSuccess(user);
    } catch (err) {
      setError(err.message || "Authentication failed. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-8">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <span className="text-2xl font-black text-white">F</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">FinanceOS</h1>
          <p className="text-slate-400 text-sm mt-1">The KejaLink Financial Gateway</p>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl mb-6 text-sm text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Full Name</label>
              <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
                className="w-full mt-1 p-4 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500 transition" placeholder="John Doe" />
            </div>
          )}
          
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Phone Number</label>
            <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)}
              className="w-full mt-1 p-4 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500 transition font-mono" placeholder="07XX..." />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Secure Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="w-full mt-1 p-4 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500 transition" placeholder="••••••••" />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition shadow-lg shadow-blue-500/25 mt-2">
            {loading ? 'Processing...' : (isLogin ? 'Secure Log In' : 'Create Account')}
          </button>
        </form>

        <p className="text-center mt-6 text-slate-400 text-sm">
          {isLogin ? "New to FinanceOS? " : "Already have an account? "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-blue-400 font-bold hover:text-blue-300 transition">
            {isLogin ? "Sign Up" : "Log In"}
          </button>
        </p>
      </div>
    </div>
  );
}