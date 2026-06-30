import React from 'react';
import { type User } from '../../db/schema';
import { RoleSwitcher } from '../shared/RoleSwitcher';
import { BarChart3, Layout, Sun, Moon } from 'lucide-react';

interface Props {
  currentUser: User;
  activeTab: 'board' | 'stats';
  onTabChange: (tab: 'board' | 'stats') => void;
  onUserChange: (user: User) => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
}

export const AppHeader: React.FC<Props> = ({
  currentUser,
  activeTab,
  onTabChange,
  onUserChange,
  theme,
  onThemeToggle,
}) => {
  return (
    <header className="app-header">
      {/* Top Row: Brand + Mobile Switchers */}
      <div className="flex items-center justify-between md:justify-start gap-4 w-full md:w-auto">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center font-display font-black text-sm"
            style={{ background: 'var(--brand-gradient)' }}
          >
            <span style={{ color: '#ffffff' }}>L</span>
          </div>
          <div>
            <h1 className="font-display font-bold text-base leading-none">Linkme</h1>
            <p className="text-xs leading-none mt-0.5" style={{ color: 'var(--text-muted)' }}>Profile Ops</p>
          </div>
        </div>

        {/* Switchers visible on MOBILE ONLY */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={onThemeToggle}
            className="p-2 rounded-xl border transition-all duration-150"
            style={{
              background: 'rgba(120, 120, 120, 0.08)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-secondary)',
            }}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
          </button>
          <RoleSwitcher currentUser={currentUser} onUserChange={onUserChange} />
        </div>
      </div>

      {/* Middle Row (Mobile) / Left Nav (Desktop) */}
      <nav className="flex items-center gap-1 w-full md:w-auto justify-between md:justify-start border-t md:border-t-0 pt-2.5 md:pt-0" style={{ borderColor: 'var(--border-color)' }}>
        <button
          onClick={() => onTabChange('board')}
          className={`tab-btn flex items-center justify-center gap-1.5 flex-1 md:flex-initial ${activeTab === 'board' ? 'active' : ''}`}
        >
          <Layout size={13} /> Pipeline
        </button>
        <button
          onClick={() => onTabChange('stats')}
          className={`tab-btn flex items-center justify-center gap-1.5 flex-1 md:flex-initial ${activeTab === 'stats' ? 'active' : ''}`}
        >
          <BarChart3 size={13} /> Analytics
        </button>
      </nav>

      {/* Right Row: Desktop Switchers ONLY */}
      <div className="hidden md:flex items-center gap-3">
        <button
          onClick={onThemeToggle}
          className="p-2 rounded-xl border transition-all duration-150"
          style={{
            background: 'rgba(120, 120, 120, 0.08)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-secondary)',
          }}
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>

        <RoleSwitcher currentUser={currentUser} onUserChange={onUserChange} />
      </div>
    </header>
  );
};
