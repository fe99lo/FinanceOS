import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient.js';
import AuthGateway from './components/AuthGateway';
import UserDashboard from './components/UserDashboard';
import AgentDashboard from './components/AgentDashboard';
import AdminDashboard from './components/AdminDashboard';

function App() {
  const [session, setSession] = useState(null);
  const [dbProfile, setDbProfile] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // 1. Check for an existing session on the very first load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserProfile(session.user.id);
      else setIsInitializing(false);
    });

    // 2. Listen for login/logout events in real-time
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user.id);
      } else {
        setDbProfile(null);
        setIsInitializing(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 3. Fetch the true database profile to get the exact Role
  const fetchUserProfile = async (authId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_uid', authId)
        .single();
        
      if (error) throw error;
      setDbProfile(data);
    } catch (err) {
      console.error("Error fetching user profile:", err.message);
    } finally {
      setIsInitializing(false);
    }
  };

  // 4. Handle the secure logout process
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // 5. Show a sleek loading screen while checking the vault
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#0b1121] flex items-center justify-center">
        <div className="text-[#2a68ff] font-bold tracking-widest animate-pulse">
          INITIALIZING SECURE CONNECTION...
        </div>
      </div>
    );
  }

  // 6. If no active session, lock them at the Gateway
  if (!session || !dbProfile) {
    return <AuthGateway onAuthSuccess={() => {}} />; // The listener above auto-handles the success
  }

  // 7. THE SECURE ROUTING ENGINE
  switch (dbProfile.role) {
    case 'ADMIN':
      return <AdminDashboard user={dbProfile} onLogout={handleLogout} />;
    case 'AGENT':
      return <AgentDashboard user={dbProfile} onLogout={handleLogout} />;
    case 'USER':
    default:
      return <UserDashboard user={dbProfile} onLogout={handleLogout} />;
  }
}

export default App;