import React from 'react';
import { type Ticket, type User, MOCK_USERS } from '../../db/schema';
import { AlertTriangle, Link2, ExternalLink, Zap } from 'lucide-react';

interface Props {
  ticket: Ticket;
  currentUser: User;
  onClick: (id: string) => void;
  /** Optional extra actions (e.g. Approve/Reject buttons for In Review) */
  actions?: React.ReactNode;
  /** Admin-only: escalate this unclaimed ticket to high priority */
  onEscalate?: (id: string) => void;
}

export const TicketCard: React.FC<Props> = ({ ticket, currentUser, onClick, actions, onEscalate }) => {
  const isAdmin = currentUser.role === 'admin';
  const assignedUser = MOCK_USERS.find(u => u.id === ticket.assignedCreatorId);

  const fmtAge = (ts: number) => {
    const diff = Date.now() - ts;
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (d > 0) return `${d}d ago`;
    if (h > 0) return `${h}h ago`;
    return 'just now';
  };

  return (
    <div
      className="card cursor-pointer group relative"
      onClick={() => onClick(ticket.id)}
      style={{
        padding: '0.875rem',
        ...(ticket.isHighPriority && {
          borderColor: 'rgba(239, 68, 68, 0.7)',
          boxShadow: '0 0 0 1px rgba(239, 68, 68, 0.4), 0 0 14px rgba(239, 68, 68, 0.18)',
        }),
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {ticket.isHighPriority && (
            <AlertTriangle size={13} style={{ color: 'var(--accent-coral)', flexShrink: 0 }} />
          )}
          <span className="text-sm font-semibold truncate leading-tight" style={{ color: 'var(--text-primary)' }}>{ticket.title}</span>
        </div>
        <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{fmtAge(ticket.createdAt)}</span>
      </div>

      {/* Profile URL */}
      {ticket.profileUrl && (
        <div className="flex items-center gap-1.5 mb-2" onClick={e => e.stopPropagation()}>
          <Link2 size={11} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
          <a
            href={ticket.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs truncate hover:underline flex items-center gap-1"
            style={{ color: 'var(--accent-primary)' }}
          >
            {ticket.profileUrl.replace('https://', '')}
            <ExternalLink size={9} />
          </a>
        </div>
      )}

      {/* Description snippet */}
      <p className="text-xs leading-relaxed mb-3 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
        {ticket.description}
      </p>

      {/* Footer: assignee + age */}
      {isAdmin && assignedUser && (
        <div className="flex items-center gap-1.5">
          <img src={assignedUser.avatar} alt="" className="w-4 h-4 rounded-full object-cover" />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{assignedUser.name.split(' ')[0]}</span>
        </div>
      )}

      {/* Extra action slot (e.g. Approve/Reject or Escalate) */}
      {(actions || onEscalate) && (
        <div className="mt-3 pt-2 border-t flex gap-2" style={{ borderColor: 'var(--border-color)' }} onClick={e => e.stopPropagation()}>
          {onEscalate && (
            <button
              className="btn-escalate"
              onClick={() => onEscalate(ticket.id)}
              title="Escalate this ticket to high priority and move it to the top of the queue"
            >
              <Zap size={11} />
              Escalate to Priority
            </button>
          )}
          {actions}
        </div>
      )}
    </div>
  );
};
