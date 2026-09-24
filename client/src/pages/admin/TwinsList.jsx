import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Building2, Globe, Lock, Clock } from 'lucide-react';
import api from '../../services/api.js';
import EmptyState from '../../components/EmptyState.jsx';
import ErrorAlert from '../../components/ErrorAlert.jsx';
import Badge from '../../components/Badge.jsx';

const STATUS_TONE = { published: 'success', draft: 'warning', unpublished: 'neutral', archived: 'neutral' };

export default function TwinsList() {
  const [twins, setTwins] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    setError('');
    api
      .get('/twins')
      .then(({ data }) => setTwins(Array.isArray(data?.twins) ? data.twins : []))
      .catch(() => setError('Could not load Twins.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const act = async (id, action) => {
    try {
      await api.post(`/twins/${id}/${action}`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed.');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center">
        <div>
          <div className="page-title">Digital Twins Management</div>
          <div className="page-subtitle">Create, curate, department-scope and publish AI Digital Twins across NIIT.</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary" onClick={() => navigate('/admin/twins/create')}>
            <Plus size={16} /> Create Twin
          </button>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={load} />}

      <div className="card mt-24" style={{ padding: '8px 24px' }}>
        {loading ? null : twins.length === 0 ? (
          <EmptyState
            title="No Digital Twins yet."
            description="Create your first Twin and turn human expertise into an intelligent conversational experience."
            action={<button className="btn btn-primary" onClick={() => navigate('/admin/twins/create')}>Create Digital Twin</button>}
          />
        ) : (
          twins.map((twin) => {
            const isGlobal = twin.visibility === 'all';
            const isPending = twin.globalAccessRequest?.status === 'pending';

            return (
              <div className="twin-list-row" key={twin._id}>
                <div className="who" style={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/twins/${twin._id}`)}>
                  <div className="twin-avatar" style={{ width: 44, height: 44, fontSize: 14 }}>{twin.avatarInitials}</div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h4>{twin.name}</h4>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '1px 7px',
                          borderRadius: 4,
                          background: 'rgba(59, 130, 246, 0.1)',
                          color: '#3b82f6',
                          border: '1px solid rgba(59, 130, 246, 0.2)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3,
                        }}
                      >
                        <Building2 size={11} /> {twin.dept || 'Engineering'}
                      </span>
                      {isGlobal ? (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            padding: '1px 6px',
                            borderRadius: 4,
                            background: 'rgba(16, 185, 129, 0.1)',
                            color: '#10b981',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                          }}
                        >
                          <Globe size={11} /> All NIIT
                        </span>
                      ) : isPending ? (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            padding: '1px 6px',
                            borderRadius: 4,
                            background: 'rgba(245, 158, 11, 0.15)',
                            color: '#f59e0b',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                          }}
                        >
                          <Clock size={11} /> Pending All NIIT
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            padding: '1px 6px',
                            borderRadius: 4,
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-muted)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                          }}
                        >
                          <Lock size={11} /> Dept Only
                        </span>
                      )}
                    </div>
                    <div className="sub">{twin.title} · {twin.organization}</div>
                    <Badge tone={STATUS_TONE[twin.status]}>{twin.status}</Badge>
                  </div>
                </div>

                <div className="stats">
                  <span>Knowledge {twin.knowledgeCount}</span>
                  <span>Conversations {twin.conversationCount}</span>
                </div>

                <div className="actions">
                  <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/admin/twins/${twin._id}`)}>Manage</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/admin/twins/${twin._id}/edit`)}>Edit</button>
                  {twin.status === 'published' ? (
                    <button className="btn btn-danger btn-sm" onClick={() => act(twin._id, 'unpublish')}>Unpublish</button>
                  ) : (
                    <button className="btn btn-accent btn-sm" onClick={() => act(twin._id, 'publish')}>Publish</button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
