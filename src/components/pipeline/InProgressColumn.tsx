import React from 'react';
import { type Ticket, type User } from '../../db/schema';
import { TicketCard } from '../shared/TicketCard';
import { Hammer, ShieldAlert } from 'lucide-react';

interface Props {
  tickets: Ticket[];
  currentUser: User;
  onTicketClick: (id: string) => void;
  onReclaimOpen?: (ticket: Ticket) => void;
}

export const InProgressColumn: React.FC<Props> = ({
  tickets, currentUser, onTicketClick, onReclaimOpen,
}) => {
  const isAdmin = currentUser.role === 'admin';
  const [expanded, setExpanded] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(() => window.innerWidth < 750);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 750);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="pipeline-column">
      <div className="pipeline-column-header">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--accent-primary)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>In Progress</span>
          {tickets.length > 0 && (
            <span className="badge badge-progress text-xs" style={{ padding: '0.1rem 0.45rem' }}>{tickets.length}</span>
          )}
        </div>
        {isAdmin && tickets.length > 0 && (
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Reclaim ↓</span>
        )}
      </div>

      <div className="pipeline-column-body">
        {tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 text-center py-10 gap-2">
            <Hammer size={28} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No active work</p>
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
                        actions={isAdmin && onReclaimOpen ? (
                          <button
                            className="flex items-center justify-center gap-1.5 w-full text-xs font-semibold py-1.5 rounded-lg border transition-all duration-150"
                            style={{
                              background: 'rgba(245,158,11,0.08)',
                              color: 'var(--accent-orange)',
                              borderColor: 'rgba(245,158,11,0.25)',
                            }}
                            onClick={() => onReclaimOpen(t)}
                            title="Admin: pull this ticket back to the Unclaimed queue"
                          >
                            <ShieldAlert size={12} /> Reclaim to Queue
                          </button>
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
