import type { Ticket, TimerLog, Comment } from '../db/schema';

const STORAGE_KEYS = {
  TICKETS: 'workflow_v3_tickets',
  TIMER_LOGS: 'workflow_v3_timer_logs',
  COMMENTS: 'workflow_v3_comments',
};

const now = Date.now();
const hour = 3_600_000;
const day = 24 * hour;

const SEED_TICKETS: Ticket[] = [
  // --- UNCLAIMED ---
  {
    id: 'ticket-1',
    title: 'Jake Thompson',
    profileUrl: 'https://link.me/jakethompson',
    description: 'Add Twitch and YouTube links.',
    stage: 'unclaimed',
    routingType: 'all',
    assignedCreatorId: null,
    lastCreatorId: null,
    currentStageStartedAt: now - hour * 5,
    totalInProgressTime: 0,
    createdAt: now - hour * 5,
    updatedAt: now - hour * 5,
    isHighPriority: false,
    claimedAt: null,
    approvedAt: null,
    submittedAt: null,
  },
  {
    id: 'ticket-2',
    title: 'Maya Patel',
    profileUrl: 'https://link.me/mayapatel',
    description: 'Update profile picture.',
    stage: 'unclaimed',
    routingType: 'specific',
    assignedCreatorId: 'creator-a',
    lastCreatorId: null,
    currentStageStartedAt: now - hour * 3,
    totalInProgressTime: 0,
    createdAt: now - hour * 3,
    updatedAt: now - hour * 3,
    isHighPriority: false,
    claimedAt: null,
    approvedAt: null,
    submittedAt: null,
  },
  {
    id: 'ticket-priority',
    title: 'Olivia Chen',
    profileUrl: 'https://link.me/oliviachen',
    description: 'Add featured link — merch store launch today.',
    stage: 'unclaimed',
    routingType: 'all',
    assignedCreatorId: null,
    lastCreatorId: null,
    currentStageStartedAt: now - hour * 1,
    totalInProgressTime: 0,
    createdAt: now - hour * 1,
    updatedAt: now - hour * 1,
    isHighPriority: true,
    claimedAt: null,
    approvedAt: null,
    submittedAt: null,
  },
  // --- IN PROGRESS ---
  {
    id: 'ticket-3',
    title: 'Marcus Webb',
    profileUrl: 'https://link.me/marcuswebb',
    description: 'Add Instagram and TikTok links.',
    stage: 'in_progress',
    routingType: 'specific',
    assignedCreatorId: 'creator-b',
    lastCreatorId: 'creator-b',
    currentStageStartedAt: now - hour * 2,
    totalInProgressTime: 1_800_000,
    createdAt: now - hour * 10,
    updatedAt: now - hour * 2,
    isHighPriority: false,
    claimedAt: now - hour * 5,
    approvedAt: null,
    submittedAt: null,
  },
  // --- IN REVIEW ---
  {
    id: 'ticket-4',
    title: 'Sophie Nguyen',
    profileUrl: 'https://link.me/sophianguyen',
    description: 'Change bio text and update headshot.',
    stage: 'in_review',
    routingType: 'all',
    assignedCreatorId: 'creator-c',
    lastCreatorId: 'creator-c',
    currentStageStartedAt: now - hour * 1,
    totalInProgressTime: 7_200_000,
    createdAt: now - hour * 6,
    updatedAt: now - hour * 1,
    isHighPriority: false,
    claimedAt: now - hour * 5,
    approvedAt: null,
    submittedAt: now - hour * 1,
  },
  // --- COMPLETED / APPROVED ---
  {
    id: 'ticket-done-1',
    title: 'Alex Rivera',
    profileUrl: 'https://link.me/alexrivera',
    description: 'Add YouTube link.',
    stage: 'approved',
    routingType: 'all',
    assignedCreatorId: 'creator-a',
    lastCreatorId: 'creator-a',
    currentStageStartedAt: now - hour * 2,
    totalInProgressTime: 3_600_000 * 1.5,
    createdAt: now - hour * 8,
    updatedAt: now - hour * 2,
    isHighPriority: false,
    claimedAt: now - hour * 6,
    submittedAt: now - hour * 3,
    approvedAt: now - hour * 2,
  },
  {
    id: 'ticket-done-2',
    title: 'Jordan Lee',
    profileUrl: 'https://link.me/jordanlee',
    description: 'Update profile pic and bio.',
    stage: 'approved',
    routingType: 'specific',
    assignedCreatorId: 'creator-b',
    lastCreatorId: 'creator-b',
    currentStageStartedAt: now - day * 1 - hour * 2,
    totalInProgressTime: 3_600_000 * 2.5,
    createdAt: now - day * 2,
    updatedAt: now - day * 1 - hour * 2,
    isHighPriority: false,
    claimedAt: now - day * 1 - hour * 8,
    submittedAt: now - day * 1 - hour * 4,
    approvedAt: now - day * 1 - hour * 2,
  },
  {
    id: 'ticket-done-3',
    title: 'Taylor Kim',
    profileUrl: 'https://link.me/taylorkim',
    description: 'Add Spotify and Apple Music links.',
    stage: 'approved',
    routingType: 'all',
    assignedCreatorId: 'creator-c',
    lastCreatorId: 'creator-c',
    currentStageStartedAt: now - day * 8,
    totalInProgressTime: 3_600_000 * 4.0,
    createdAt: now - day * 10,
    updatedAt: now - day * 8,
    isHighPriority: false,
    claimedAt: now - day * 9,
    submittedAt: now - day * 8 - hour * 2,
    approvedAt: now - day * 8,
  },
  {
    id: 'ticket-done-4',
    title: 'Priya Sharma',
    profileUrl: 'https://link.me/priyasharma',
    description: 'Add featured link to new course page.',
    stage: 'approved',
    routingType: 'all',
    assignedCreatorId: 'creator-a',
    lastCreatorId: 'creator-a',
    currentStageStartedAt: now - day * 45,
    totalInProgressTime: 3_600_000 * 8.0,
    createdAt: now - day * 50,
    updatedAt: now - day * 45,
    isHighPriority: false,
    claimedAt: now - day * 48,
    submittedAt: now - day * 46,
    approvedAt: now - day * 45,
  },
];


const SEED_TIMER_LOGS: TimerLog[] = [
  { id: 'log-3-active', ticketId: 'ticket-3', creatorId: 'creator-b', startedAt: now - hour * 1, endedAt: null },
  { id: 'log-3-past',   ticketId: 'ticket-3', creatorId: 'creator-b', startedAt: now - hour * 3, endedAt: now - hour * 3 + 1_800_000 },
  { id: 'log-4-past',   ticketId: 'ticket-4', creatorId: 'creator-c', startedAt: now - hour * 4, endedAt: now - hour * 2 },
];

const SEED_COMMENTS: Comment[] = [
  {
    id: 'comment-1', ticketId: 'ticket-3', userId: 'creator-b', userName: 'Jordan Lee',
    userRole: 'creator', content: 'Claimed Marcus Webb\'s profile. Adding Instagram and TikTok links now.',
    createdAt: now - hour * 2, type: 'system', parentCommentId: null,
  },
  {
    id: 'comment-2', ticketId: 'ticket-4', userId: 'creator-c', userName: 'Taylor Kim',
    userRole: 'creator', content: 'Updated bio text and swapped out the headshot. Ready for review.',
    createdAt: now - hour * 1, type: 'regular', parentCommentId: null,
  },
  {
    id: 'comment-3', ticketId: 'ticket-4', userId: 'system', userName: 'System',
    userRole: 'admin', content: 'Submitted for Admin review by Taylor Kim.',
    createdAt: now - hour * 1, type: 'system', parentCommentId: null,
  },
];

export const dbService = {
  getTickets(): Ticket[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TICKETS);
    if (!raw) { this.saveTickets(SEED_TICKETS); return SEED_TICKETS; }
    return JSON.parse(raw);
  },
  saveTickets(tickets: Ticket[]) {
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
  },
  getTimerLogs(): TimerLog[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TIMER_LOGS);
    if (!raw) { this.saveTimerLogs(SEED_TIMER_LOGS); return SEED_TIMER_LOGS; }
    return JSON.parse(raw);
  },
  saveTimerLogs(logs: TimerLog[]) {
    localStorage.setItem(STORAGE_KEYS.TIMER_LOGS, JSON.stringify(logs));
  },
  getComments(): Comment[] {
    const raw = localStorage.getItem(STORAGE_KEYS.COMMENTS);
    if (!raw) { this.saveComments(SEED_COMMENTS); return SEED_COMMENTS; }
    return JSON.parse(raw);
  },
  saveComments(comments: Comment[]) {
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(comments));
  },
  clearAll() {
    Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
  },
};
