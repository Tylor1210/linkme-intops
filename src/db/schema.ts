export type UserRole = 'admin' | 'creator';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
}

export type TicketStage = 'unclaimed' | 'in_progress' | 'in_review' | 'approved';
export type RoutingType = 'all' | 'specific';
export type RejectionRoutingOption = 'same_creator' | 'different_creator' | 'all_creators';
export type RecallType = 'minor' | 'major';

export interface Ticket {
  id: string;
  title: string;
  profileUrl: string | null;       // Clickable link shown to Creators
  description: string;
  stage: TicketStage;
  routingType: RoutingType;
  assignedCreatorId: string | null;  // Current/last assigned creator
  lastCreatorId: string | null;      // Most recent creator who actively worked (for Minor Tweak)
  currentStageStartedAt: number;
  totalInProgressTime: number;
  createdAt: number;
  updatedAt: number;
  isHighPriority: boolean;
  claimedAt: number | null;
  approvedAt: number | null;
  submittedAt: number | null;
  /** Admin-controlled manual sort order for the unclaimed pool (lower = higher in list) */
  sortOrder?: number;
}

export interface TimerLog {
  id: string;
  ticketId: string;
  creatorId: string;
  startedAt: number;
  endedAt: number | null;
}

export type CommentType = 'regular' | 'rejection' | 'system';

export interface Comment {
  id: string;
  ticketId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  content: string;
  createdAt: number;
  type: CommentType;
  parentCommentId: string | null;
}

// Mock seed users
export const MOCK_USERS: User[] = [
  { id: 'admin-1',   name: 'Sarah Connor',  role: 'admin',   avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150' },
  { id: 'creator-a', name: 'Alex Rivera',   role: 'creator', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150' },
  { id: 'creator-b', name: 'Jordan Lee',    role: 'creator', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
  { id: 'creator-c', name: 'Taylor Kim',    role: 'creator', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
];
