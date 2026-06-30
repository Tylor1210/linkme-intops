import React, { useState } from 'react';
import { type Ticket, type User, type RoutingType, MOCK_USERS } from '../../db/schema';
import { ticketService } from '../../services/ticketService';
import { X, RefreshCw, Users, UserCheck, Zap } from 'lucide-react';

interface Props {
  ticket: Ticket;
  currentUser: User;
  onClose: () => void;
  onRecalled: () => void;
}

export const RecallModal: React.FC<Props> = ({ ticket, currentUser, onClose, onRecalled }) => {
  const [routingType, setRoutingType] = useState<RoutingType>('all');
  const [targetCreatorId, setTargetCreatorId] = useState('');
  const [isHighPriority, setIsHighPriority] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const creators = MOCK_USERS.filter(u => u.role === 'creator');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (routingType === 'specific' && !targetCreatorId) return;
    setSubmitting(true);
    try {
      ticketService.recallMajorTweak(
        ticket.id, currentUser.id,
        routingType,
        routingType === 'specific' ? targetCreatorId : null,
        isHighPriority,
      );
      onRecalled();
      onClose();
    } catch (err: any) {
      alert(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: '460px' }} onClick={e => e.stopPropagation()}>

        <div className="modal-header">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(161,140,209,0.15)' }}>
              <RefreshCw size={16} style={{ color: 'var(--accent-purple)' }} />
            </div>
            <div>
              <h3 className="font-display font-bold" style={{ color: 'var(--text-primary)' }}>Major Tweak Recall</h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{ticket.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm p-1.5 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body flex flex-col gap-4">
            <div className="p-3 rounded-xl border text-sm" style={{ borderColor: 'rgba(139,92,246,0.2)', background: 'rgba(139,92,246,0.05)', color: 'var(--text-secondary)' }}>
              This will <strong style={{ color: 'var(--text-primary)' }}>fully reset</strong> this profile back to the Unclaimed Pool. Choose who should pick it up next.
            </div>

            {/* Routing */}
            <div className="form-group mb-0">
              <label className="form-label">Route to</label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-150"
                  style={{
                    borderColor: routingType === 'all' ? 'rgba(255,0,127,0.3)' : 'var(--border-color)',
                    background: routingType === 'all' ? 'rgba(255,0,127,0.04)' : 'transparent',
                  }}>
                  <input type="radio" name="routeType" value="all" checked={routingType === 'all'}
                    onChange={() => setRoutingType('all')} className="accent-pink-500" />
                  <Users size={13} style={{ color: 'var(--accent-primary)' }} />
                  <span className="text-sm font-medium">Public Pool — any creator can claim</span>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-150"
                  style={{
                    borderColor: routingType === 'specific' ? 'rgba(139,92,246,0.3)' : 'var(--border-color)',
                    background: routingType === 'specific' ? 'rgba(139,92,246,0.04)' : 'transparent',
                  }}>
                  <input type="radio" name="routeType" value="specific" checked={routingType === 'specific'}
                    onChange={() => { setRoutingType('specific'); if (creators.length) setTargetCreatorId(creators[0].id); }}
                    className="accent-purple-500" />
                  <UserCheck size={13} style={{ color: 'var(--accent-purple)' }} />
                  <span className="text-sm font-medium">Specific Creator</span>
                </label>
              </div>
            </div>

            {routingType === 'specific' && (
              <div className="form-group mb-0">
                <label className="form-label">Assign to</label>
                <select className="form-select" value={targetCreatorId} onChange={e => setTargetCreatorId(e.target.value)} required>
                  <option value="">-- Select Creator --</option>
                  {creators.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}

            {/* High Priority */}
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
                  Flag as High Priority
                </span>
              </div>
              <div className={`w-10 h-5 rounded-full relative transition-all duration-200 ${isHighPriority ? 'bg-red-500' : 'bg-gray-700'}`}>
                <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all duration-200 ${isHighPriority ? 'left-5' : 'left-0.5'}`} />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button
              type="submit"
              className="btn"
              style={{ background: 'rgba(161,140,209,0.15)', color: 'var(--accent-purple)', border: '1px solid rgba(161,140,209,0.3)' }}
              disabled={submitting || (routingType === 'specific' && !targetCreatorId)}
            >
              <RefreshCw size={14} /> Reset &amp; Recall
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
