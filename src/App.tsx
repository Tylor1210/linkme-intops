import { useState, useEffect } from 'react';
import { type User, MOCK_USERS } from './db/schema';
import { AppHeader } from './components/layout/AppHeader';
import { TwoLayerDashboard } from './components/layout/TwoLayerDashboard';

function App() {
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USERS[0]); // Default: Admin
  const [activeTab, setActiveTab] = useState<'board' | 'stats'>('board');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('workflow_theme');
    return saved === 'dark' ? 'dark' : 'light'; // Light mode is default
  });

  // Sync theme with document class list
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    localStorage.setItem('workflow_theme', theme);
  }, [theme]);

  // Reset tab to board when switching to non-admin user
  const handleUserChange = (user: User) => {
    setCurrentUser(user);
    if (user.role !== 'admin') setActiveTab('board');
  };

  const handleThemeToggle = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className={`app-shell ${theme === 'dark' ? 'dark' : ''}`}>
      {/* Background glow orbs */}
      <div className="glow-orb glow-orb-1" />
      <div className="glow-orb glow-orb-2" />

      {/* Sticky header */}
      <AppHeader
        currentUser={currentUser}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onUserChange={handleUserChange}
        theme={theme}
        onThemeToggle={handleThemeToggle}
      />

      {/* Main scrollable content */}
      <main className="flex-1 relative overflow-y-auto">
        <div className="max-w-screen-xl mx-auto px-6 py-6 pb-16">
          <TwoLayerDashboard
            key={currentUser.id}
            currentUser={currentUser}
            activeTab={activeTab}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
