import React, { useState, useMemo } from 'react';
import { type Ticket, MOCK_USERS } from '../../db/schema';
import { BarChart3, Calendar, CheckCircle2, Clock, TrendingUp, Users } from 'lucide-react';

type FilterType = 'today' | 'week' | 'month' | 'all' | 'custom';

interface Props {
  tickets: Ticket[];
}

const fmtDuration = (ms: number) => {
  if (ms <= 0) return '—';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms / 60000) % 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const getRange = (filter: FilterType, customStart: string, customEnd: string): [number, number] => {
  const now = Date.now();
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  switch (filter) {
    case 'today': return [todayStart.getTime(), now];
    case 'week': return [now - 7 * 24 * 3600000, now];
    case 'month': return [now - 30 * 24 * 3600000, now];
    case 'all': return [0, now];
    case 'custom': {
      const start = customStart ? new Date(customStart).getTime() : 0;
      const end = customEnd ? new Date(customEnd + 'T23:59:59').getTime() : now;
      return [start, end];
    }
  }
};

export const StatsTab: React.FC<Props> = ({ tickets }) => {
  const [filter, setFilter] = useState<FilterType>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const [rangeStart, rangeEnd] = useMemo(
    () => getRange(filter, customStart, customEnd),
    [filter, customStart, customEnd]
  );

  const inRange = (ts: number | null) => ts !== null && ts >= rangeStart && ts <= rangeEnd;

  const completedInRange = useMemo(
    () => tickets.filter(t => t.stage === 'approved' && inRange(t.approvedAt)),
    [tickets, rangeStart, rangeEnd]
  );

  const claimedInRange = useMemo(
    () => tickets.filter(t => inRange(t.claimedAt)),
    [tickets, rangeStart, rangeEnd]
  );

  const avgDuration = useMemo(() => {
    const withTime = completedInRange.filter(t => t.totalInProgressTime > 0);
    if (withTime.length === 0) return 0;
    return withTime.reduce((sum, t) => sum + t.totalInProgressTime, 0) / withTime.length;
  }, [completedInRange]);

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
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Admin-only · Performance metrics</p>
        </div>
      </div>

      {/* Date Filters */}
      <div className="flex flex-col gap-3">
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
        {filter === 'custom' && (
          <div className="flex items-center gap-3 p-4 rounded-xl border" style={{ borderColor: 'var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
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
              <Users size={15} style={{ color: 'var(--accent-primary)' }} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-display font-bold" style={{ color: 'var(--accent-primary)' }}>
              {claimedInRange.length}
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
              {completedInRange.length}
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
              {fmtDuration(avgDuration)}
            </span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Mean active work time per profile</p>
        </div>
      </div>

      {/* Completion rate bar */}
      {claimedInRange.length > 0 && (
        <div className="p-5 rounded-2xl border" style={{ borderColor: 'var(--border-color)', background: 'rgba(120, 120, 120, 0.02)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={15} style={{ color: 'var(--accent-primary)' }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Completion Rate</span>
            </div>
            <span className="text-sm font-bold" style={{ color: 'var(--accent-mint)' }}>
              {Math.round((completedInRange.length / claimedInRange.length) * 100)}%
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(120, 120, 120, 0.08)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.round((completedInRange.length / claimedInRange.length) * 100)}%`,
                background: 'linear-gradient(90deg, var(--accent-mint), var(--accent-primary))',
              }}
            />
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            {completedInRange.length} completed out of {claimedInRange.length} claimed
          </p>
        </div>
      )}

      {/* Completed tickets table */}
      {completedInRange.length > 0 && (
        <div>
          <h3 className="font-display font-semibold text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
            Completed Profiles ({completedInRange.length})
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
                {completedInRange.map((t, i) => {
                  const creator = MOCK_USERS.find((u) => u.id === t.assignedCreatorId);
                  return (
                    <tr key={t.id} style={{ borderBottom: i < completedInRange.length - 1 ? '1px solid var(--border-color)' : 'none', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                      <td className="px-4 py-3">
                        <p className="font-medium truncate max-w-xs" style={{ color: 'var(--text-primary)' }}>{t.title}</p>
                        {t.profileUrl && (
                          <a href={t.profileUrl} target="_blank" rel="noopener noreferrer" className="text-xs hover:underline" style={{ color: 'var(--accent-primary)' }}>
                            {t.profileUrl.replace('https://', '')}
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {creator && (
                          <div className="flex items-center gap-2">
                            <img src={creator.avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                            <span style={{ color: 'var(--text-secondary)' }}>{creator.name}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium" style={{ color: 'var(--accent-purple)' }}>
                        {fmtDuration(t.totalInProgressTime)}
                      </td>
                      <td className="px-4 py-3 text-right text-xs" style={{ color: 'var(--text-muted)' }}>
                        {t.approvedAt ? new Date(t.approvedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {completedInRange.length === 0 && (
        <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
          <BarChart3 size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No completed profiles in this date range.</p>
        </div>
      )}
    </div>
  );
};
