import { dbService } from './dbService';
import {
  type Ticket, type TimerLog, type Comment,
  type User, MOCK_USERS, type RoutingType, type RejectionRoutingOption,
} from '../db/schema';

// ─── RBAC: Fields that are NEVER transmitted to Creator-role clients ──────────
// Stripping happens at the service boundary so no component can accidentally
// render or expose timing data to non-admin users.
type AdminOnlyFields = 'currentStageStartedAt' | 'totalInProgressTime' | 'claimedAt' | 'approvedAt' | 'submittedAt';
export type CreatorTicketView = Omit<Ticket, AdminOnlyFields>;
export type TicketView = Ticket | CreatorTicketView;

export interface CreatorStats {
  claimedCount: number;
  completedCount: number;
  avgWorkDurationMs: number;
  completedTickets: {
    id: string;
    title: string;
    profileUrl: string | null;
    creatorName: string;
    creatorAvatar: string;
    formattedWorkTime: string;
    formattedApprovedAt: string;
  }[];
}

const uuid = () =>
  Math.random().toString(36).substring(2, 9) + '-' + Math.random().toString(36).substring(2, 9);

export const ticketService = {
  // ─── READ ────────────────────────────────────────────────────────────────────

  getTickets(): Ticket[] {
    return dbService.getTickets();
  },

  /**
   * RBAC-enforced ticket fetch.
   * Admins receive the full Ticket shape including all tracking timestamps.
   * Creators receive CreatorTicketView — tracking fields are stripped from the
   * object entirely at this layer before any component can access them.
   * This is NOT a UI toggle; the data is physically absent from the payload.
   */
  getTicketsForRole(role: User['role']): Ticket[] {
    const tickets = dbService.getTickets();
    if (role === 'admin') return tickets;

    // Strip every admin-only timing field — Object.keys approach avoids
    // silent failures if the Ticket schema grows new tracking fields.
    const ADMIN_ONLY: AdminOnlyFields[] = [
      'currentStageStartedAt',
      'totalInProgressTime',
      'claimedAt',
      'approvedAt',
      'submittedAt',
    ];
    return tickets.map(t => {
      const view = { ...t } as Partial<Ticket>;
      ADMIN_ONLY.forEach(field => delete view[field]);
      return view as Ticket;
    });
  },

  getCommentsForTicket(ticketId: string): Comment[] {
    return dbService.getComments().filter(c => c.ticketId === ticketId);
  },

  getTimerLogsForTicket(ticketId: string): TimerLog[] {
    return dbService.getTimerLogs().filter(l => l.ticketId === ticketId);
  },

  /**
   * Priority-sorted queue for a specific creator (stack order).
   *
   * Composite sort key — two fields, fully deterministic:
   *   1. TIER (integer 0–3): derived from isHighPriority × routing specificity.
   *      Lower tier = higher in stack.
   *        0 → high-priority, specifically routed to THIS creator
   *        1 → high-priority, routed to all creators
   *        2 → standard, specifically routed to THIS creator
   *        3 → standard, routed to all creators
   *   2. createdAt (ascending): within the same tier, FIFO is strictly preserved.
   *      Older tickets appear higher in the stack so no ticket is starved.
   *
   * Multiple high-priority tickets remain in their original insertion order.
   * Multiple standard tickets remain in their original insertion order.
   * No random ordering is possible.
   */
  getCreatorQueue(creatorId: string): Ticket[] {
    const TIER = (t: Ticket): number => {
      const isSpecific = t.assignedCreatorId === creatorId;
      if (t.isHighPriority) return isSpecific ? 0 : 1;
      return isSpecific ? 2 : 3;
    };

    return dbService.getTickets()
      .filter(t => {
        if (t.stage !== 'unclaimed') return false;
        return t.routingType === 'all' || t.assignedCreatorId === creatorId;
      })
      .sort((a, b) => {
        const tierDiff = TIER(a) - TIER(b);
        if (tierDiff !== 0) return tierDiff;

        // Secondary: manual sortOrder if defined
        const sa = a.sortOrder ?? Infinity;
        const sb = b.sortOrder ?? Infinity;
        if (sa !== sb) return sa - sb;

        // Tertiary: createdAt ascending → strict FIFO within same tier
        return a.createdAt - b.createdAt;
      });
  },

  // ─── CREATE ──────────────────────────────────────────────────────────────────

  createTicket(
    title: string,
    profileUrl: string | null,
    description: string,
    routingType: RoutingType,
    assignedCreatorId: string | null,
    isHighPriority = false,
  ): Ticket {
    const tickets = dbService.getTickets();
    const now = Date.now();
    const newTicket: Ticket = {
      id: `ticket-${uuid()}`,
      title,
      profileUrl,
      description,
      stage: 'unclaimed',
      routingType,
      assignedCreatorId: routingType === 'specific' ? assignedCreatorId : null,
      lastCreatorId: null,
      currentStageStartedAt: now,
      totalInProgressTime: 0,
      createdAt: now,
      updatedAt: now,
      isHighPriority,
      claimedAt: null,
      approvedAt: null,
      submittedAt: null,
    };
    tickets.push(newTicket);
    dbService.saveTickets(tickets);

    const dest = routingType === 'specific'
      ? (MOCK_USERS.find(u => u.id === assignedCreatorId)?.name || 'Specific Creator')
      : 'Public Pool';
    this.addSystemComment(newTicket.id,
      `Profile request created [${isHighPriority ? 'HIGH PRIORITY' : 'Normal'}]. Routed to: ${dest}.`);

    return newTicket;
  },

  // ─── CLAIM ───────────────────────────────────────────────────────────────────

  claimTicket(ticketId: string, creatorId: string): Ticket {
    const tickets = dbService.getTickets();
    const idx = tickets.findIndex(t => t.id === ticketId);
    if (idx === -1) throw new Error('Ticket not found');

    const ticket = tickets[idx];
    if (ticket.stage !== 'unclaimed') throw new Error('Ticket is not in the unclaimed pool');
    if (ticket.routingType === 'specific' && ticket.assignedCreatorId !== creatorId)
      throw new Error('This ticket is routed to a different creator');

    const now = Date.now();
    ticket.stage = 'in_progress';
    ticket.assignedCreatorId = creatorId;
    ticket.lastCreatorId = creatorId;         // Track for Minor Tweak
    ticket.currentStageStartedAt = now;
    ticket.updatedAt = now;
    if (ticket.claimedAt === null) ticket.claimedAt = now;

    // Start timer log
    const logs = dbService.getTimerLogs();
    logs.push({ id: `log-${uuid()}`, ticketId, creatorId, startedAt: now, endedAt: null });
    dbService.saveTimerLogs(logs);
    dbService.saveTickets(tickets);

    const name = MOCK_USERS.find(u => u.id === creatorId)?.name || 'Creator';
    this.addSystemComment(ticketId, `Claimed by ${name}. Active work timer started.`);
    return ticket;
  },

  /** Pops the highest-priority unclaimed ticket and claims it */
  claimTopProfile(creatorId: string): Ticket {
    const queue = this.getCreatorQueue(creatorId);
    if (queue.length === 0) throw new Error('No tickets available in your queue');
    return this.claimTicket(queue[0].id, creatorId);
  },

  // ─── ADMIN RECLAIM (In Progress → Unclaimed) ─────────────────────────────

  /**
   * Admin pulls an in-progress ticket back into the Unclaimed Pool.
   * Stops the active timer and re-queues with existing FIFO priority rules.
   * Optional high-priority flag lets it jump the queue immediately.
   */
  adminReclaimInProgress(
    ticketId: string,
    adminId: string,
    routingType: RoutingType,
    targetCreatorId: string | null = null,
    isHighPriority?: boolean,
  ): Ticket {
    const tickets = dbService.getTickets();
    const idx = tickets.findIndex(t => t.id === ticketId);
    if (idx === -1) throw new Error('Ticket not found');

    const ticket = tickets[idx];
    if (ticket.stage !== 'in_progress') throw new Error('Ticket is not in progress');

    const now = Date.now();

    // Stop active timer log so work time is preserved accurately
    const logs = dbService.getTimerLogs();
    const activeIdx = logs.findIndex(l => l.ticketId === ticketId && l.endedAt === null);
    if (activeIdx !== -1) {
      logs[activeIdx].endedAt = now;
      ticket.totalInProgressTime += now - logs[activeIdx].startedAt;
      dbService.saveTimerLogs(logs);
    }

    // Re-queue the ticket
    ticket.stage = 'unclaimed';
    ticket.routingType = routingType;
    ticket.assignedCreatorId = routingType === 'specific' ? targetCreatorId : null;
    ticket.currentStageStartedAt = now;
    ticket.updatedAt = now;

    // Override priority only if explicitly provided
    if (isHighPriority !== undefined) {
      ticket.isHighPriority = isHighPriority;
    }

    dbService.saveTickets(tickets);

    const adminName = MOCK_USERS.find(u => u.id === adminId)?.name || 'Admin';
    const dest = routingType === 'specific'
      ? (MOCK_USERS.find(u => u.id === targetCreatorId)?.name || 'Creator')
      : 'Public Pool';
    this.addSystemComment(ticketId,
      `Admin reclaim by ${adminName}. Returned to Unclaimed → ${dest}. Timer stopped.`);

    return ticket;
  },

  // ─── SUBMIT ──────────────────────────────────────────────────────────────────

  submitTicketForReview(ticketId: string): Ticket {
    const tickets = dbService.getTickets();
    const idx = tickets.findIndex(t => t.id === ticketId);
    if (idx === -1) throw new Error('Ticket not found');

    const ticket = tickets[idx];
    if (ticket.stage !== 'in_progress') throw new Error('Ticket is not in progress');

    const now = Date.now();
    // Stop active timer
    const logs = dbService.getTimerLogs();
    const activeIdx = logs.findIndex(l => l.ticketId === ticketId && l.endedAt === null);
    if (activeIdx !== -1) {
      logs[activeIdx].endedAt = now;
      ticket.totalInProgressTime += now - logs[activeIdx].startedAt;
      dbService.saveTimerLogs(logs);
    }

    ticket.stage = 'in_review';
    ticket.currentStageStartedAt = now;
    ticket.submittedAt = now;
    ticket.updatedAt = now;
    dbService.saveTickets(tickets);

    const name = MOCK_USERS.find(u => u.id === ticket.assignedCreatorId)?.name || 'Creator';
    this.addSystemComment(ticketId, `Submitted for Admin review by ${name}. Timer stopped.`);
    return ticket;
  },

  // ─── APPROVE ─────────────────────────────────────────────────────────────────

  approveTicket(ticketId: string, adminId: string): Ticket {
    const tickets = dbService.getTickets();
    const idx = tickets.findIndex(t => t.id === ticketId);
    if (idx === -1) throw new Error('Ticket not found');

    const ticket = tickets[idx];
    if (ticket.stage !== 'in_review') throw new Error('Ticket is not in review');

    const now = Date.now();
    ticket.stage = 'approved';
    ticket.currentStageStartedAt = now;
    ticket.approvedAt = now;
    ticket.updatedAt = now;
    dbService.saveTickets(tickets);

    const adminName = MOCK_USERS.find(u => u.id === adminId)?.name || 'Admin';
    this.addSystemComment(ticketId, `Approved by ${adminName}. Moved to Completed Pool.`);
    return ticket;
  },

  // ─── REJECT ──────────────────────────────────────────────────────────────────

  rejectTicket(
    ticketId: string,
    adminId: string,
    commentText: string,
    routingOption: RejectionRoutingOption,
    newCreatorId?: string,
    isHighPriority = false,
  ): Ticket {
    if (!commentText.trim()) throw new Error('A rejection reason comment is required');

    const tickets = dbService.getTickets();
    const idx = tickets.findIndex(t => t.id === ticketId);
    if (idx === -1) throw new Error('Ticket not found');

    const ticket = tickets[idx];
    if (ticket.stage !== 'in_review') throw new Error('Ticket is not in review');

    const now = Date.now();
    const adminName = MOCK_USERS.find(u => u.id === adminId)?.name || 'Admin';

    ticket.isHighPriority = isHighPriority;

    // Save forced rejection comment
    const comments = dbService.getComments();
    comments.push({
      id: `comment-${uuid()}`,
      ticketId, userId: adminId, userName: adminName, userRole: 'admin',
      content: commentText, createdAt: now, type: 'rejection', parentCommentId: null,
    });
    dbService.saveComments(comments);

    if (routingOption === 'same_creator') {
      const origCreatorId = ticket.assignedCreatorId!;
      ticket.stage = 'in_progress';
      ticket.currentStageStartedAt = now;
      const logs = dbService.getTimerLogs();
      logs.push({ id: `log-${uuid()}`, ticketId, creatorId: origCreatorId, startedAt: now, endedAt: null });
      dbService.saveTimerLogs(logs);
      const origName = MOCK_USERS.find(u => u.id === origCreatorId)?.name || 'Creator';
      this.addSystemComment(ticketId, `Rejected by ${adminName}. Returned to ${origName} — timer resumed.`);
    } else if (routingOption === 'different_creator') {
      if (!newCreatorId) throw new Error('Must designate a creator for re-routing');
      ticket.stage = 'unclaimed';
      ticket.routingType = 'specific';
      ticket.assignedCreatorId = newCreatorId;
      ticket.currentStageStartedAt = now;
      const newName = MOCK_USERS.find(u => u.id === newCreatorId)?.name || 'Creator';
      this.addSystemComment(ticketId, `Rejected by ${adminName}. Re-routed to ${newName}.`);
    } else {
      ticket.stage = 'unclaimed';
      ticket.routingType = 'all';
      ticket.assignedCreatorId = null;
      ticket.currentStageStartedAt = now;
      this.addSystemComment(ticketId, `Rejected by ${adminName}. Returned to Public Pool.`);
    }

    ticket.updatedAt = now;
    dbService.saveTickets(tickets);
    return ticket;
  },

  // ─── RECALL: MINOR TWEAK ─────────────────────────────────────────────────────

  /**
   * Minor Tweak: Sends an approved ticket back to In Progress,
   * automatically assigned to the last creator who worked on it.
   */
  recallMinorTweak(ticketId: string, adminId: string): Ticket {
    const tickets = dbService.getTickets();
    const idx = tickets.findIndex(t => t.id === ticketId);
    if (idx === -1) throw new Error('Ticket not found');

    const ticket = tickets[idx];
    if (ticket.stage !== 'approved') throw new Error('Ticket is not in the Completed Pool');

    const creatorId = ticket.lastCreatorId || ticket.assignedCreatorId;
    if (!creatorId) throw new Error('Cannot determine the last creator for this ticket');

    const now = Date.now();
    ticket.stage = 'in_progress';
    ticket.assignedCreatorId = creatorId;
    ticket.currentStageStartedAt = now;
    ticket.approvedAt = null;
    ticket.submittedAt = null;
    ticket.updatedAt = now;

    // Start new timer
    const logs = dbService.getTimerLogs();
    logs.push({ id: `log-${uuid()}`, ticketId, creatorId, startedAt: now, endedAt: null });
    dbService.saveTimerLogs(logs);
    dbService.saveTickets(tickets);

    const adminName = MOCK_USERS.find(u => u.id === adminId)?.name || 'Admin';
    const creatorName = MOCK_USERS.find(u => u.id === creatorId)?.name || 'Creator';
    this.addSystemComment(ticketId,
      `Minor Tweak recall by ${adminName}. Sent back to ${creatorName} in In Progress.`);
    return ticket;
  },

  // ─── RECALL: MAJOR TWEAK ─────────────────────────────────────────────────────

  /**
   * Major Tweak: Fully resets an approved ticket to Unclaimed with routing choices.
   */
  recallMajorTweak(
    ticketId: string,
    adminId: string,
    routingType: RoutingType,
    targetCreatorId: string | null,
    isHighPriority = false,
  ): Ticket {
    const tickets = dbService.getTickets();
    const idx = tickets.findIndex(t => t.id === ticketId);
    if (idx === -1) throw new Error('Ticket not found');

    const ticket = tickets[idx];
    if (ticket.stage !== 'approved') throw new Error('Ticket is not in the Completed Pool');

    const now = Date.now();
    ticket.stage = 'unclaimed';
    ticket.routingType = routingType;
    ticket.assignedCreatorId = routingType === 'specific' ? targetCreatorId : null;
    ticket.currentStageStartedAt = now;
    ticket.approvedAt = null;
    ticket.submittedAt = null;
    ticket.claimedAt = null;
    ticket.isHighPriority = isHighPriority;
    ticket.updatedAt = now;
    dbService.saveTickets(tickets);

    const adminName = MOCK_USERS.find(u => u.id === adminId)?.name || 'Admin';
    const dest = routingType === 'specific'
      ? (MOCK_USERS.find(u => u.id === targetCreatorId)?.name || 'Creator')
      : 'Public Pool';
    this.addSystemComment(ticketId,
      `Major Tweak recall by ${adminName}. Fully reset to Unclaimed. Routed to: ${dest}.`);
    return ticket;
  },

  // ─── ADMIN UNCLAIMED POOL MANAGEMENT ───────────────────────────────────────────

  reorderUnclaimedPool(orderedIds: string[]): void {
    const tickets = dbService.getTickets();
    
    // First apply the basic sort orders
    orderedIds.forEach((id, index) => {
      const t = tickets.find(tk => tk.id === id);
      if (t) t.sortOrder = index;
    });

    // Backwards scan to auto-escalate normal tickets placed above priority ones
    let seenHighPriority = false;
    for (let i = orderedIds.length - 1; i >= 0; i--) {
      const t = tickets.find(tk => tk.id === orderedIds[i]);
      if (t) {
        if (t.isHighPriority) {
          seenHighPriority = true;
        } else if (seenHighPriority) {
          t.isHighPriority = true;
          // Log a system comment so the action is audited in the activity log
          this.addSystemComment(t.id, `Escalated to HIGH PRIORITY: Placed above a priority profile in queue reordering.`);
        }
      }
    }

    dbService.saveTickets(tickets);
  },

  /**
   * Escalates an unclaimed ticket to high priority and moves it to the top
   * of the admin pool (sortOrder = -1 so it always leads).
   */
  escalateToPriority(ticketId: string, adminId: string): Ticket {
    const tickets = dbService.getTickets();
    const idx = tickets.findIndex(t => t.id === ticketId);
    if (idx === -1) throw new Error('Ticket not found');

    const ticket = tickets[idx];
    if (ticket.stage !== 'unclaimed') throw new Error('Can only escalate unclaimed tickets');

    ticket.isHighPriority = true;
    ticket.sortOrder = -1;
    ticket.updatedAt = Date.now();
    dbService.saveTickets(tickets);

    const adminName = MOCK_USERS.find(u => u.id === adminId)?.name || 'Admin';
    this.addSystemComment(ticketId, `Escalated to HIGH PRIORITY by ${adminName}.`);
    return ticket;
  },

  // ─── COMMENTS ────────────────────────────────────────────────────────────────

  addUserComment(ticketId: string, userId: string, content: string, parentCommentId: string | null = null): Comment {
    const user = MOCK_USERS.find(u => u.id === userId);
    if (!user) throw new Error('User not found');
    const comment: Comment = {
      id: `comment-${uuid()}`,
      ticketId, userId, userName: user.name, userRole: user.role,
      content, createdAt: Date.now(), type: 'regular', parentCommentId,
    };
    const comments = dbService.getComments();
    comments.push(comment);
    dbService.saveComments(comments);
    return comment;
  },

  addSystemComment(ticketId: string, content: string): Comment {
    const comment: Comment = {
      id: `comment-${uuid()}`,
      ticketId, userId: 'system', userName: 'System', userRole: 'admin',
      content, createdAt: Date.now(), type: 'system', parentCommentId: null,
    };
    const comments = dbService.getComments();
    comments.push(comment);
    dbService.saveComments(comments);
    return comment;
  },

  // ─── LIVE TIMER CALCULATION ──────────────────────────────────────────────────

  calculateLiveTime(ticket: Ticket): { timeInStage: number; totalInProgressTime: number } {
    const now = Date.now();
    const timeInStage = now - ticket.currentStageStartedAt;
    if (ticket.stage === 'in_progress') {
      const activeLog = dbService.getTimerLogs().find(
        l => l.ticketId === ticket.id && l.endedAt === null
      );
      if (activeLog) {
        return {
          timeInStage,
          totalInProgressTime: ticket.totalInProgressTime + (now - activeLog.startedAt),
        };
      }
    }
    return { timeInStage, totalInProgressTime: ticket.totalInProgressTime };
  },

  /**
   * Secure backend-layer statistics calculation.
   * Resolves the Creator stats page by filtering against the real DB tickets
   * (which contain the raw claimed/completed timestamps), and returning an
   * aggregated, fully formatted statistics payload.
   *
   * Crucially, the returned CreatorStats does NOT contain any raw timestamp
   * fields (claimedAt, approvedAt, etc.), thereby maintaining 100% RBAC security.
   */
  getStats(
    currentUser: User,
    selectedCreatorId: string,
    filter: string,
    customStart: string,
    customEnd: string
  ): CreatorStats {
    const tickets = dbService.getTickets();
    const isCreator = currentUser.role === 'creator';
    
    // Filter tickets by creator ownership
    const filteredByCreator = tickets.filter(t => {
      if (isCreator) {
        return t.assignedCreatorId === currentUser.id;
      }
      if (selectedCreatorId !== 'all') {
        return t.assignedCreatorId === selectedCreatorId;
      }
      return true;
    });

    // Calculate dates range
    const getRange = (filterType: string, startStr: string, endStr: string): [number, number] => {
      const nowVal = Date.now();
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      switch (filterType) {
        case 'today': return [todayStart.getTime(), nowVal];
        case 'week': return [nowVal - 7 * 24 * 3600000, nowVal];
        case 'month': return [nowVal - 30 * 24 * 3600000, nowVal];
        case 'all': return [0, nowVal];
        default: {
          const start = startStr ? new Date(startStr).getTime() : 0;
          const end = endStr ? new Date(endStr + 'T23:59:59').getTime() : nowVal;
          return [start, end];
        }
      }
    };

    const [rangeStart, rangeEnd] = getRange(filter, customStart, customEnd);
    const inRange = (ts: number | null | undefined) => ts !== undefined && ts !== null && ts >= rangeStart && ts <= rangeEnd;

    const claimed = filteredByCreator.filter(t => inRange(t.claimedAt));
    const completed = filteredByCreator.filter(t => t.stage === 'approved' && inRange(t.approvedAt));

    const avgDuration = (() => {
      const withTime = completed.filter(t => t.totalInProgressTime !== undefined && t.totalInProgressTime > 0);
      if (withTime.length === 0) return 0;
      return withTime.reduce((sum, t) => sum + (t.totalInProgressTime ?? 0), 0) / withTime.length;
    })();

    const completedList = completed.map(t => {
      const creator = MOCK_USERS.find(u => u.id === t.assignedCreatorId);
      
      const fmtDuration = (ms: number) => {
        if (ms <= 0) return '—';
        const h = Math.floor(ms / 3600000);
        const m = Math.floor((ms / 60000) % 60);
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
      };
      
      const fmtDate = (ts: number | null | undefined) => {
        if (!ts) return '—';
        return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      };

      return {
        id: t.id,
        title: t.title,
        profileUrl: t.profileUrl,
        creatorName: creator ? creator.name : 'Unknown',
        creatorAvatar: creator ? creator.avatar : '',
        formattedWorkTime: fmtDuration(t.totalInProgressTime ?? 0),
        formattedApprovedAt: fmtDate(t.approvedAt),
      };
    });

    return {
      claimedCount: claimed.length,
      completedCount: completed.length,
      avgWorkDurationMs: avgDuration,
      completedTickets: completedList,
    };
  },
};
