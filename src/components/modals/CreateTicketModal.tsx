import React, { useState } from 'react';
import { type RoutingType, MOCK_USERS } from '../../db/schema';
import { ticketService } from '../../services/ticketService';
import { X, Link2, FileText, Users, UserCheck, Zap } from 'lucide-react';

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export const CreateTicketModal: React.FC<Props> = ({ onClose, onCreated }) => {
  const [title, setTitle] = useState('');
  const [profileUrl, setProfileUrl] = useState('');
  const [description, setDescription] = useState('');
  const [routingType, setRoutingType] = useState<RoutingType>('all');
  const [assignedCreatorId, setAssignedCreatorId] = useState('');
  const [isHighPriority, setIsHighPriority] = useState(false);

  const creators = MOCK_USERS.filter(u => u.role === 'creator');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    if (routingType === 'specific' && !assignedCreatorId) return;

    ticketService.createTicket(
      title.trim(),
      profileUrl.trim() || null,
      description.trim(),
      routingType,
      routingType === 'specific' ? assignedCreatorId : null,
      isHighPriority,
    );
    onCreated();
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: '560px' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header">
          <div>
            <h3 className="text-lg font-display font-bold" style={{ color: 'var(--text-primary)' }}>New Profile Request</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Creates a new ticket in the Unclaimed Pool
            </p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm p-1.5 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body flex flex-col gap-4">

            {/* Title */}
            <div className="form-group mb-0">
              <label className="form-label flex items-center gap-1.5">
                <FileText size={13} /> Profile Title / Name
              </label>
              <input
                className="form-input"
                placeholder="e.g. Refresh Instagram Creator Portfolio"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                autoFocus
              />
            </div>

            {/* Profile URL */}
            <div className="form-group mb-0">
              <label className="form-label flex items-center gap-1.5">
                <Link2 size={13} /> Profile URL <span style={{ color: 'var(--text-muted)' }}>(shown to creators as their direct work link)</span>
              </label>
              <input
                className="form-input"
                placeholder="https://linkme.to/profile-slug"
                value={profileUrl}
                onChange={e => setProfileUrl(e.target.value)}
                type="url"
              />
            </div>

            {/* Description */}
            <div className="form-group mb-0">
              <label className="form-label flex items-center gap-1.5">
                <FileText size={13} /> Requirements &amp; Description
              </label>
              <textarea
                className="form-textarea"
                placeholder="Describe exactly what needs to be done, any brand guidelines, constraints, or acceptance criteria..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
                style={{ minHeight: '110px' }}
              />
            </div>

            {/* Routing */}
            <div className="form-group mb-0">
              <label className="form-label">Routing</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <label className="flex items-center gap-2 cursor-pointer flex-1 p-3 rounded-xl border transition-all duration-150"
                  style={{
                    borderColor: routingType === 'all' ? 'rgba(255,0,127,0.3)' : 'var(--border-color)',
                    background: routingType === 'all' ? 'rgba(255,0,127,0.04)' : 'transparent',
                  }}>
                  <input type="radio" name="routing" value="all" checked={routingType === 'all'}
                    onChange={() => setRoutingType('all')} className="accent-pink-500" />
                  <Users size={14} style={{ color: 'var(--accent-primary)' }} />
                  <span className="text-sm font-medium">All Creators</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer flex-1 p-3 rounded-xl border transition-all duration-150"
                  style={{
                    borderColor: routingType === 'specific' ? 'rgba(139,92,246,0.3)' : 'var(--border-color)',
                    background: routingType === 'specific' ? 'rgba(139,92,246,0.04)' : 'transparent',
                  }}>
                  <input type="radio" name="routing" value="specific" checked={routingType === 'specific'}
                    onChange={() => setRoutingType('specific')} className="accent-purple-500" />
                  <UserCheck size={14} style={{ color: 'var(--accent-purple)' }} />
                  <span className="text-sm font-medium">Specific Creator</span>
                </label>
              </div>
            </div>

            {routingType === 'specific' && (
              <div className="form-group mb-0">
                <label className="form-label">Assign to Creator</label>
                <select className="form-select" value={assignedCreatorId}
                  onChange={e => setAssignedCreatorId(e.target.value)} required>
                  <option value="">-- Select Creator --</option>
                  {creators.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* High Priority Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-150 gap-2"
              style={{
                borderColor: isHighPriority ? 'rgba(239,68,68,0.4)' : 'var(--border-color)',
                background: isHighPriority ? 'rgba(239,68,68,0.05)' : 'rgba(120,120,120,0.02)',
              }}
              onClick={() => setIsHighPriority(v => !v)}>
              <div className="flex items-center gap-2 flex-wrap">
                <Zap size={14} style={{ color: isHighPriority ? 'var(--accent-coral)' : 'var(--text-muted)' }} />
                <span className="text-sm font-medium" style={{ color: isHighPriority ? 'var(--accent-coral)' : 'var(--text-secondary)' }}>
                  Flag as High Priority
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>— pins to top of stack</span>
              </div>
              <div className={`w-10 h-5 rounded-full transition-all duration-200 relative ${isHighPriority ? 'bg-red-500' : 'bg-gray-700'}`}>
                <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all duration-200 ${isHighPriority ? 'left-5' : 'left-0.5'}`} />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!title.trim() || !description.trim() || (routingType === 'specific' && !assignedCreatorId)}
            >
              Create Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
