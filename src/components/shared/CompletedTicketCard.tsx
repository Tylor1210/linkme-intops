import React from 'react';
import { type Ticket, type User, MOCK_USERS } from '../../db/schema';
import { CheckCircle, RotateCcw, RefreshCw, Link2, ExternalLink } from 'lucide-react';

interface Props {
  ticket: Ticket;
  currentUser: User;
  onViewDetails: (id: string) => void;
  onMinorTweak: (ticket: Ticket) => void;
  onMajorTweak: (ticket: Ticket) => void;
}

export const CompletedTicketCard: React.FC<Props> = ({
  ticket, currentUser, onViewDetails, onMinorTweak, onMajorTweak,
}) => {
  const isAdmin = currentUser.role === 'admin';
  const creator = MOCK_USERS.find(u => u.id === ticket.assignedCreatorId);

  const fmtDuration = (ms: number) => {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms / 60000) % 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m`;
    return '<1m';
  };

  const fmtDate = (ts: number | null) => {
    if (!ts) return '—';
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div className="completed-card flex flex-col gap-3 cursor-pointer group" onClick={() => onViewDetails(ticket.id)}>
      {/* Approved badge */}
      <div className="flex items-center justify-between">
        <span className="badge badge-approved text-xs">
          <CheckCircle size={10} /> Completed
        </span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{fmtDate(ticket.approvedAt)}</span>
      </div>

      {/* Title */}
      <h4 className="text-sm font-semibold leading-tight line-clamp-2" style={{ color: 'var(--text-primary)' }}>{ticket.title}</h4>

      {/* Profile URL */}
      {ticket.profileUrl && (
        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
          <Link2 size={10} style={{ color: 'var(--accent-mint)', flexShrink: 0 }} />
          <a href={ticket.profileUrl} target="_blank" rel="noopener noreferrer"
            className="text-xs truncate hover:underline flex items-center gap-1"
            style={{ color: 'var(--accent-mint)' }}>
            {ticket.profileUrl.replace('https://', '')}
            <ExternalLink size={8} />
          </a>
        </div>
      )}

      {/* Stats row */}
      <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
        {creator && (
          <div className="flex items-center gap-1">
            <img src={creator.avatar} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />
            <span>{creator.name.split(' ')[0]}</span>
          </div>
        )}
        {ticket.totalInProgressTime > 0 && (
          <span>{fmtDuration(ticket.totalInProgressTime)} worked</span>
        )}
      </div>

      {/* Admin Recall Actions */}
      {isAdmin && (
        <div className="flex gap-2 mt-auto pt-2 border-t" style={{ borderColor: 'rgba(0,245,160,0.15)' }} onClick={e => e.stopPropagation()}>
          <button
            onClick={() => onMinorTweak(ticket)}
            className="flex-1 text-xs font-semibold rounded-lg py-1.5 flex items-center justify-center gap-1 transition-all duration-150 border"
            style={{ background: 'rgba(0,242,254,0.08)', color: 'var(--accent-primary)', borderColor: 'rgba(0,242,254,0.2)' }}
            title="Minor Tweak — send back to last creator"
          >
            <RotateCcw size={11} /> Minor
          </button>
          <button
            onClick={() => onMajorTweak(ticket)}
            className="flex-1 text-xs font-semibold rounded-lg py-1.5 flex items-center justify-center gap-1 transition-all duration-150 border"
            style={{ background: 'rgba(161,140,209,0.08)', color: 'var(--accent-purple)', borderColor: 'rgba(161,140,209,0.2)' }}
            title="Major Tweak — fully reset to Unclaimed"
          >
            <RefreshCw size={11} /> Major
          </button>
        </div>
      )}
    </div>
  );
};
