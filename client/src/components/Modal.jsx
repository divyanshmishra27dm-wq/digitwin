import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ title, children, onClose, maxWidth = 600, className = '' }) {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(10, 17, 34, 0.65)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        zIndex: 1000,
        overflowY: 'auto',
      }}
    >
      <div
        className={`modal-panel ${className}`}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface, #FFFFFF)',
          borderRadius: 14,
          boxShadow: '0 20px 50px rgba(10, 17, 34, 0.25), 0 0 0 1px rgba(226, 230, 236, 0.8)',
          width: '100%',
          maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth,
          maxHeight: 'calc(90vh - 20px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'modal-in 180ms cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative',
        }}
      >
        {/* Header with Title and Close Button */}
        <div
          className="modal-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid var(--border, #E2E6EC)',
            background: 'var(--surface, #FFFFFF)',
            flexShrink: 0,
            gap: 16,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 17,
              fontWeight: 700,
              color: 'var(--text-primary, #12172A)',
              lineHeight: 1.35,
              wordBreak: 'break-word',
            }}
          >
            {title}
          </h3>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="modal-close-btn"
              style={{
                background: 'var(--surface-muted, #EEF1F5)',
                border: 'none',
                borderRadius: '50%',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-secondary, #5B6472)',
                flexShrink: 0,
                transition: 'all 140ms ease',
              }}
              title="Close (Esc)"
              aria-label="Close"
            >
              <X size={17} />
            </button>
          )}
        </div>

        {/* Scrollable Body */}
        <div
          className="modal-body"
          style={{
            padding: '20px 24px',
            overflowY: 'auto',
            flex: 1,
            color: 'var(--text-primary, #12172A)',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
