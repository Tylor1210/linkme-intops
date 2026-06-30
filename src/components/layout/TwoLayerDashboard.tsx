import React, { useState, useEffect, useCallback } from 'react';
import { type User, type Ticket } from '../../db/schema';
import { ticketService } from '../../services/ticketService';

// Pipeline columns
import { UnclaimedColumn } from '../pipeline/UnclaimedColumn';
import { InProgressColumn } from '../pipeline/InProgressColumn';
import { InReviewColumn } from '../pipeline/InReviewColumn';

// Completed Pool
import { CompletedPool } from '../completed/CompletedPool';

// Modals
import { CreateTicketModal } from '../modals/CreateTicketModal';
import { RejectModal } from '../modals/RejectModal';
import { RecallModal } from '../modals/RecallModal';
import { ReclaimInProgressModal } from '../modals/ReclaimInProgressModal';
import { TicketDetailsModal } from '../modals/TicketDetailsModal';
import { CreatorWorkModal } from '../modals/CreatorWorkModal';

// Stats
import { StatsTab } from '../stats/StatsTab';

interface Props {
  currentUser: User;
  activeTab: 'board' | 'stats';
}

export const TwoLayerDashboard: React.FC<Props> = ({ currentUser, activeTab }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);

  // Modal states
  const [detailsTicketId, setDetailsTicketId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [rejectTicket, setRejectTicket] = useState<Ticket | null>(null);
  const [recallTicket, setRecallTicket] = useState<Ticket | null>(null);
  const [reclaimTicket, setReclaimTicket] = useState<Ticket | null>(null); // Admin in-progress reclaim

  const isAdmin = currentUser.role === 'admin';
  const isCreator = currentUser.role === 'creator';

  /**
   * RBAC boundary: always load via getTicketsForRole so the payload handed to
   * child components is already stripped of admin-only timing fields when the
   * current user is a Creator. Never call getTickets() directly from components.
   */
  const loadTickets = useCallback(() => {
    setTickets(ticketService.getTicketsForRole(currentUser.role));
  }, [currentUser.role]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  // ─── Derived data ──────────────────────────────────────────────────────────

  /**
   * Admin unclaimed sort — composite key mirrors the creator queue TIER logic:
   *   1. Manual sortOrder (drag-and-drop override): lower wins.
   *   2. isHighPriority tier: high-priority tickets lead standard ones.
   *   3. createdAt ascending (FIFO): strict insertion-order tiebreak within tier.
   * This guarantees deterministic ordering with no ambiguity.
   */
  const unclaimedForAdmin = tickets
    .filter(t => t.stage === 'unclaimed')
    .sort((a, b) => {
      // Layer 1: explicit drag-and-drop sortOrder
      const sa = (a as Ticket).sortOrder ?? Infinity;
      const sb = (b as Ticket).sortOrder ?? Infinity;
      if (sa !== sb) return sa - sb;
      // Layer 2: priority tier (high-priority before standard)
      const tierA = a.isHighPriority ? 0 : 1;
      const tierB = b.isHighPriority ? 0 : 1;
      if (tierA !== tierB) return tierA - tierB;
      // Layer 3: FIFO — oldest created appears first
      return a.createdAt - b.createdAt;
    });

  const creatorQueue = isCreator
    ? ticketService.getCreatorQueue(currentUser.id)
    : [];

  const hasHighPriorityUnclaimed = isCreator
    ? creatorQueue.some(t => t.isHighPriority)
    : unclaimedForAdmin.some(t => t.isHighPriority);

  const inProgressTickets = tickets.filter(t => {
    if (t.stage !== 'in_progress') return false;
    if (isAdmin) return true;
    return t.assignedCreatorId === currentUser.id;
  });

  const inReviewTickets = tickets.filter(t => {
    if (t.stage !== 'in_review') return false;
    if (isAdmin) return true;
    return t.assignedCreatorId === currentUser.id;
  });

  const completedTickets = tickets
    .filter(t => t.stage === 'approved')
    .sort((a, b) => (b.approvedAt ?? 0) - (a.approvedAt ?? 0));

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleClaimTop = () => {
    try {
      const claimed = ticketService.claimTopProfile(currentUser.id);
      loadTickets();
      setDetailsTicketId(claimed.id); // Open work view immediately after claiming
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReorderUnclaimed = (orderedIds: string[]) => {
    ticketService.reorderUnclaimedPool(orderedIds);
    loadTickets();
  };

  const handleEscalate = (ticketId: string) => {
    try {
      ticketService.escalateToPriority(ticketId, currentUser.id);
      loadTickets();
    } catch (err: any) {
      alert(err.message);
    }
  };

  /**
   * Smart ticket click handler:
   * - Creator clicking their own in-progress ticket → opens CreatorWorkModal
   * - Everything else → opens full TicketDetailsModal
   */
  const handleTicketClick = (id: string) => {
    setDetailsTicketId(id);
  };

  // ─── Determine which modal to show for a clicked ticket ──────────────────

  const detailsTicket = detailsTicketId
    ? tickets.find(t => t.id === detailsTicketId) ?? null
    : null;

  const showCreatorWorkModal =
    detailsTicket !== null &&
    isCreator &&
    detailsTicket.stage === 'in_progress' &&
    detailsTicket.assignedCreatorId === currentUser.id;

  // ─── Render ───────────────────────────────────────────────────────────────

  if (activeTab === 'stats') {
    return <StatsTab currentUser={currentUser} />;
  }

  return (
    <>
      {/* ── TOP LAYER: 3-Column Active Pipeline ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <UnclaimedColumn
          tickets={unclaimedForAdmin}
          queue={creatorQueue}
          currentUser={currentUser}
          hasHighPriority={hasHighPriorityUnclaimed}
          onTicketClick={handleTicketClick}
          onClaimTop={handleClaimTop}
          onCreateNew={() => setShowCreateModal(true)}
          onReorder={handleReorderUnclaimed}
          onEscalate={handleEscalate}
        />
        <InProgressColumn
          tickets={inProgressTickets}
          currentUser={currentUser}
          onTicketClick={handleTicketClick}
          onReclaimOpen={isAdmin ? setReclaimTicket : undefined}
        />
        <InReviewColumn
          tickets={inReviewTickets}
          currentUser={currentUser}
          onTicketClick={handleTicketClick}
          onRefresh={loadTickets}
          onRejectOpen={setRejectTicket}
        />
      </div>

      {/* ── BOTTOM LAYER: Completed Pool ────────────────────────────────── */}
      <CompletedPool
        tickets={completedTickets}
        currentUser={currentUser}
        onViewDetails={handleTicketClick}
        onRecallModalOpen={setRecallTicket}
        onRefresh={loadTickets}
      />

      {/* ── MODALS ──────────────────────────────────────────────────────── */}

      {showCreateModal && (
        <CreateTicketModal
          onClose={() => setShowCreateModal(false)}
          onCreated={loadTickets}
        />
      )}

      {/* Creator work view — stripped down: URL + admin comments only */}
      {detailsTicketId && showCreatorWorkModal && detailsTicket && (
        <CreatorWorkModal
          ticket={detailsTicket}
          currentUser={currentUser}
          onClose={() => setDetailsTicketId(null)}
          onRefresh={loadTickets}
        />
      )}

      {/* Full detail modal — for admins and non-in-progress creator views */}
      {detailsTicketId && !showCreatorWorkModal && (
        <TicketDetailsModal
          ticketId={detailsTicketId}
          currentUser={currentUser}
          onClose={() => setDetailsTicketId(null)}
          onRefresh={loadTickets}
        />
      )}

      {rejectTicket && (
        <RejectModal
          ticket={rejectTicket}
          currentUser={currentUser}
          onClose={() => setRejectTicket(null)}
          onRejected={loadTickets}
        />
      )}

      {recallTicket && (
        <RecallModal
          ticket={recallTicket}
          currentUser={currentUser}
          onClose={() => setRecallTicket(null)}
          onRecalled={loadTickets}
        />
      )}

      {/* Admin: reclaim in-progress ticket back to queue */}
      {reclaimTicket && (
        <ReclaimInProgressModal
          ticket={reclaimTicket}
          currentUser={currentUser}
          onClose={() => setReclaimTicket(null)}
          onReclaimed={loadTickets}
        />
      )}
    </>
  );
};
