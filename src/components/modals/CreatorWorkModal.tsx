import React, { useState, useEffect } from 'react';
import { type Ticket, type User, type Comment, MOCK_USERS } from '../../db/schema';
import { ticketService } from '../../services/ticketService';
import { X, Link2, ExternalLink, Check, MessageSquare, AlertTriangle, Send } from 'lucide-react';

interface Props {
  ticket: Ticket;
  currentUser: User;
  onClose: () => void;
  onRefresh: () => void;
}

export const CreatorWorkModal: React.FC<Props> = ({ ticket, currentUser, onClose, onRefresh }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  const loadComments = () => {
    const all = ticketService.getCommentsForTicket(ticket.id);
    // Only admin-authored comments (regular or rejection) — no system logs
    const adminComments = all.filter(
      c => c.userRole === 'admin' && c.type !== 'system'
    );
    setComments(adminComments);
  };

  useEffect(() => { loadComments(); }, [ticket.id]);

  const handleSubmitForReview = () => {
    if (!confirmSubmit) {
      setConfirmSubmit(true);
      return;
    }
    setSubmitting(true);
    try {
      ticketService.submitTicketForReview(ticket.id);
      onRefresh();
      onClose();
    } catch (err: any) {
      alert(err.message);
      setSubmitting(false);
      setConfirmSubmit(false);
    }
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    ticketService.addUserComment(ticket.id, currentUser.id, replyText.trim());
    setReplyText('');
    loadComments();
  };

  const hasRejection = comments.some(c => c.type === 'rejection');

  const fmtDate = (ts: number) =>
    new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box"
        style={{ maxWidth: '600px' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="modal-header">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse"
              style={{ background: 'var(--accent-primary)', boxShadow: '0 0 6px var(--accent-primary)' }} />
            <div className="min-w-0">
              <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Active Work</p>
              <h3 className="font-display font-bold truncate text-base" style={{ color: 'var(--text-primary)' }}>{ticket.title}</h3>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm p-1.5 rounded-lg flex-shrink-0">
            <X size={18} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="modal-body flex flex-col gap-5">

          {/* 1. THE LINK — Primary action, largest element */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              Profile Link
            </p>
            {ticket.profileUrl ? (
              <a
                href={ticket.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-2xl font-bold text-base transition-all duration-200 group"
                style={{
                  background: 'rgba(255,0,127,0.08)',
                  border: '2px solid rgba(255,0,127,0.3)',
                  color: 'var(--accent-primary)',
                  boxShadow: '0 0 20px rgba(255,0,127,0.1)',
                  wordBreak: 'break-all',
                }}
              >
                <Link2 size={20} style={{ flexShrink: 0 }} />
                <span className="flex-1">{ticket.profileUrl}</span>
                <ExternalLink size={16} style={{ flexShrink: 0, opacity: 0.7 }} className="group-hover:opacity-100 transition-opacity" />
              </a>
            ) : (
              <div className="flex items-center gap-3 p-4 rounded-2xl text-sm"
                style={{ background: 'rgba(120,120,120,0.03)', border: '1px dashed var(--border-color)', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                <Link2 size={16} /> No profile URL was added to this profile.
              </div>
            )}
          </div>

          {/* 2. ADMIN COMMENTS — Only section shown below the link */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <MessageSquare size={14} style={{ color: hasRejection ? 'var(--accent-coral)' : 'var(--text-muted)' }} />
              <p className="text-xs font-bold uppercase tracking-widest"
                style={{ color: hasRejection ? 'var(--accent-coral)' : 'var(--text-muted)' }}>
                {hasRejection ? 'Admin Feedback (Rejection)' : 'Admin Notes'}
              </p>
              {comments.length > 0 && (
                <span className="badge text-xs"
                  style={{
                    background: hasRejection ? 'rgba(239,68,68,0.12)' : 'rgba(139,92,246,0.12)',
                    color: hasRejection ? 'var(--accent-coral)' : 'var(--accent-purple)',
                    border: hasRejection ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(139,92,246,0.2)',
                  }}>
                  {comments.length}
                </span>
              )}
            </div>

            {comments.length === 0 ? (
              <div className="flex items-center gap-3 p-4 rounded-2xl text-sm"
                style={{ background: 'rgba(120, 120, 120, 0.02)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <MessageSquare size={15} style={{ opacity: 0.4 }} />
                No admin notes on this profile. Work from the profile link above.
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {comments.map(c => {
                  const isRejection = c.type === 'rejection';
                  const admin = MOCK_USERS.find(u => u.id === c.userId);
                  return (
                    <div key={c.id} className="rounded-2xl p-4 flex flex-col gap-2"
                      style={{
                        background: isRejection ? 'rgba(239, 68, 68, 0.06)' : 'rgba(139, 92, 246, 0.06)',
                        border: `1.5px solid ${isRejection ? 'rgba(239, 68, 68, 0.25)' : 'rgba(139, 92, 246, 0.2)'}`,
                        boxShadow: isRejection ? '0 0 16px rgba(239, 68, 68, 0.08)' : '0 0 12px rgba(139, 92, 246, 0.05)',
                      }}>
                      {/* Author + timestamp row */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {admin?.avatar && (
                            <img src={admin.avatar} alt="" className="w-6 h-6 rounded-full object-cover"
                              style={{ outline: `2px solid ${isRejection ? 'rgba(239, 68, 68, 0.4)' : 'rgba(139, 92, 246, 0.4)'}` }} />
                          )}
                          <span className="text-sm font-bold"
                            style={{ color: isRejection ? 'var(--accent-coral)' : 'var(--accent-purple)' }}>
                            {c.userName}
                          </span>
                          {isRejection && (
                            <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                              style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--accent-coral)' }}>
                              <AlertTriangle size={9} /> Needs Changes
                            </span>
                          )}
                        </div>
                        <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                          {fmtDate(c.createdAt)}
                        </span>
                      </div>

                      {/* Comment content */}
                      <p className="text-sm leading-relaxed font-medium" style={{ color: 'var(--text-secondary)' }}>
                        {c.content}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Reply to admin */}
            <form onSubmit={handleSendReply} className="flex gap-2 mt-1">
              <input
                className="form-input flex-1 text-sm"
                style={{ padding: '0.6rem 0.9rem' }}
                placeholder="Reply to admin notes..."
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
              />
              <button type="submit" className="btn btn-ghost border" style={{ borderColor: 'var(--border-color)', padding: '0.6rem 0.9rem' }}
                disabled={!replyText.trim()}>
                <Send size={14} />
              </button>
            </form>
          </div>

        </div>

        {/* ── Footer: Submit action ── */}
        <div className="modal-footer" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem' }}>
          {confirmSubmit && (
            <div className="flex items-center gap-2 px-1 pb-1" style={{ color: 'var(--accent-coral)' }}>
              <AlertTriangle size={13} style={{ flexShrink: 0 }} />
              <span className="text-xs font-semibold">
                This will send the profile to admin for review. You won't be able to make changes after.
              </span>
            </div>
          )}
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => { setConfirmSubmit(false); onClose(); }}
              className="btn btn-secondary"
            >
              {confirmSubmit ? 'Cancel' : 'Close'}
            </button>
            <button
              onClick={handleSubmitForReview}
              disabled={submitting}
              className="btn font-bold transition-all duration-200"
              style={confirmSubmit ? {
                background: 'var(--accent-coral)',
                color: '#fff',
                padding: '0.7rem 1.5rem',
                borderColor: 'transparent',
                boxShadow: '0 0 16px rgba(239,68,68,0.35)',
              } : {
                background: '#10b981',
                color: '#fff',
                padding: '0.7rem 1.5rem',
                borderColor: 'transparent',
              }}
            >
              {confirmSubmit
                ? <><AlertTriangle size={15} /> Yes, Submit for Review</>  
                : <><Check size={15} /> Submit for Review</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
