import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PhoneCall, Users, Zap, PlusCircle, Sparkles, MessageSquare,
  ArrowRight, Trash2, CheckCircle2, Search, Clock, Volume2
} from 'lucide-react';
import api from '../../services/api.js';
import CallModal from '../../components/CallModal.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import ErrorAlert from '../../components/ErrorAlert.jsx';

export default function CallsList() {
  const navigate = useNavigate();
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [query, setQuery] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const loadCalls = () => {
    setLoading(true);
    setError('');
    api.get('/calls')
      .then(({ data }) => setCalls(data.calls || []))
      .catch(() => setError('Could not load call history.'))
      .finally(() => setLoading(false));
  };

  useEffect(loadCalls, []);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this call and its transcript record?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/calls/${id}`);
      setCalls((prev) => prev.filter((c) => c._id !== id));
    } catch {
      alert('Failed to delete call.');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = calls.filter((c) => {
    const q = query.toLowerCase();
    return (
      (c.title || '').toLowerCase().includes(q) ||
      (c.topic || '').toLowerCase().includes(q) ||
      (c.twins || []).some((t) => (t.name || '').toLowerCase().includes(q))
    );
  });

  return (
    <div>
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex justify-between items-start mb-24" style={{ flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div className="flex items-center gap-8 mb-4">
            <span
              className="badge"
              style={{
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#60a5fa',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <PhoneCall size={12} />
              Spoken AI Conference
            </span>
            <span
              className="badge"
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Volume2 size={12} />
              Speech & Mic Enabled
            </span>
          </div>
          <h1 style={{ fontSize: '1.8rem', margin: '0 0 6px 0' }}>Team Calls & Twin Debates</h1>
          <p className="text-muted" style={{ margin: 0, maxWidth: 680, lineHeight: 1.5 }}>
            Invite Digital Twins to a live voice & video meeting. Talk naturally into your microphone —
            the twins converse, debate architectural trade-offs, ask you questions, and speak aloud in distinct natural voices.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn-accent"
            onClick={() => setShowModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px' }}
          >
            <PhoneCall size={16} /> Start Team Call
          </button>
        </div>
      </div>

      {error && <ErrorAlert message={error} style={{ marginBottom: 20 }} />}

      {/* ── Search & Filter ────────────────────────────────────────── */}
      <div className="card mb-24" style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Search size={18} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input"
            placeholder="Search calls by title, agenda, or participating digital twins…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ border: 'none', background: 'transparent', padding: '6px 0', fontSize: '0.92rem' }}
          />
        </div>
      </div>

      {/* ── Calls List ─────────────────────────────────────────────── */}
      {loading ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading team call sessions…
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={PhoneCall}
          title={query ? 'No matching calls found' : 'No team calls yet'}
          description={
            query
              ? 'Try searching with different keywords.'
              : 'Host your first conference call with NIIT Digital Twins. Experience real-time speech, cross-domain debate, and AI voice responses.'
          }
          actionLabel="Start New Call"
          onAction={() => setShowModal(true)}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
          {filtered.map((c) => {
            const isLive = c.status === 'active';
            const twinList = c.twins || [];
            return (
              <div
                key={c._id}
                className="card"
                onClick={() => navigate(`/calls/${c._id}`)}
                style={{
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  position: 'relative',
                  border: isLive ? '1px solid rgba(16, 185, 129, 0.4)' : undefined,
                  boxShadow: isLive ? '0 4px 20px rgba(16, 185, 129, 0.12)' : undefined,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {isLive ? (
                        <span
                          className="badge"
                          style={{
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#10b981',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            fontWeight: 700,
                          }}
                        >
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              background: '#10b981',
                              boxShadow: '0 0 6px #10b981',
                            }}
                          />
                          LIVE CALL
                        </span>
                      ) : (
                        <span className="badge badge-neutral">Completed</span>
                      )}

                      <span
                        style={{
                          fontSize: '0.74rem',
                          color: 'var(--text-muted)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Clock size={12} /> {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={(e) => handleDelete(e, c._id)}
                      disabled={deletingId === c._id}
                      style={{ color: 'var(--text-muted)', padding: '2px 6px' }}
                      title="Delete Call"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <h3 style={{ margin: '0 0 6px 0', fontSize: '1.08rem', fontWeight: 600 }}>
                    {c.title}
                  </h3>

                  <p
                    className="text-muted"
                    style={{
                      fontSize: '0.84rem',
                      lineHeight: 1.45,
                      margin: '0 0 16px 0',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {c.topic}
                  </p>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: -6 }}>
                      {twinList.slice(0, 4).map((t, idx) => (
                        <div
                          key={t._id || idx}
                          title={`${t.name} (${t.title})`}
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            border: '2px solid var(--bg-surface)',
                            marginLeft: idx > 0 ? -8 : 0,
                          }}
                        >
                          {t.avatarInitials || (t.name || 'T').slice(0, 2).toUpperCase()}
                        </div>
                      ))}
                      {twinList.length > 4 && (
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginLeft: 6 }}>
                          +{twinList.length - 4} more
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 600 }}>
                      <span>{isLive ? 'Join Call Stage' : 'View Summary'}</span>
                      <ArrowRight size={14} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Start Call Modal ───────────────────────────────────────── */}
      <CallModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
}
