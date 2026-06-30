import React, { useState, useEffect } from 'react';
import { type Ticket, type User, type Comment, type TimerLog, MOCK_USERS } from '../../db/schema';
import { ticketService } from '../../services/ticketService';
import { X, Send, Clock, Play, ChevronRight, MessageSquare, CornerDownRight, Check, AlertTriangle, Link2 } from 'lucide-react';

interface Props {
  ticketId: string;
  currentUser: User;
  onClose: () => void;
  onRefresh: () => void;
}

export const TicketDetailsModal: React.FC<Props> = ({ ticketId, currentUser, onClose, onRefresh }) => {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [timerLogs, setTimerLogs] = useState<TimerLog[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [liveMetrics, setLiveMetrics] = useState({ timeInStage: 0, totalInProgressTime: 0 });

  const load = () => {
    const t = ticketService.getTickets().find(t => t.id === ticketId);
    if (t) {
      setTicket(t);
      setComments(ticketService.getCommentsForTicket(ticketId));
      setTimerLogs(ticketService.getTimerLogsForTicket(ticketId));
      setLiveMetrics(ticketService.calculateLiveTime(t));
    }
  };

  useEffect(() => { load(); }, [ticketId]);

  useEffect(() => {
    if (!ticket || ticket.stage !== 'in_progress') return;
    const interval = setInterval(() => setLiveMetrics(ticketService.calculateLiveTime(ticket!)), 1000);
    return () => clearInterval(interval);
  }, [ticket]);

  if (!ticket) return null;

  const isAdmin = currentUser.role === 'admin';
  const isCreator = currentUser.role === 'creator';
  const assignedCreator = MOCK_USERS.find(u => u.id === ticket.assignedCreatorId);
  const canSubmit = isCreator && ticket.stage === 'in_progress' && ticket.assignedCreatorId === currentUser.id;

  const fmt = (ms: number) => {
    if (ms <= 0) return '0s';
    const s = Math.floor((ms / 1000) % 60);
    const m = Math.floor((ms / 60000) % 60);
    const h = Math.floor(ms / 3600000);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const fmtDate = (ts: number) => new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const handleSubmitForReview = () => {
    try { ticketService.submitTicketForReview(ticket.id); load(); onRefresh(); } catch (err: any) { alert(err.message); }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    ticketService.addUserComment(ticket.id, currentUser.id, newComment, replyToId);
    setNewComment(''); setReplyToId(null); load();
  };

  const parentComments = comments.filter(c => c.parentCommentId === null);

  const stageBadge = {
    unclaimed: <span className="badge badge-unclaimed">Unclaimed</span>,
    in_progress: <span className="badge badge-progress">In Progress</span>,
    in_review: <span className="badge badge-review">In Review</span>,
    approved: <span className="badge badge-approved">Completed</span>,
  }[ticket.stage];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '860px', height: '85vh' }}
      >
        {/* Header */}
        <div className="modal-header flex-shrink-0">
          <div className="flex flex-col gap-1 min-w-0 flex-1 mr-3">
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              <span>Profile</span><ChevronRight size={11} /><span className="font-mono">{ticket.id}</span>
            </div>
            <h3 className="text-lg font-display font-bold flex items-center gap-2 truncate" style={{ color: 'var(--text-primary)' }}>
              {ticket.title}
              {ticket.isHighPriority && <span className="badge badge-high flex-shrink-0"><AlertTriangle size={10} /> HIGH</span>}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">{stageBadge}</div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm p-1.5 rounded-lg flex-shrink-0">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">

          {/* Left: Description + Comments */}
          <div className="flex-1 flex flex-col gap-5 p-5 overflow-y-auto border-r" style={{ borderColor: 'var(--border-color)' }}>

            {/* Profile URL (when set) */}
            {ticket.profileUrl && (
              <div className="flex items-center gap-2 p-3 rounded-xl border text-sm" style={{ borderColor: 'rgba(255,0,127,0.2)', background: 'rgba(255,0,127,0.04)' }}>
                <Link2 size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                <a href={ticket.profileUrl} target="_blank" rel="noopener noreferrer"
                  className="font-medium truncate hover:underline"
                  style={{ color: 'var(--accent-primary)' }}>
                  {ticket.profileUrl}
                </a>
              </div>
            )}

            {/* Description */}
            <div>
              <h5 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Requirements</h5>
              <div className="rounded-xl p-4 text-sm leading-relaxed" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                {ticket.description}
              </div>
            </div>

            {/* Comments */}
            <div className="flex flex-col gap-3 flex-1">
              <h5 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                <MessageSquare size={12} /> Activity Log
              </h5>
              <div className="flex flex-col gap-2">
                {parentComments.length === 0 ? (
                  <p className="text-center text-sm py-6" style={{ color: 'var(--text-muted)' }}>No activity yet on this ticket.</p>
                ) : parentComments.map(c => {
                  const replies = comments.filter(r => r.parentCommentId === c.id);
                  const isSystem = c.type === 'system';
                  const isRejection = c.type === 'rejection';
                  const avatar = MOCK_USERS.find(u => u.id === c.userId)?.avatar;
                  return (
                    <div key={c.id} className="flex flex-col gap-1.5">
                      <div className="rounded-xl p-3 text-sm" style={{
                        background: isRejection ? 'rgba(255,94,98,0.05)' : isSystem ? 'rgba(255,255,255,0.015)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isRejection ? 'rgba(255,94,98,0.15)' : isSystem ? 'rgba(255,255,255,0.04)' : 'var(--border-color)'}`,
                      }}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            {!isSystem && avatar && <img src={avatar} alt="" className="w-5 h-5 rounded-full object-cover" />}
                            <span className="font-semibold text-sm" style={{ color: isRejection ? 'var(--accent-coral)' : isSystem ? 'var(--text-muted)' : 'var(--text-primary)', fontSize: isSystem ? '0.75rem' : undefined }}>
                              {c.userName}
                            </span>
                            {isRejection && <span className="badge badge-high text-xs py-0"><AlertTriangle size={9} /> Rejection</span>}
                          </div>
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{fmtDate(c.createdAt)}</span>
                        </div>
                        <p style={{ color: isSystem ? 'var(--text-muted)' : 'var(--text-secondary)', fontStyle: isSystem ? 'italic' : 'normal', fontSize: isSystem ? '0.75rem' : '0.85rem', lineHeight: '1.5' }}>
                          {c.content}
                        </p>
                        {!isSystem && (
                          <button onClick={() => setReplyToId(replyToId === c.id ? null : c.id)}
                            className="mt-1.5 text-xs flex items-center gap-1"
                            style={{ color: replyToId === c.id ? 'var(--accent-primary)' : 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                            <CornerDownRight size={10} />
                            {replyToId === c.id ? 'Cancel' : 'Reply'}
                          </button>
                        )}
                      </div>
                      {replies.map(r => (
                        <div key={r.id} className="flex gap-2 pl-5">
                          <div className="w-0.5 rounded-full self-stretch" style={{ background: 'var(--border-color)' }} />
                          <div className="flex-1 rounded-xl p-2.5 text-sm" style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid var(--border-color)' }}>
                            <div className="flex items-center gap-1.5 mb-1">
                              {MOCK_USERS.find(u => u.id === r.userId)?.avatar && (
                                <img src={MOCK_USERS.find(u => u.id === r.userId)!.avatar} alt="" className="w-4 h-4 rounded-full object-cover" />
                              )}
                              <span className="font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>{r.userName}</span>
                              <span className="text-xs" style={{ color: 'var(--text-muted)', marginLeft: 'auto' }}>{fmtDate(r.createdAt)}</span>
                            </div>
                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{r.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>

              {/* Comment input */}
              <form onSubmit={handleAddComment} className="mt-auto pt-3 border-t flex flex-col gap-2" style={{ borderColor: 'var(--border-color)' }}>
                {replyToId && (
                  <div className="flex items-center justify-between text-xs px-2 py-1 rounded-lg" style={{ background: 'rgba(0,242,254,0.05)', color: 'var(--accent-primary)' }}>
                    <span>Replying to <b>{comments.find(c => c.id === replyToId)?.userName}</b></span>
                    <button type="button" onClick={() => setReplyToId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-coral)' }}>Cancel</button>
                  </div>
                )}
                <div className="flex gap-2">
                  <input className="form-input flex-1" style={{ padding: '0.6rem 0.9rem' }}
                    placeholder={replyToId ? 'Write a reply...' : 'Add a comment or note...'}
                    value={newComment} onChange={e => setNewComment(e.target.value)} />
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 0.9rem' }} disabled={!newComment.trim()}>
                    <Send size={14} />
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right: Metadata + Timers */}
          <div className="flex flex-col gap-5 p-5 overflow-y-auto" style={{ width: '240px', flexShrink: 0, background: 'rgba(0,0,0,0.08)' }}>

            {/* Stage & Owner */}
            <div>
              <h5 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Details</h5>
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: 'var(--text-secondary)' }}>Assigned:</span>
                  <div className="flex items-center gap-1.5">
                    {assignedCreator ? (
                      <><img src={assignedCreator.avatar} alt="" className="w-4 h-4 rounded-full object-cover" />
                      <span className="font-medium text-xs">{assignedCreator.name.split(' ')[0]}</span></>
                    ) : <span className="text-xs italic" style={{ color: 'var(--text-muted)' }}>Unassigned</span>}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                  <span>Created:</span><span>{fmtDate(ticket.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Timer Section — Admin only */}
            {isAdmin && (
              <>
                <div>
                  <h5 className="text-xs font-semibold uppercase tracking-wider mb-2.5" style={{ color: 'var(--text-muted)' }}>Timers</h5>
                  <div className="rounded-xl p-3 flex flex-col gap-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
                    <div className="flex justify-between items-center text-xs">
                      <span className="flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}><Clock size={10} /> In Stage:</span>
                      <span className="font-semibold">{fmt(liveMetrics.timeInStage)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}><Play size={10} style={{ color: ticket.stage === 'in_progress' ? 'var(--accent-primary)' : undefined }} /> Work Time:</span>
                      <span className="font-bold flex items-center gap-1" style={{ color: ticket.stage === 'in_progress' ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                        {fmt(liveMetrics.totalInProgressTime)}
                        {ticket.stage === 'in_progress' && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--accent-primary)', boxShadow: '0 0 6px var(--accent-primary)' }} />}
                      </span>
                    </div>
                  </div>
                </div>
                {timerLogs.length > 0 && (
                  <div>
                    <h5 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Time Audit Log</h5>
                    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
                      {timerLogs.map(log => (
                        <div key={log.id} className="px-3 py-2 text-xs border-b last:border-b-0 flex flex-col gap-0.5" style={{ borderColor: 'var(--border-color)', background: 'rgba(0,0,0,0.1)' }}>
                          <div className="flex justify-between">
                            <span>{MOCK_USERS.find(u => u.id === log.creatorId)?.name.split(' ')[0]}</span>
                            <span style={{ color: log.endedAt ? 'var(--text-primary)' : 'var(--accent-primary)' }}>
                              {log.endedAt ? fmt(log.endedAt - log.startedAt) : 'ACTIVE'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Creator-only: minimal status */}
            {isCreator && (
              <div className="rounded-xl p-3 text-sm font-semibold flex items-center gap-2" style={{
                background: ticket.stage === 'in_progress' ? 'rgba(0,242,254,0.06)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${ticket.stage === 'in_progress' ? 'rgba(0,242,254,0.2)' : 'var(--border-color)'}`,
                color: ticket.stage === 'in_progress' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              }}>
                {ticket.stage === 'in_progress' && <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--accent-primary)' }} />}
                {ticket.stage === 'in_progress' ? 'Active — In Progress' : ticket.stage === 'in_review' ? 'Awaiting Review' : ticket.stage.replace('_', ' ')}
              </div>
            )}

            {/* Creator: Submit action */}
            {canSubmit && (
              <div className="mt-auto">
                <button onClick={handleSubmitForReview} className="btn btn-success w-full" style={{ padding: '0.75rem' }}>
                  <Check size={15} /> Submit for Review
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
