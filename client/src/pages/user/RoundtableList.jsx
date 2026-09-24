import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users2, PlusCircle, Sparkles, MessageSquare, ArrowRight, Trash2, CheckCircle2, Search } from 'lucide-react';
import api from '../../services/api.js';
import SummonModal from '../../components/SummonModal.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import ErrorAlert from '../../components/ErrorAlert.jsx';

const MODE_LABELS = {
  problem_solving: 'Problem Solving',
  architecture: 'Architecture & Security',
  strategy: 'Product Strategy',
  debate: 'Cross-functional Debate',
  brainstorm: 'Rapid Brainstorming',
};

export default function RoundtableList() {
  const navigate = useNavigate();
  const [roundtables, setRoundtables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSummonModal, setShowSummonModal] = useState(false);
  const [query, setQuery] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const load = () => {
    setLoading(true);
    setError('');
    api.get('/roundtables')
      .then(({ data }) => setRoundtables(data.roundtables || []))
      .catch(() => setError('Could not load Twin Roundtables.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this roundtable session?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/roundtables/${id}`);
      setRoundtables((prev) => prev.filter((r) => r._id !== id));
    } catch {
      alert('Failed to delete roundtable.');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = roundtables.filter((r) => {
    const q = query.toLowerCase();
    return (
      r.title.toLowerCase().includes(q) ||
      r.topic.toLowerCase().includes(q) ||
      (r.twins || []).some((t) => t.name?.toLowerCase().includes(q) || t.dept?.toLowerCase().includes(q))
    );
  });

  return (
    <div>
      <div className="flex justify-between items-start mb-24">
        <div>
          <div className="flex items-center gap-8 mb-4">
            <span className="badge" style={{ background: 'var(--blue-accent-soft)', color: 'var(--blue-accent)', fontWeight: 600 }}>
              <Users2 size={12} style={{ display: 'inline', marginRight: 4 }} />
              Multi-Agent Collaboration
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', margin: '0 0 6px 0' }}>Twin Roundtables</h1>
          <p className="text-muted" style={{ margin: 0, maxWidth: 650 }}>
            Summon multiple Digital Twins into a shared space. Watch them converse in-character, evaluate trade-offs, and collaboratively build end-to-end approaches to your problems.
          </p>
        </div>
        <button
          className="btn btn-accent"
          onClick={() => setShowSummonModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <PlusCircle size={16} /> Summon Roundtable
        </button>
      </div>

      <div className="search-bar mb-24">
        <Search size={16} />
        <input
          placeholder="Search roundtables by topic, twin, or department…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {error && <ErrorAlert message={error} onRetry={load} />}

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading roundtable discussions...
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state-container" style={{
          padding: 48,
          background: 'var(--surface)',
          borderRadius: 12,
          border: '1px solid var(--border)',
          textAlign: 'center'
        }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'var(--blue-accent-soft)',
            color: 'var(--blue-accent)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16
          }}>
            <Users2 size={28} />
          </div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem' }}>No Twin Roundtables yet</h3>
          <p className="text-muted" style={{ maxWidth: 480, margin: '0 auto 20px auto', fontSize: '0.9rem' }}>
            Bring together twins like Divyansh (AI & Systems), Pooja (Product & UX), and Sneha (Cybersecurity & IAM) to solve complex cross-functional challenges.
          </p>
          <button className="btn btn-accent" onClick={() => setShowSummonModal(true)}>
            <Sparkles size={16} /> Summon Your First Roundtable
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 18 }}>
          {filtered.map((r) => {
            const hasSummary = Boolean(r.summary?.consensus);
            const turnsCount = (r.turns || []).length;

            return (
              <div
                key={r._id}
                onClick={() => navigate(`/roundtable/${r._id}`)}
                className="card"
                style={{
                  padding: 20,
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)'
                }}
              >
                <div>
                  <div className="flex justify-between items-center mb-10">
                    <span className="badge" style={{ fontSize: '0.72rem', background: 'var(--surface-muted)' }}>
                      {MODE_LABELS[r.discussionMode] || 'Problem Solving'}
                    </span>
                    {hasSummary ? (
                      <span className="badge" style={{ background: '#E6F4EC', color: '#1F8A5C', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle2 size={12} /> Blueprint Ready
                      </span>
                    ) : (
                      <span className="badge" style={{ background: 'var(--blue-accent-soft)', color: 'var(--blue-accent)', fontSize: '0.72rem' }}>
                        Active Discussion
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '1.05rem', margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
                    {r.title}
                  </h3>
                  <p style={{
                    fontSize: '0.84rem',
                    color: 'var(--text-secondary)',
                    margin: '0 0 16px 0',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {r.topic}
                  </p>
                </div>

                <div>
                  {/* Summoned Twins Avatars */}
                  <div className="flex items-center justify-between pt-12" style={{ borderTop: '1px solid var(--border)' }}>
                    <div className="flex items-center">
                      <div className="flex items-center" style={{ marginRight: 8 }}>
                        {(r.twins || []).map((t, idx) => (
                          <div
                            key={t._id || idx}
                            title={`${t.name} (${t.dept || 'NIIT'})`}
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              background: t.dept === 'Engineering' ? '#3E63DD' : t.dept === 'Cybersecurity' ? '#C2422D' : '#8A42DD',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.7rem',
                              border: '2px solid var(--surface)',
                              marginLeft: idx === 0 ? 0 : -8,
                              zIndex: 10 - idx
                            }}
                          >
                            {t.avatarInitials || (t.name || 'T').slice(0, 2).toUpperCase()}
                          </div>
                        ))}
                      </div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {r.twins?.length || 0} Twins · {turnsCount} turns
                      </span>
                    </div>

                    <div className="flex items-center gap-6">
                      <button
                        className="btn-icon"
                        title="Delete Roundtable"
                        onClick={(e) => handleDelete(e, r._id)}
                        disabled={deletingId === r._id}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: 4 }}
                      >
                        <Trash2 size={15} />
                      </button>
                      <span style={{ color: 'var(--blue-accent)', display: 'flex', alignItems: 'center' }}>
                        <ArrowRight size={16} />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <SummonModal
        isOpen={showSummonModal}
        onClose={() => setShowSummonModal(false)}
      />
    </div>
  );
}
