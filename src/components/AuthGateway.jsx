import React, { useState } from 'react';
import { supabase } from '../supabaseClient.js';

export default function AuthGateway({ onAuthSuccess }) {
  // The Gen-2 State Engine
  const [view, setView] = useState('LOGIN'); // 'LOGIN', 'REGISTER', 'FORGOT_PASSWORD'
  
  // Form State
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState(''); 
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(''); 
  
  // UI Feedback State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState(''); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); 
    setError('');
    setMessage('');

    try {
      if (view === 'REGISTER') {
        // 1. Native Supabase Sign Up (Tag generation happens in the database!)
        const { data, error } = await supabase.auth.signUp({
          email: email,
          password: password,
          options: {
            data: {
              full_name: fullName,
              phone_number: phone,
              role: 'USER'
            }
          }
        });
        
        if (error) throw error;
        
        if (data.session) {
          onAuthSuccess(data.user);
        } else {
          setMessage("Account created! Please check your email to verify.");
        }

      } else if (view === 'LOGIN') {
        // 2. Native Supabase Sign In
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });
        
        if (error) throw error;
        onAuthSuccess(data.user);

      } else if (view === 'FORGOT_PASSWORD') {
        // 3. Native Supabase Password Reset
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        
        if (error) throw error;
        setMessage("Secure recovery link sent! Please check your inbox.");
      }
    } catch (err) {
      setError(err.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1121] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-[400px] bg-[#151c2c] border border-slate-800/60 rounded-xl p-8 shadow-2xl">
        
        {/* HEADER */}
        <div className="text-center mb-8 pt-2">
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">FinanceOS</h1>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            {view === 'FORGOT_PASSWORD' ? 'Account Recovery' : 'Secure Gateway'}
          </p>
        </div>

        {/* DYNAMIC ALERTS */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg mb-6 text-sm text-center">
            {error}
          </div>
        )}
        {message && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-lg mb-6 text-sm text-center">
            {message}
          </div>
        )}

        {/* SECURE FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {view === 'REGISTER' && (
            <>
              <input 
                type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
                className="w-full bg-[#1b2438] text-white border border-slate-700/50 rounded-lg px-4 py-3.5 focus:outline-none focus:border-[#2a68ff] transition-colors text-sm placeholder:text-slate-500" 
                placeholder="Full Name" 
              />
              <input 
                type="tel" required value={phone} onChange={e => setPhone(e.target.value)}
                className="w-full bg-[#1b2438] text-white border border-slate-700/50 rounded-lg px-4 py-3.5 focus:outline-none focus:border-[#2a68ff] transition-colors text-sm placeholder:text-slate-500" 
                placeholder="Phone Number (e.g. 07...)" 
              />
            </>
          )}
          
          <input 
            type="email" required value={email} onChange={e => setEmail(e.target.value)}
            className="w-full bg-[#1b2438] text-white border border-slate-700/50 rounded-lg px-4 py-3.5 focus:outline-none focus:border-[#2a68ff] transition-colors text-sm placeholder:text-slate-500" 
            placeholder="Email Address" 
          />

          {view !== 'FORGOT_PASSWORD' && (
            <input 
              type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-[#1b2438] text-white border border-slate-700/50 rounded-lg px-4 py-3.5 focus:outline-none focus:border-[#2a68ff] transition-colors text-sm placeholder:text-slate-500" 
              placeholder="Password" 
            />
          )}

          <button 
            type="submit" disabled={loading} 
            className="w-full bg-[#2a68ff] hover:bg-[#2055db] text-white font-semibold rounded-lg py-3.5 mt-2 transition-colors text-sm shadow-lg shadow-blue-500/20"
          >
            {loading ? 'Processing...' : 
              view === 'LOGIN' ? 'Secure Login' : 
              view === 'REGISTER' ? 'Create Account' : 
              'Send Recovery Link'}
          </button>
        </form>

        {/* NAVIGATION LINKS */}
        <div className="mt-6 flex flex-col items-center gap-3">
          {view === 'LOGIN' ? (
            <>
              <button onClick={() => { setView('REGISTER'); setError(''); setMessage(''); }} type="button" className="text-sm text-slate-400 hover:text-white transition-colors">
                Create new account
              </button>
              <button onClick={() => { setView('FORGOT_PASSWORD'); setError(''); setMessage(''); }} type="button" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
                Forgot Password?
              </button>
            </>
          ) : (
            <button onClick={() => { setView('LOGIN'); setError(''); setMessage(''); }} type="button" className="text-sm text-slate-400 hover:text-white transition-colors">
              ← Back to Secure Login
            </button>
          )}
        </div>

      </div>
    </div>
  );
}