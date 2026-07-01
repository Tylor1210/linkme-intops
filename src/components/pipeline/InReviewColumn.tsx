import React from 'react';
import { type Ticket, type User } from '../../db/schema';
import { TicketCard } from '../shared/TicketCard';
import { ticketService } from '../../services/ticketService';
import { Eye, Check, X } from 'lucide-react';

interface Props {
  tickets: Ticket[];
  currentUser: User;
  onTicketClick: (id: string) => void;
  onRefresh: () => void;
  onRejectOpen: (ticket: Ticket) => void;
}

export const InReviewColumn: React.FC<Props> = ({
  tickets, currentUser, onTicketClick, onRefresh, onRejectOpen,
}) => {
  const isAdmin = currentUser.role === 'admin';
  const [expanded, setExpanded] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(() => window.innerWidth < 750);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 750);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleApprove = (ticket: Ticket) => {
    try {
      ticketService.approveTicket(ticket.id, currentUser.id);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="pipeline-column">
      <div className="pipeline-column-header">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: 'var(--accent-purple)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>In Review</span>
          {tickets.length > 0 && (
            <span className="badge badge-review text-xs" style={{ padding: '0.1rem 0.45rem' }}>{tickets.length}</span>
          )}
        </div>
        {isAdmin && tickets.length > 0 && (
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Quick actions ↓</span>
        )}
      </div>

      <div className="pipeline-column-body">
        {tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 text-center py-10 gap-2">
            <Eye size={28} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Nothing awaiting review</p>
          </div>
        ) : (
          <>
            {(() => {
              const defaultLimit = isMobile ? 1 : 4;
              return (
                <>
                  {tickets.map((t, index) => {
                    if (!expanded && index >= defaultLimit) return null;

                    return (
                      <TicketCard
                        key={t.id}
                        ticket={t}
                        currentUser={currentUser}
                        onClick={onTicketClick}
                        actions={isAdmin ? (
                          <>
                            <button
                              className="btn-approve border"
                              onClick={() => handleApprove(t)}
                              title="Approve — move to Completed Pool"
                            >
                              <Check size={12} /> Approve
                            </button>
                            <button
                              className="btn-reject border"
                              onClick={() => onRejectOpen(t)}
                              title="Reject — return to creator"
                            >
                              <X size={12} /> Reject
                            </button>
                          </>
                        ) : undefined}
                      />
                    );
                  })}

                  {tickets.length > defaultLimit && (
                    <button
                      onClick={() => setExpanded(prev => !prev)}
                      className="btn btn-secondary w-full text-xs font-semibold py-2 rounded-xl mt-1 flex items-center justify-center gap-1.5"
                      style={{
                        background: 'rgba(120, 120, 120, 0.04)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {expanded ? (
                        <>Show Less</>
                      ) : (
                        <>Show {tickets.length - defaultLimit} More Profiles</>
                      )}
                    </button>
                  )}
                </>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
};
