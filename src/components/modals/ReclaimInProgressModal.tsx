import React, { useState } from 'react';
import { type Ticket, type User, type RoutingType, MOCK_USERS } from '../../db/schema';
import { ticketService } from '../../services/ticketService';
import { X, ShieldAlert, Users, UserCheck, Zap, Clock } from 'lucide-react';

interface Props {
  ticket: Ticket;
  currentUser: User;
  onClose: () => void;
  onReclaimed: () => void;
}

export const ReclaimInProgressModal: React.FC<Props> = ({
  ticket, currentUser, onClose, onReclaimed,
}) => {
  const [routingType, setRoutingType] = useState<RoutingType>('all');
  const [targetCreatorId, setTargetCreatorId] = useState('');
  const [escalate, setEscalate] = useState(ticket.isHighPriority);
  const [submitting, setSubmitting] = useState(false);

  const creators = MOCK_USERS.filter(u => u.role === 'creator');
  const currentCreator = MOCK_USERS.find(u => u.id === ticket.assignedCreatorId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (routingType === 'specific' && !targetCreatorId) return;
    setSubmitting(true);
    try {
      ticketService.adminReclaimInProgress(
        ticket.id,
        currentUser.id,
        routingType,
        routingType === 'specific' ? targetCreatorId : null,
        escalate,
      );
      onReclaimed();
      onClose();
    } catch (err: any) {
      alert(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
              <ShieldAlert size={18} style={{ color: 'var(--accent-orange)' }} />
            </div>
            <div>
              <h3 className="font-display font-bold" style={{ color: 'var(--text-primary)' }}>Admin Reclaim</h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Pull this profile back into the Unclaimed queue
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm p-1.5 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="modal-body flex flex-col gap-4">

            {/* Profile info strip */}
            <div className="p-3 rounded-xl border text-sm" style={{ borderColor: 'rgba(255,138,0,0.2)', background: 'rgba(255,138,0,0.04)' }}>
              <p className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{ticket.title}</p>
              {currentCreator && (
                <div className="flex items-center gap-2 mt-1">
                  <Clock size={11} style={{ color: 'var(--accent-orange)' }} />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Currently with <b style={{ color: 'var(--text-secondary)' }}>{currentCreator.name}</b> — timer will be stopped &amp; work time preserved.
                  </span>
                </div>
              )}
            </div>

            {/* Routing */}
            <div className="form-group mb-0">
              <label className="form-label">Re-route to</label>
              <div className="flex flex-col gap-2">

                {/* Public pool */}
                <label className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-150"
                  style={{
                    borderColor: routingType === 'all' ? 'rgba(255,0,127,0.3)' : 'var(--border-color)',
                    background: routingType === 'all' ? 'rgba(255,0,127,0.04)' : 'transparent',
                  }}>
                  <input type="radio" name="reclaimRoute" value="all"
                    checked={routingType === 'all'}
                    onChange={() => setRoutingType('all')}
                    className="accent-pink-500" />
                  <Users size={14} style={{ color: 'var(--accent-primary)' }} />
                  <div>
                    <span className="text-sm font-medium">Public Pool</span>
                    <span className="text-xs ml-1.5" style={{ color: 'var(--text-muted)' }}>— any creator can pick it up next</span>
                  </div>
                </label>

                {/* Specific creator */}
                <label className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-150"
                  style={{
                    borderColor: routingType === 'specific' ? 'rgba(139,92,246,0.3)' : 'var(--border-color)',
                    background: routingType === 'specific' ? 'rgba(139,92,246,0.04)' : 'transparent',
                  }}>
                  <input type="radio" name="reclaimRoute" value="specific"
                    checked={routingType === 'specific'}
                    onChange={() => {
                      setRoutingType('specific');
                      if (creators.length) setTargetCreatorId(creators[0].id);
                    }}
                    className="accent-purple-500" />
                  <UserCheck size={14} style={{ color: 'var(--accent-purple)' }} />
                  <span className="text-sm font-medium">Specific Creator</span>
                </label>
              </div>
            </div>

            {/* Creator select */}
            {routingType === 'specific' && (
              <div className="form-group mb-0">
                <label className="form-label">Assign to</label>
                <select className="form-select" value={targetCreatorId}
                  onChange={e => setTargetCreatorId(e.target.value)} required>
                  <option value="">-- Select Creator --</option>
                  {creators.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* High priority escalation toggle */}
            <div
              className="flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-150"
              style={{
                borderColor: escalate ? 'rgba(239,68,68,0.4)' : 'var(--border-color)',
                background: escalate ? 'rgba(239,68,68,0.05)' : 'rgba(120,120,120,0.02)',
              }}
              onClick={() => setEscalate(v => !v)}
            >
              <div className="flex items-center gap-2">
                <Zap size={14} style={{ color: escalate ? 'var(--accent-coral)' : 'var(--text-muted)' }} />
                <div>
                  <span className="text-sm font-medium"
                    style={{ color: escalate ? 'var(--accent-coral)' : 'var(--text-secondary)' }}>
                    Escalate as High Priority
                  </span>
                  <span className="text-xs ml-1.5" style={{ color: 'var(--text-muted)' }}>— jumps to top of queue</span>
                </div>
              </div>
              <div className={`w-10 h-5 rounded-full relative transition-all duration-200 ${escalate ? 'bg-red-500' : 'bg-gray-700'}`}>
                <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all duration-200 ${escalate ? 'left-5' : 'left-0.5'}`} />
              </div>
            </div>

          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button
              type="submit"
              className="btn"
              style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--accent-orange)', border: '1px solid rgba(245,158,11,0.35)', fontWeight: 600 }}
              disabled={submitting || (routingType === 'specific' && !targetCreatorId)}
            >
              <ShieldAlert size={14} /> Reclaim &amp; Re-queue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
