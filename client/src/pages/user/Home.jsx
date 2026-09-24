import { useEffect, useState } from 'react';
import { Search, Sparkles } from 'lucide-react';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import TwinCard from '../../components/TwinCard.jsx';
import { SkeletonCard } from '../../components/SkeletonCard.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import ErrorAlert from '../../components/ErrorAlert.jsx';
import SummonModal from '../../components/SummonModal.jsx';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Home() {
  const { user } = useAuth();
  const [twins, setTwins] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSummonModal, setShowSummonModal] = useState(false);

  const load = () => {
    setLoading(true);
    setError('');
    api
      .get('/twins')
      .then(({ data }) => setTwins(data.twins))
      .catch(() => setError('We could not load Digital Twins right now.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = twins.filter((t) => {
    const q = query.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.title.toLowerCase().includes(q) ||
      t.organization?.toLowerCase().includes(q) ||
      (t.expertise || []).some((e) => e.toLowerCase().includes(q))
    );
  });

  return (
    <div>
      <div className="home-hero">
        <div className="greeting">{greeting()}, {user?.name?.split(' ')[0]}</div>
        <h1>Explore NIIT's Digital Twins</h1>
        <p>
          AI-powered interfaces to the knowledge, experience and expertise of people across NIIT.
        </p>

        <div className="search-bar">
          <Search size={16} />
          <input
            placeholder="Search Digital Twins…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Multi-Twin Roundtable Summon Banner */}
      <div style={{
        marginTop: 24,
        padding: '20px 24px',
        background: 'linear-gradient(135deg, var(--navy-900) 0%, var(--navy-800) 100%)',
        borderRadius: 14,
        color: '#fff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
        boxShadow: 'var(--shadow-md)'
      }}>
        <div style={{ maxWidth: 580 }}>
          <div className="flex items-center gap-8 mb-6">
            <span className="badge" style={{ background: 'rgba(62, 99, 221, 0.3)', color: '#82A0FF', border: '1px solid rgba(130, 160, 255, 0.3)', fontWeight: 600, fontSize: '0.74rem' }}>
              ✦ NEW FEATURE
            </span>
            <span style={{ fontSize: '0.82rem', color: '#A7B1C8' }}>Multi-Twin Collaborative Summit</span>
          </div>
          <h3 style={{ fontSize: '1.2rem', margin: '0 0 6px 0', color: '#fff' }}>
            Summon Twins & Solve Problems Collaboratively
          </h3>
          <p style={{ margin: 0, fontSize: '0.86rem', color: '#D0D6E5', lineHeight: 1.45 }}>
            Put any strategic or technical problem into chat and summon multiple Digital Twins (e.g. AI & Engineering, Product, Security). Watch them discuss, evaluate trade-offs, and synthesize an actionable blueprint.
          </p>
        </div>
        <button
          className="btn btn-accent"
          onClick={() => setShowSummonModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', fontSize: '0.9rem', flexShrink: 0 }}
        >
          Summon Roundtable <Sparkles size={16} />
        </button>
      </div>

      <div className="section-title mt-32" style={{ marginBottom: 18 }}>
        Featured Twins
      </div>

      {error && <ErrorAlert message={error} onRetry={load} />}

      {loading ? (
        <div className="grid-3">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No Digital Twins yet."
          description="Published Digital Twins created by NIIT administrators will appear here."
        />
      ) : (
        <div className="grid-3">
          {filtered.map((twin) => <TwinCard key={twin._id} twin={twin} />)}
        </div>
      )}

      <SummonModal
        isOpen={showSummonModal}
        onClose={() => setShowSummonModal(false)}
      />
    </div>
  );
}
