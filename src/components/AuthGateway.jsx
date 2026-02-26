// src/components/AuthGateway.jsx
import React, { useState } from 'react';
import { loginUser, registerUser, requestPasswordReset, verifyAndResetPassword } from '../services/authApi.js';

const AuthGateway = ({ onAuthSuccess }) => {
  const [view, setView] = useState('login'); // 'login', 'signup', 'forgot', 'reset'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const user = await loginUser(email, password);
      onAuthSuccess(user); // Triggers the routing to User/Agent/Admin Dashboard
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const user = await registerUser(email, password, fullName, phone);
      onAuthSuccess(user);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleForgotRequest = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const generatedPin = await requestPasswordReset(email);
      // In production, an email service sends this PIN. For testing, we log it.
      console.log("PIN to email to user:", generatedPin); 
      setView('reset');
    } catch (err) {
      setError("Email not found.");
    }
    setLoading(false);
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await verifyAndResetPassword(email, pin, password);
      alert("Password reset! Please log in.");
      setView('login');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white tracking-tight">FinanceOS</h1>
          <p className="text-slate-400 text-sm mt-2">The Gateway for KejaLink Pro</p>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-lg mb-6 text-sm text-center">{error}</div>}

        {/* --- LOGIN VIEW --- */}
        {view === 'login' && (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input type="email" placeholder="Email Address" required className="p-3 bg-slate-700 text-white rounded-lg outline-none" value={email} onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" required className="p-3 bg-slate-700 text-white rounded-lg outline-none" value={password} onChange={e => setPassword(e.target.value)} />
            
            <button type="submit" disabled={loading} className="bg-blue-600 text-white font-bold py-3 rounded-lg mt-2 hover:bg-blue-500 transition">
              {loading ? 'Entering Vault...' : 'Log In'}
            </button>
            
            <div className="flex justify-between mt-4 text-sm text-slate-400">
              <button type="button" onClick={() => setView('forgot')} className="hover:text-white">Forgot Password?</button>
              <button type="button" onClick={() => setView('signup')} className="hover:text-white">Create Account</button>
            </div>
          </form>
        )}

        {/* --- SIGN UP VIEW --- */}
        {view === 'signup' && (
          <form onSubmit={handleSignUp} className="flex flex-col gap-4">
            <input type="text" placeholder="Full Name" required className="p-3 bg-slate-700 text-white rounded-lg outline-none" value={fullName} onChange={e => setFullName(e.target.value)} />
            <input type="email" placeholder="Email Address" required className="p-3 bg-slate-700 text-white rounded-lg outline-none" value={email} onChange={e => setEmail(e.target.value)} />
            <input type="tel" placeholder="Phone Number (e.g., 07XX...)" required className="p-3 bg-slate-700 text-white rounded-lg outline-none" value={phone} onChange={e => setPhone(e.target.value)} />
            <input type="password" placeholder="Create Password" required className="p-3 bg-slate-700 text-white rounded-lg outline-none" value={password} onChange={e => setPassword(e.target.value)} />
            
            <button type="submit" disabled={loading} className="bg-green-600 text-white font-bold py-3 rounded-lg mt-2 hover:bg-green-500 transition">
              {loading ? 'Creating Account...' : 'Join & Claim Bonus'}
            </button>
            
            <p className="text-center mt-4 text-sm text-slate-400">
              Already have an account? <button type="button" onClick={() => setView('login')} className="text-white hover:underline">Log In</button>
            </p>
          </form>
        )}

        {/* --- FORGOT PASSWORD VIEW --- */}
        {view === 'forgot' && (
          <form onSubmit={handleForgotRequest} className="flex flex-col gap-4">
            <p className="text-slate-300 text-sm text-center mb-2">Enter your email to receive a 6-digit recovery PIN.</p>
            <input type="email" placeholder="Email Address" required className="p-3 bg-slate-700 text-white rounded-lg outline-none" value={email} onChange={e => setEmail(e.target.value)} />
            
            <button type="submit" disabled={loading} className="bg-blue-600 text-white font-bold py-3 rounded-lg mt-2 hover:bg-blue-500 transition">
              {loading ? 'Sending PIN...' : 'Send PIN'}
            </button>
            
            <button type="button" onClick={() => setView('login')} className="mt-4 text-sm text-slate-400 hover:text-white">Back to Login</button>
          </form>
        )}

        {/* --- RESET PASSWORD VIEW --- */}
        {view === 'reset' && (
          <form onSubmit={handlePasswordReset} className="flex flex-col gap-4">
            <p className="text-slate-300 text-sm text-center mb-2">Check your email for the 6-digit PIN.</p>
            <input type="text" placeholder="6-Digit PIN" required className="p-3 bg-slate-700 text-white rounded-lg outline-none tracking-widest text-center text-lg" value={pin} onChange={e => setPin(e.target.value)} />
            <input type="password" placeholder="New Password" required className="p-3 bg-slate-700 text-white rounded-lg outline-none" value={password} onChange={e => setPassword(e.target.value)} />
            
            <button type="submit" disabled={loading} className="bg-green-600 text-white font-bold py-3 rounded-lg mt-2 hover:bg-green-500 transition">
              {loading ? 'Verifying...' : 'Set New Password'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

export default AuthGateway;
