import React from 'react';
import { type Ticket } from '../../db/schema';
import { ArrowDown, Link2, ExternalLink, CheckCircle, Layers } from 'lucide-react';

interface Props {
  queue: Ticket[];
  onClaimTop: () => void;
}

export const CreatorStackView: React.FC<Props> = ({ queue, onClaimTop }) => {
  // Show only top 3 for the visual stack preview
  const top3 = queue.slice(0, 3);
  const topTicket = queue[0] ?? null;

  if (queue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-16 px-6 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 mx-auto"
          style={{ background: 'rgba(0,245,160,0.1)', border: '1px solid rgba(0,245,160,0.2)' }}>
          <CheckCircle size={28} style={{ color: 'var(--accent-mint)' }} />
        </div>
        <h3 className="font-display font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>All caught up!</h3>
        <p className="text-sm" style={{ color: 'var(--text-muted)', maxWidth: '220px' }}>
          No tasks available right now. Check back later — new profiles will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 p-4 flex-1">
      {/* Stack count indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
          <Layers size={14} />
          <span><b style={{ color: 'var(--text-primary)' }}>{queue.length}</b> profile{queue.length !== 1 ? 's' : ''} in queue</span>
        </div>
        {topTicket?.isHighPriority && (
          <span className="badge badge-high animate-pulse-text text-xs">URGENT</span>
        )}
      </div>

      {/* Visual stacked cards */}
      <div className="relative flex flex-col items-center" style={{ minHeight: `${Math.min(top3.length, 3) * 18 + 180}px` }}>
        {/* Background ghost cards (bottom of stack) */}
        {top3.slice(1).reverse().map((t, i) => {
          const offset = (top3.slice(1).length - 1 - i);
          return (
            <div
              key={t.id}
              className="absolute w-full rounded-2xl"
              style={{
                top: `${(offset + 1) * 10}px`,
                left: `${(offset + 1) * 6}px`,
                right: `${(offset + 1) * 6}px`,
                height: '80px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                opacity: 0.4 + offset * 0.2,
                transform: `scale(${1 - (offset + 1) * 0.04})`,
                transformOrigin: 'bottom center',
                borderRadius: '16px',
                zIndex: offset,
              }}
            />
          );
        })}

        {/* TOP card — the one that will be claimed */}
        {topTicket && (
          <div
            className="stack-card relative w-full flex flex-col gap-3"
            style={{
              zIndex: 10,
              boxShadow: topTicket.isHighPriority
                ? '0 8px 32px rgba(255,94,98,0.25), 0 0 0 1px rgba(255,94,98,0.3)'
                : '0 8px 32px rgba(0,0,0,0.4)',
              borderColor: topTicket.isHighPriority ? 'rgba(255,94,98,0.4)' : 'rgba(255,255,255,0.12)',
            }}
          >
            {/* Priority strip */}
            {topTicket.isHighPriority && (
              <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: 'linear-gradient(90deg, var(--accent-coral), transparent)' }} />
            )}

            {/* Field 1: Profile URL — the primary action link */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                Profile Link
              </p>
              {topTicket.profileUrl ? (
                <a
                  href={topTicket.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:brightness-110"
                  style={{
                    background: 'rgba(0,242,254,0.08)',
                    border: '1px solid rgba(0,242,254,0.2)',
                    color: 'var(--accent-primary)',
                    wordBreak: 'break-all',
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  <Link2 size={14} style={{ flexShrink: 0 }} />
                  <span className="truncate">{topTicket.profileUrl}</span>
                  <ExternalLink size={12} style={{ flexShrink: 0, marginLeft: 'auto' }} />
                </a>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  <Link2 size={13} /> No URL provided
                </div>
              )}
            </div>

            {/* Divider */}
            <div style={{ borderTop: '1px solid var(--border-color)' }} />

            {/* Field 2: Requirements / Description */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                Requirements
              </p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {topTicket.description}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* CTA: Claim Top Profile */}
      <div className="flex flex-col items-center gap-2 mt-auto">
        {queue.length > 1 && (
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
            <ArrowDown size={12} />
            <span>{queue.length - 1} more profile{queue.length - 1 !== 1 ? 's' : ''} waiting</span>
          </div>
        )}
        <button
          onClick={onClaimTop}
          className="btn btn-primary w-full btn-lg font-bold"
          style={{
            boxShadow: topTicket?.isHighPriority
              ? '0 0 20px rgba(239, 68, 68, 0.4)'
              : '0 0 20px rgba(255, 0, 127, 0.2)',
          }}
        >
          Claim Top Profile
        </button>
      </div>
    </div>
  );
};
