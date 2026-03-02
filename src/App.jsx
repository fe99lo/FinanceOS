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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserProfile(session.user.id);
      else setIsInitializing(false);
    });

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

  // THE FIX: Added a "retry" mechanism. If the database trigger takes a millisecond 
  // too long to create the profile, the app will try 3 more times before giving up.
  const fetchUserProfile = async (authId, retries = 3) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_uid', authId)
        .single();
        
      if (error) {
        // PGRST116 means "No rows found". If we get this, the trigger is still running.
        if (error.code === 'PGRST116' && retries > 0) {
          console.log(`Profile generating... Retrying in 500ms...`);
          setTimeout(() => fetchUserProfile(authId, retries - 1), 500);
          return;
        }
        throw error;
      }
      
      setDbProfile(data);
      setIsInitializing(false);
      
    } catch (err) {
      console.error("Profile fetch error:", err.message);
      setIsInitializing(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#0b1121] flex items-center justify-center">
        <div className="text-[#2a68ff] font-bold tracking-widest animate-pulse">
          SECURING CONNECTION...
        </div>
      </div>
    );
  }

  if (!session || !dbProfile) {
    return <AuthGateway onAuthSuccess={() => {}} />; 
  }

  // ROUTING ENGINE
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