import React from 'react';
import { type Ticket, type User } from '../../db/schema';
import { TicketCard } from '../shared/TicketCard';
import { CreatorStackView } from '../creator/CreatorStackView';
import { Plus, Inbox, AlertTriangle } from 'lucide-react';

interface Props {
  tickets: Ticket[];      // For Admin: all unclaimed tickets (sorted chronologically)
  queue: Ticket[];        // For Creator: priority-sorted queue
  currentUser: User;
  hasHighPriority: boolean;
  onTicketClick: (id: string) => void;
  onClaimTop: () => void;
  onCreateNew: () => void;
}

export const UnclaimedColumn: React.FC<Props> = ({
  tickets, queue, currentUser, hasHighPriority, onTicketClick, onClaimTop, onCreateNew,
}) => {
  const isAdmin = currentUser.role === 'admin';
  const count = isAdmin ? tickets.length : queue.length;

  return (
    <div className={`pipeline-column flex flex-col ${hasHighPriority ? 'column-high-priority' : ''}`}>

      {/* High-priority alert banner */}
      {hasHighPriority && (
        <div className="high-priority-banner">
          <AlertTriangle size={13} style={{ color: 'var(--accent-coral)', flexShrink: 0 }} />
          <span className="text-xs font-bold tracking-wide" style={{ color: 'var(--accent-coral)' }}>
            HIGH PRIORITY TICKET IS ACTIVE!
          </span>
        </div>
      )}

      {/* Column header */}
      <div className="pipeline-column-header">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: 'var(--accent-orange)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Unclaimed Pool</span>
          {count > 0 && (
            <span className="badge badge-unclaimed text-xs" style={{ padding: '0.1rem 0.45rem' }}>{count}</span>
          )}
        </div>
        {isAdmin && (
          <button onClick={onCreateNew} className="btn btn-primary btn-xs gap-1">
            <Plus size={12} /> New
          </button>
        )}
      </div>

      {/* Column body */}
      {isAdmin ? (
        <div className="pipeline-column-body">
          {tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 text-center py-10 gap-2">
              <Inbox size={28} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No unclaimed profiles</p>
            </div>
          ) : (
            tickets.map(t => (
              <TicketCard
                key={t.id}
                ticket={t}
                currentUser={currentUser}
                onClick={onTicketClick}
              />
            ))
          )}
        </div>
      ) : (
        /* Creator sees the strict stack view */
        <CreatorStackView
          queue={queue}
          onClaimTop={onClaimTop}
        />
      )}
    </div>
  );
};
