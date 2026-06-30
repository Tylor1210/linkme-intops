import React, { useState, useMemo } from 'react';
import { type User } from '../../db/schema';
import { ticketService } from '../../services/ticketService';
import { BarChart3, Calendar, CheckCircle2, Clock, TrendingUp } from 'lucide-react';

type FilterType = 'today' | 'week' | 'month' | 'all' | 'custom';

interface Props {
  currentUser: User;
}

const fmtDuration = (ms: number) => {
  if (ms <= 0) return '—';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms / 60000) % 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

export const StatsTab: React.FC<Props> = ({ currentUser }) => {
  const [filter, setFilter] = useState<FilterType>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [selectedCreatorId, setSelectedCreatorId] = useState<string>('all');

  const isAdmin = currentUser.role === 'admin';

  // Securely request pre-computed, RBAC-sanitized statistics from the service layer
  const stats = useMemo(() => {
    return ticketService.getStats(
      currentUser,
      selectedCreatorId,
      filter,
      customStart,
      customEnd
    );
  }, [currentUser, selectedCreatorId, filter, customStart, customEnd]);

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'all', label: 'All Time' },
    { key: 'custom', label: 'Custom Range' },
  ];

  return (
    <div className="flex flex-col gap-8 py-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255, 0, 127, 0.08)', border: '1px solid rgba(255, 0, 127, 0.2)' }}>
          <BarChart3 size={20} style={{ color: 'var(--accent-primary)' }} />
        </div>
        <div>
          <h2 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>Analytics Dashboard</h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {isAdmin ? 'Admin Performance Control' : `Personal Performance · ${currentUser.name}`}
          </p>
        </div>
      </div>

      {/* Date & Creator Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`tab-btn ${filter === f.key ? 'active' : ''}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Creator:</span>
              <select
                value={selectedCreatorId}
                onChange={e => setSelectedCreatorId(e.target.value)}
                className="form-select text-xs py-1 px-3 rounded-lg"
                style={{ width: 'auto', padding: '0.4rem 2rem 0.4rem 1rem', background: 'rgba(120, 120, 120, 0.04)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              >
                <option value="all">All Creators</option>
                <option value="creator-a">Alex Rivera</option>
                <option value="creator-b">Jordan Lee</option>
                <option value="creator-c">Taylor Kim</option>
              </select>
            </div>
          )}
        </div>
        {filter === 'custom' && (
          <div className="flex items-center gap-3 p-4 rounded-xl border" style={{ borderColor: 'var(--border-color)', background: 'rgba(120, 120, 120, 0.02)' }}>
            <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
            <div className="flex items-center gap-2">
              <label className="text-xs" style={{ color: 'var(--text-muted)' }}>From:</label>
              <input type="date" className="form-input text-sm" style={{ width: 'auto', padding: '0.35rem 0.6rem' }}
                value={customStart} onChange={e => setCustomStart(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs" style={{ color: 'var(--text-muted)' }}>To:</label>
              <input type="date" className="form-input text-sm" style={{ width: 'auto', padding: '0.35rem 0.6rem' }}
                value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
            </div>
          </div>
        )}
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Total Claimed */}
        <div className="stat-card flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Profiles Claimed</span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255, 0, 127, 0.08)' }}>
              <Clock size={15} style={{ color: 'var(--accent-primary)' }} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-display font-bold" style={{ color: 'var(--accent-primary)' }}>
              {stats.claimedCount}
            </span>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>tickets</span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Profiles that entered In Progress</p>
        </div>

        {/* Total Completed */}
        <div className="stat-card flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Profiles Completed</span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,245,160,0.1)' }}>
              <CheckCircle2 size={15} style={{ color: 'var(--accent-mint)' }} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-display font-bold" style={{ color: 'var(--accent-mint)' }}>
              {stats.completedCount}
            </span>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>tickets</span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Profiles approved in this period</p>
        </div>

        {/* Avg Work Duration */}
        <div className="stat-card flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Avg Work Duration</span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(161,140,209,0.1)' }}>
              <Clock size={15} style={{ color: 'var(--accent-purple)' }} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-display font-bold" style={{ color: 'var(--accent-purple)' }}>
              {fmtDuration(stats.avgWorkDurationMs)}
            </span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Mean active work time per profile</p>
        </div>
      </div>

      {/* Completion rate bar */}
      {stats.claimedCount > 0 && (
        <div className="p-5 rounded-2xl border" style={{ borderColor: 'var(--border-color)', background: 'rgba(120, 120, 120, 0.02)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={15} style={{ color: 'var(--accent-primary)' }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Completion Rate</span>
            </div>
            <span className="text-sm font-bold" style={{ color: 'var(--accent-mint)' }}>
              {Math.round((stats.completedCount / stats.claimedCount) * 100)}%
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(120, 120, 120, 0.08)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.round((stats.completedCount / stats.claimedCount) * 100)}%`,
                background: 'linear-gradient(90deg, var(--accent-mint), var(--accent-primary))',
              }}
            />
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            {stats.completedCount} completed out of {stats.claimedCount} claimed
          </p>
        </div>
      )}

      {/* Completed tickets table */}
      {stats.completedTickets.length > 0 && (
        <div>
          <h3 className="font-display font-semibold text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
            Completed Profiles ({stats.completedTickets.length})
          </h3>
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-color)' }}>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Profile</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Creator</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Work Time</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Approved</th>
                </tr>
              </thead>
              <tbody>
                {stats.completedTickets.map((t, i) => (
                  <tr key={t.id} style={{ borderBottom: i < stats.completedTickets.length - 1 ? '1px solid var(--border-color)' : 'none', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                    <td className="px-4 py-3">
                      <p className="font-medium truncate max-w-xs" style={{ color: 'var(--text-primary)' }}>{t.title}</p>
                      {t.profileUrl && (
                        <a href={t.profileUrl} target="_blank" rel="noopener noreferrer" className="text-xs hover:underline" style={{ color: 'var(--accent-primary)' }}>
                          {t.profileUrl.replace('https://', '')}
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {t.creatorAvatar && <img src={t.creatorAvatar} alt="" className="w-5 h-5 rounded-full object-cover" />}
                        <span style={{ color: 'var(--text-secondary)' }}>{t.creatorName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium" style={{ color: 'var(--accent-purple)' }}>
                      {t.formattedWorkTime}
                    </td>
                    <td className="px-4 py-3 text-right text-xs" style={{ color: 'var(--text-muted)' }}>
                      {t.formattedApprovedAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {stats.completedTickets.length === 0 && (
        <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
          <BarChart3 size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No completed profiles in this date range.</p>
        </div>
      )}
    </div>
  );
};
