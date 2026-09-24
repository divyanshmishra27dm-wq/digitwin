import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Building2, Globe, Sparkles, Plus, Users2 } from 'lucide-react';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import TwinCard from '../../components/TwinCard.jsx';
import { SkeletonCard } from '../../components/SkeletonCard.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import ErrorAlert from '../../components/ErrorAlert.jsx';
import SummonModal from '../../components/SummonModal.jsx';

export default function TwinsList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [twins, setTwins] = useState([]);
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'department', 'global'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSummonModal, setShowSummonModal] = useState(false);

  const userDept = user?.dept || 'Engineering';

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
    const matchesQuery = (
      t.name.toLowerCase().includes(q) ||
      t.title.toLowerCase().includes(q) ||
      (t.dept || '').toLowerCase().includes(q) ||
      (t.expertise || []).some((e) => e.toLowerCase().includes(q))
    );

    if (!matchesQuery) return false;

    if (filterType === 'department') {
      return t.dept === userDept;
    }
    if (filterType === 'global') {
      return t.visibility === 'all';
    }
    return true;
  });

  return (
    <div>
      <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="page-title">Digital Twins Directory</div>
          <div className="page-subtitle">
            Discover published AI Digital Twins calibrated for your department and organization.
          </div>
        </div>
        <div className="flex items-center gap-10">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowSummonModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
          >
            <Users2 size={16} /> Summon in Roundtable
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/twins/create')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
          >
            <Plus size={16} /> Create Digital Twin
          </button>
        </div>
      </div>

      {/* Department Context Pill */}
      <div style={{
        marginTop: 16,
        marginBottom: 16,
        padding: '10px 16px',
        background: 'var(--bg-secondary)',
        borderRadius: 10,
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem' }}>
          <Building2 size={16} style={{ color: 'var(--primary)' }} />
          <span>
            Logged in as <strong>{user?.name}</strong> · Department: <strong style={{ color: 'var(--primary)' }}>{userDept}</strong>
          </span>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            className={`btn btn-sm ${filterType === 'all' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilterType('all')}
            style={{ fontSize: '0.8rem', padding: '4px 10px' }}
          >
            All Available ({twins.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${filterType === 'department' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilterType('department')}
            style={{ fontSize: '0.8rem', padding: '4px 10px' }}
          >
            My Dept: {userDept} ({twins.filter((t) => t.dept === userDept).length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${filterType === 'global' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilterType('global')}
            style={{ fontSize: '0.8rem', padding: '4px 10px' }}
          >
            <Globe size={12} style={{ marginRight: 4 }} /> All NIIT ({twins.filter((t) => t.visibility === 'all').length})
          </button>
        </div>
      </div>

      <div className="search-bar" style={{ marginTop: 12, marginBottom: 24 }}>
        <Search size={16} />
        <input
          placeholder="Search by name, title, department or skills…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {error && <ErrorAlert message={error} onRetry={load} />}

      {loading ? (
        <div className="grid-3">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No matching Twins found"
          description={`No twins matching your filters in department "${userDept}". You can search all available twins or request an access upgrade.`}
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
