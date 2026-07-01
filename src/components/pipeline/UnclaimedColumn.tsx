import React, { useState, useRef } from 'react';
import { type Ticket, type User } from '../../db/schema';
import { TicketCard } from '../shared/TicketCard';
import { CreatorStackView } from '../creator/CreatorStackView';
import { Plus, Inbox, AlertTriangle, GripVertical } from 'lucide-react';

interface Props {
  tickets: Ticket[];      // For Admin: all unclaimed tickets (sorted by sortOrder / chronologically)
  queue: Ticket[];        // For Creator: priority-sorted queue
  currentUser: User;
  hasHighPriority: boolean;
  onTicketClick: (id: string) => void;
  onClaimTop: () => void;
  onCreateNew: () => void;
  /** Admin only: called after a drag-drop reorder with the new ordered IDs */
  onReorder?: (orderedIds: string[]) => void;
  /** Admin only: escalate a ticket to high-priority top of queue */
  onEscalate?: (ticketId: string) => void;
}

export const UnclaimedColumn: React.FC<Props> = ({
  tickets, queue, currentUser, hasHighPriority, onTicketClick, onClaimTop, onCreateNew,
  onReorder, onEscalate,
}) => {
  const isAdmin = currentUser.role === 'admin';
  const count = isAdmin ? tickets.length : queue.length;

  // ── Drag-and-drop state ──────────────────────────────────────────────────
  const [localTickets, setLocalTickets] = useState<Ticket[]>(tickets);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 750);
  const dragNode = useRef<HTMLDivElement | null>(null);

  // Keep localTickets in sync when the parent refreshes (e.g. after escalate)
  React.useEffect(() => {
    setLocalTickets(tickets);
  }, [tickets]);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 750);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setExpanded(true); // Automatically expand so all items are visible during dragging
    setDragIndex(index);
    dragNode.current = e.currentTarget;
    e.dataTransfer.effectAllowed = 'move';
    // Slight delay so the ghost image is rendered before drag styles kick in
    requestAnimationFrame(() => {
      e.currentTarget.classList.add('dragging');
    });
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    setOverIndex(index);

    // Live-reorder during drag for visual feedback
    const updated = [...localTickets];
    const [dragged] = updated.splice(dragIndex, 1);
    updated.splice(index, 0, dragged);
    setLocalTickets(updated);
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('dragging');
    setDragIndex(null);
    setOverIndex(null);

    // Persist the new order
    if (onReorder) {
      onReorder(localTickets.map(t => t.id));
    }
  };

  const handleDragLeave = () => {
    // intentionally empty — overIndex is cleared on dragEnd
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={`pipeline-column flex flex-col ${hasHighPriority ? 'column-high-priority' : ''}`}>

      {/* High-priority alert banner */}
      {hasHighPriority && (
        <div className="high-priority-banner">
          <AlertTriangle size={13} style={{ color: 'var(--accent-coral)', flexShrink: 0 }} />
          <span className="text-xs font-bold tracking-wide" style={{ color: 'var(--accent-coral)' }}>
            HIGH PRIORITY PROFILE IS IN THE QUEUE!
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
        <div className="flex items-center gap-2">
          {isAdmin && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Drag to reorder</span>
          )}
          {isAdmin && (
            <button onClick={onCreateNew} className="btn btn-primary btn-xs gap-1">
              <Plus size={12} /> New
            </button>
          )}
        </div>
      </div>

      {/* Column body */}
      {isAdmin ? (
        <div className="pipeline-column-body unclaimed-dnd-list">
          {localTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 text-center py-10 gap-2">
              <Inbox size={28} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No unclaimed profiles</p>
            </div>
          ) : (
            <>
              {(() => {
                const defaultLimit = isMobile ? 1 : 4;
                return (
                  <>
                    {localTickets.map((t, index) => {
                      // If not expanded, hide all items beyond the dynamic limit
                      if (!expanded && index >= defaultLimit) return null;

                      return (
                        <div
                          key={t.id}
                          className={`dnd-item ${dragIndex === index ? 'dnd-item--dragging' : ''} ${overIndex === index ? 'dnd-item--over' : ''}`}
                          draggable
                          onDragStart={e => handleDragStart(e, index)}
                          onDragEnter={e => handleDragEnter(e, index)}
                          onDragOver={handleDragOver}
                          onDragEnd={handleDragEnd}
                          onDragLeave={handleDragLeave}
                        >
                          {/* Drag handle */}
                          <div
                            className="dnd-handle"
                            title="Drag to reorder"
                            onMouseDown={e => e.stopPropagation()}
                          >
                            <GripVertical size={14} />
                          </div>

                          {/* Card with escalate action */}
                          <div className="dnd-card-wrapper">
                            <TicketCard
                              ticket={t}
                              currentUser={currentUser}
                              onClick={onTicketClick}
                              onEscalate={!t.isHighPriority && onEscalate ? onEscalate : undefined}
                            />
                          </div>
                        </div>
                      );
                    })}

                    {localTickets.length > defaultLimit && (
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
                          <>Show {localTickets.length - defaultLimit} More Profiles</>
                        )}
                      </button>
                    )}
                  </>
                );
              })()}
            </>
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
