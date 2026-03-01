import React, { useState } from 'react';
import authApi from '../services/authApi.js';

export default function AuthGateway({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
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
        // Login now uses Email, matching your prototype!
        user = await authApi.login(email, password);
      } else {
        // Registration grabs everything we need for the database
        user = await authApi.register(email, phone, fullName, password);
      }
      onAuthSuccess(user);
    } catch (err) {
      setError(err.message || "Authentication failed. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0b1121] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-[400px] bg-[#151c2c] border border-slate-800/60 rounded-xl p-8 shadow-2xl">
        
        <div className="text-center mb-8 pt-2">
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">FinanceOS</h1>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Secure Gateway
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {!isLogin && (
            <>
              <input 
                type="text" 
                required 
                value={fullName} 
                onChange={e => setFullName(e.target.value)}
                className="w-full bg-[#1b2438] text-white border border-slate-700/50 rounded-lg px-4 py-3.5 focus:outline-none focus:border-[#2a68ff] transition-colors text-sm placeholder:text-slate-500" 
                placeholder="Full Name" 
              />
              <input 
                type="tel" 
                required 
                value={phone} 
                onChange={e => setPhone(e.target.value)}
                className="w-full bg-[#1b2438] text-white border border-slate-700/50 rounded-lg px-4 py-3.5 focus:outline-none focus:border-[#2a68ff] transition-colors text-sm placeholder:text-slate-500" 
                placeholder="Phone Number" 
              />
            </>
          )}
          
          <input 
            type="email" 
            required 
            value={email} 
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-[#1b2438] text-white border border-slate-700/50 rounded-lg px-4 py-3.5 focus:outline-none focus:border-[#2a68ff] transition-colors text-sm placeholder:text-slate-500" 
            placeholder="Email Address" 
          />

          <input 
            type="password" 
            required 
            value={password} 
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-[#1b2438] text-white border border-slate-700/50 rounded-lg px-4 py-3.5 focus:outline-none focus:border-[#2a68ff] transition-colors text-sm placeholder:text-slate-500" 
            placeholder="Password" 
          />

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-[#2a68ff] hover:bg-[#2055db] text-white font-semibold rounded-lg py-3.5 mt-2 transition-colors text-sm shadow-lg shadow-blue-500/20"
          >
            {loading ? 'Processing...' : (isLogin ? 'Secure Login' : 'Create Account')}
          </button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-3">
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            type="button"
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            {isLogin ? "Create new account" : "Back to Secure Login"}
          </button>
          
          {isLogin && (
            <button type="button" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
              Forgot Password?
            </button>
          )}
        </div>

      </div>
    </div>
  );
}