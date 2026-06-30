import React from 'react';
import { type Ticket, type User } from '../../db/schema';
import { CompletedTicketCard } from '../shared/CompletedTicketCard';
import { ticketService } from '../../services/ticketService';
import { Archive, ChevronRight } from 'lucide-react';

interface Props {
  tickets: Ticket[];
  showingTodayOnly: boolean;
  currentUser: User;
  onViewDetails: (id: string) => void;
  onRecallModalOpen: (ticket: Ticket) => void;
  onRefresh: () => void;
}

export const CompletedPool: React.FC<Props> = ({
  tickets, showingTodayOnly, currentUser, onViewDetails, onRecallModalOpen, onRefresh,
}) => {
  const isAdmin = currentUser.role === 'admin';

  const handleMinorTweak = (ticket: Ticket) => {
    try {
      ticketService.recallMinorTweak(ticket.id, currentUser.id);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (tickets.length === 0) return null;

  return (
    <div className="completed-pool-section">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Archive size={16} style={{ color: 'var(--accent-mint)' }} />
          <h3 className="font-display font-semibold text-sm" style={{ color: 'var(--text-secondary)' }}>
            Completed Pool
          </h3>
          <span className="badge badge-approved text-xs">{tickets.length}</span>
        </div>
        <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
          <ChevronRight size={12} />
          <span className="font-medium" style={{ color: showingTodayOnly ? 'var(--accent-mint)' : 'var(--text-muted)' }}>
            {showingTodayOnly ? "Completed Today" : "Recent Fallback (Last 3)"}
          </span>
          <span>· Scroll to browse</span>
          {isAdmin && <span>· Admin: use Minor/Major Tweak to recall</span>}
        </div>
      </div>

      {/* Horizontal scrollable row */}
      <div
        className="flex gap-4 overflow-x-auto pb-3"
        style={{ scrollbarWidth: 'thin' }}
      >
        {tickets.map(t => (
          <CompletedTicketCard
            key={t.id}
            ticket={t}
            currentUser={currentUser}
            onViewDetails={onViewDetails}
            onMinorTweak={handleMinorTweak}
            onMajorTweak={onRecallModalOpen}
          />
        ))}
      </div>
    </div>
  );
};
