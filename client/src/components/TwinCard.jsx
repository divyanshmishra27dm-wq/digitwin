import { useNavigate } from 'react-router-dom';
import { Building2, Globe, Lock, Clock } from 'lucide-react';

export default function TwinCard({ twin }) {
  const navigate = useNavigate();

  const isGlobal = twin.visibility === 'all';
  const isPending = twin.globalAccessRequest?.status === 'pending';

  return (
    <div className="twin-card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', marginBottom: 10 }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: '0.72rem',
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: 6,
            background: 'rgba(59, 130, 246, 0.1)',
            color: '#3b82f6',
            border: '1px solid rgba(59, 130, 246, 0.2)',
          }}
        >
          <Building2 size={11} /> {twin.dept || 'Engineering'}
        </span>

        {isGlobal ? (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: '0.72rem',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 6,
              background: 'rgba(16, 185, 129, 0.1)',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.2)',
            }}
            title="Available to all NIIT departments"
          >
            <Globe size={11} /> All NIIT
          </span>
        ) : isPending ? (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: '0.72rem',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 6,
              background: 'rgba(245, 158, 11, 0.1)',
              color: '#f59e0b',
              border: '1px solid rgba(245, 158, 11, 0.2)',
            }}
            title="Global access requested — awaiting admin approval"
          >
            <Clock size={11} /> Pending All NIIT
          </span>
        ) : (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: '0.72rem',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 6,
              background: 'var(--bg-secondary)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)',
            }}
            title={`Department restricted to ${twin.dept || 'Department'}`}
          >
            <Lock size={11} /> Dept Only
          </span>
        )}
      </div>

      <div className="twin-avatar">{twin.avatarInitials || twin.name?.slice(0, 2)}</div>
      <h3>{twin.name}</h3>
      <div className="role">{twin.title}</div>
      <div className="org">{twin.organization}</div>
      <div className="tags">{(twin.expertise || []).slice(0, 3).join(' • ')}</div>

      {twin.status === 'published' && (
        <div className="avail" style={{ marginTop: 'auto', marginBottom: 12 }}>
          <span className="status-live-dot" /> Online
        </div>
      )}

      <button className="btn btn-primary" onClick={() => navigate(`/twins/${twin._id}`)}>
        Explore Twin
      </button>
    </div>
  );
}
