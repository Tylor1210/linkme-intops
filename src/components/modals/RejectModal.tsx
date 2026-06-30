import React, { useState } from 'react';
import { type Ticket, type User, type RejectionRoutingOption, MOCK_USERS } from '../../db/schema';
import { ticketService } from '../../services/ticketService';
import { X, AlertTriangle, Users, UserCheck, RotateCcw, Zap } from 'lucide-react';

interface Props {
  ticket: Ticket;
  currentUser: User;
  onClose: () => void;
  onRejected: () => void;
}

export const RejectModal: React.FC<Props> = ({ ticket, currentUser, onClose, onRejected }) => {
  const [reason, setReason] = useState('');
  const [routing, setRouting] = useState<RejectionRoutingOption>('same_creator');
  const [targetCreatorId, setTargetCreatorId] = useState('');
  const [isHighPriority, setIsHighPriority] = useState(ticket.isHighPriority);
  const [submitting, setSubmitting] = useState(false);

  const creators = MOCK_USERS.filter(u => u.role === 'creator' && u.id !== ticket.assignedCreatorId);
  const originalCreator = MOCK_USERS.find(u => u.id === ticket.assignedCreatorId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    if (routing === 'different_creator' && !targetCreatorId) return;
    setSubmitting(true);
    try {
      ticketService.rejectTicket(
        ticket.id, currentUser.id, reason,
        routing,
        routing === 'different_creator' ? targetCreatorId : undefined,
        isHighPriority,
      );
      onRejected();
      onClose();
    } catch (err: any) {
      alert(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,94,98,0.15)' }}>
              <AlertTriangle size={16} style={{ color: 'var(--accent-coral)' }} />
            </div>
            <div>
              <h3 className="font-display font-bold" style={{ color: 'var(--text-primary)' }}>Reject Profile</h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{ticket.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm p-1.5 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body flex flex-col gap-4">

            {/* Rejection Reason */}
            <div className="form-group mb-0">
              <label className="form-label" style={{ color: 'var(--accent-coral)' }}>
                Rejection Reason <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>(required — shown to creator)</span>
              </label>
              <textarea
                className="form-textarea"
                placeholder="Explain clearly what needs to be changed or why this work doesn't meet the requirements..."
                value={reason}
                onChange={e => setReason(e.target.value)}
                required
                autoFocus
                style={{ borderColor: 'rgba(255,94,98,0.3)', minHeight: '100px' }}
              />
            </div>

            {/* High Priority Toggle */}
            <div
              className="flex items-center justify-between p-3 rounded-xl border cursor-pointer"
              style={{
                borderColor: isHighPriority ? 'rgba(239,68,68,0.4)' : 'var(--border-color)',
                background: isHighPriority ? 'rgba(239,68,68,0.05)' : 'rgba(120,120,120,0.02)',
              }}
              onClick={() => setIsHighPriority(v => !v)}
            >
              <div className="flex items-center gap-2">
                <Zap size={13} style={{ color: isHighPriority ? 'var(--accent-coral)' : 'var(--text-muted)' }} />
                <span className="text-sm" style={{ color: isHighPriority ? 'var(--accent-coral)' : 'var(--text-secondary)' }}>
                  Escalate as High Priority
                </span>
              </div>
              <div className={`w-10 h-5 rounded-full relative transition-all duration-200 ${isHighPriority ? 'bg-red-500' : 'bg-gray-700'}`}>
                <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all duration-200 ${isHighPriority ? 'left-5' : 'left-0.5'}`} />
              </div>
            </div>

            {/* Routing Options */}
            <div className="form-group mb-0">
              <label className="form-label">Re-route To</label>
              <div className="flex flex-col gap-2">
                {/* Same Creator */}
                <label className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-150"
                  style={{
                    borderColor: routing === 'same_creator' ? 'rgba(255,0,127,0.3)' : 'var(--border-color)',
                    background: routing === 'same_creator' ? 'rgba(255,0,127,0.04)' : 'transparent',
                  }}>
                  <input type="radio" name="route" value="same_creator" checked={routing === 'same_creator'}
                    onChange={() => setRouting('same_creator')} className="accent-pink-500" />
                  <RotateCcw size={13} style={{ color: 'var(--accent-primary)' }} />
                  <div>
                    <span className="text-sm font-medium">Return to same creator</span>
                    {originalCreator && (
                      <span className="text-xs ml-1" style={{ color: 'var(--text-muted)' }}>({originalCreator.name})</span>
                    )}
                  </div>
                </label>

                {/* Different Creator */}
                <label className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-150"
                  style={{
                    borderColor: routing === 'different_creator' ? 'rgba(139,92,246,0.3)' : 'var(--border-color)',
                    background: routing === 'different_creator' ? 'rgba(139,92,246,0.04)' : 'transparent',
                  }}>
                  <input type="radio" name="route" value="different_creator" checked={routing === 'different_creator'}
                    onChange={() => { setRouting('different_creator'); if (creators.length) setTargetCreatorId(creators[0].id); }}
                    className="accent-purple-500" />
                  <UserCheck size={13} style={{ color: 'var(--accent-purple)' }} />
                  <span className="text-sm font-medium">Route to different creator</span>
                </label>

                {/* All Creators */}
                <label className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-150"
                  style={{
                    borderColor: routing === 'all_creators' ? 'rgba(255,138,0,0.3)' : 'var(--border-color)',
                    background: routing === 'all_creators' ? 'rgba(255,138,0,0.04)' : 'transparent',
                  }}>
                  <input type="radio" name="route" value="all_creators" checked={routing === 'all_creators'}
                    onChange={() => setRouting('all_creators')} className="accent-orange-500" />
                  <Users size={13} style={{ color: 'var(--accent-orange)' }} />
                  <span className="text-sm font-medium">Return to Public Pool</span>
                </label>
              </div>
            </div>

            {routing === 'different_creator' && (
              <div className="form-group mb-0">
                <label className="form-label">Select Creator</label>
                <select className="form-select" value={targetCreatorId}
                  onChange={e => setTargetCreatorId(e.target.value)} required>
                  <option value="">-- Select --</option>
                  {creators.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button
              type="submit"
              className="btn btn-danger"
              disabled={submitting || !reason.trim() || (routing === 'different_creator' && !targetCreatorId)}
            >
              Confirm Rejection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
