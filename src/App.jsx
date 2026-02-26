// src/App.jsx
import React, { useState } from 'react';
import AuthGateway from './components/AuthGateway.jsx';
import UserDashboard from './components/UserDashboard.jsx';
import AgentDashboard from './components/AgentDashboard.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  if (!currentUser) {
    // If not logged in, show the front door
    return <AuthGateway onAuthSuccess={(user) => setCurrentUser(user)} />;
  }

  // The Traffic Cop: Role-Based Routing
  switch (currentUser.role) {
    case 'ADMIN':
      return <AdminDashboard user={currentUser} onLogout={() => setCurrentUser(null)} />;
    case 'AGENT':
      return <AgentDashboard user={currentUser} onLogout={() => setCurrentUser(null)} />;
    case 'USER':
    default:
      return <UserDashboard user={currentUser} onLogout={() => setCurrentUser(null)} />;
  }
}

export default App;
