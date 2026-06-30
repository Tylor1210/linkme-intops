import React, { useState } from 'react';
import { type User, MOCK_USERS } from '../../db/schema';
import { ChevronDown, ShieldCheck, Pencil, RefreshCw } from 'lucide-react';
import { dbService } from '../../services/dbService';

interface Props {
  currentUser: User;
  onUserChange: (user: User) => void;
}

export const RoleSwitcher: React.FC<Props> = ({ currentUser, onUserChange }) => {
  const [open, setOpen] = useState(false);

  const handleReset = () => {
    if (confirm('Reset all data to seed defaults?')) {
      dbService.clearAll();
      window.location.reload();
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-150 text-sm"
        style={{ background: 'rgba(120, 120, 120, 0.08)', borderColor: 'var(--border-color)' }}
      >
        <img src={currentUser.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{currentUser.name}</span>
        <span className="text-xs px-1.5 py-0.5 rounded-md font-semibold" style={{
          background: currentUser.role === 'admin' ? 'rgba(161,140,209,0.15)' : 'rgba(0,242,254,0.12)',
          color: currentUser.role === 'admin' ? 'var(--accent-purple)' : 'var(--accent-primary)',
        }}>
          {currentUser.role === 'admin' ? <ShieldCheck size={10} className="inline mr-0.5" /> : <Pencil size={10} className="inline mr-0.5" />}
          {currentUser.role.toUpperCase()}
        </span>
        <ChevronDown size={14} style={{ color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s' }} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 rounded-xl border overflow-hidden shadow-2xl z-50"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', minWidth: '220px', animation: 'scaleIn 0.15s ease-out' }}
        >
          <div className="px-3 py-2 border-b text-xs font-semibold uppercase tracking-wider" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
            Switch User
          </div>
          {MOCK_USERS.map(u => (
            <button
              key={u.id}
              onClick={() => { onUserChange(u); setOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-all duration-100"
              style={{
                background: u.id === currentUser.id ? 'rgba(255,255,255,0.05)' : 'transparent',
                color: 'var(--text-primary)',
              }}
            >
              <img src={u.avatar} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="font-medium truncate">{u.name}</span>
                <span className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>{u.role}</span>
              </div>
              {u.id === currentUser.id && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--accent-mint)' }} />
              )}
            </button>
          ))}
          <div className="border-t px-3 py-2" style={{ borderColor: 'var(--border-color)' }}>
            <button onClick={handleReset} className="flex items-center gap-2 text-xs w-full py-1.5 px-2 rounded-lg transition-all" style={{ color: 'var(--accent-coral)' }}>
              <RefreshCw size={12} /> Reset All Data
            </button>
          </div>
        </div>
      )}
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </div>
  );
};
