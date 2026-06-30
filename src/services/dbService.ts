import type { Ticket, TimerLog, Comment } from '../db/schema';

const STORAGE_KEYS = {
  TICKETS: 'workflow_v2_tickets',
  TIMER_LOGS: 'workflow_v2_timer_logs',
  COMMENTS: 'workflow_v2_comments',
};

const now = Date.now();
const hour = 3_600_000;
const day = 24 * hour;

const SEED_TICKETS: Ticket[] = [
  // --- UNCLAIMED ---
  {
    id: 'ticket-1',
    title: 'Update Instagram Creator Profile',
    profileUrl: 'https://linkme.to/alex-rivera',
    description: 'Refresh the layout for Instagram creator portfolios to support the new highlights grid and link-in-bio widgets. Update icons, typography, and spacing to match the new brand guidelines.',
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
    title: 'Configure SEO Meta Tags',
    profileUrl: 'https://linkme.to/creator-seo-demo',
    description: 'Implement correct OpenGraph and Twitter card configurations for all user portfolio links. Ensure proper canonical URLs and structured data markup for search indexing.',
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
    title: 'Fix Mobile Profile Rendering Bug',
    profileUrl: 'https://linkme.to/mobile-bug-repro',
    description: 'Creator headers are layout-shifting on iOS Safari 17. The hero image is overflowing the viewport and breaking the sticky nav. Fix immediately — this is affecting top creator campaigns with live deadlines.',
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
    title: 'Web3 Wallet Integration',
    profileUrl: 'https://linkme.to/jordan-web3',
    description: 'Add support for Phantom and Metamask wallet logins on creator profiles so they can showcase NFTs in their galleries. Use WalletConnect SDK for universal compatibility.',
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
    title: 'Dark Mode Theme Switcher',
    profileUrl: 'https://linkme.to/taylor-darkmode',
    description: 'Build a fully fluid Dark Mode / Light Mode theme selector following the premium dark slate/glow brand style rules. Use CSS custom properties for instant switching without flash.',
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
  // --- COMPLETED / APPROVED (for Stats + Completed Pool) ---
  {
    id: 'ticket-done-1',
    title: 'Linter & TypeScript Config Setup',
    profileUrl: 'https://linkme.to/alex-devenv',
    description: 'Add oxlint and typescript rules to project configurations to enforce verbatimModuleSyntax compilation rules and code quality standards.',
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
    title: 'Support Feedback Widget',
    profileUrl: 'https://linkme.to/jordan-feedback',
    description: 'A floating feedback widget for dashboard profiles. Uses a compact slide-up tray with rating stars and freeform text. Should persist via localStorage.',
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
    title: 'Brand Assets & Icons Refresh',
    profileUrl: 'https://linkme.to/taylor-assets',
    description: 'Update the main navigation logo with the Linkme premium SVG emblem, update favicon configurations, and align all icon sets to the new 24px grid system.',
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
    title: 'Local Storage Infrastructure',
    profileUrl: 'https://linkme.to/alex-infrastructure',
    description: 'Set up simulated client db layers in React context to bootstrap testing workflows. Seed initial data with realistic timestamps for all stages.',
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
    userRole: 'creator', content: 'Claimed this ticket. Starting with WalletConnect SDK setup.',
    createdAt: now - hour * 2, type: 'system', parentCommentId: null,
  },
  {
    id: 'comment-2', ticketId: 'ticket-4', userId: 'creator-c', userName: 'Taylor Kim',
    userRole: 'creator', content: 'Created layout files, added theme context provider, and hooked up CSS variables. Check the glowing shadows on cards.',
    createdAt: now - hour * 1, type: 'regular', parentCommentId: null,
  },
  {
    id: 'comment-3', ticketId: 'ticket-4', userId: 'system', userName: 'System',
    userRole: 'admin', content: 'Ticket submitted for review by Taylor Kim.',
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
