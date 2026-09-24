import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api.js';
import EmptyState from '../../components/EmptyState.jsx';
import ErrorAlert from '../../components/ErrorAlert.jsx';

export default function AdminConversations() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    setError('');
    api
      .get('/conversations?all=1')
      .then(({ data }) => setConversations(Array.isArray(data?.conversations) ? data.conversations : []))
      .catch(() => setError('Could not load conversations.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <div className="page-title">Conversations</div>
      <div className="page-subtitle" style={{ marginBottom: 24 }}>All conversations across NIIT users (most recent 100).</div>

      {error && <ErrorAlert message={error} onRetry={load} />}

      {loading ? (
        <div className="flex flex-col gap-12">
          <div className="skeleton" style={{ height: 60 }} />
          <div className="skeleton" style={{ height: 60 }} />
          <div className="skeleton" style={{ height: 60 }} />
        </div>
      ) : conversations.length === 0 ? (
        <EmptyState title="No conversations yet." description="Once users start chatting with a Twin, conversations will appear here." />
      ) : (
        <div className="card" style={{ padding: 0 }}>
          {conversations.map((c) => (
            <div key={c._id} className="twin-list-row" style={{ cursor: 'pointer' }} onClick={() => navigate(`/conversations/${c._id}`)}>
              <div className="who">
                <div className="twin-avatar" style={{ width: 38, height: 38, fontSize: 12 }}>{c.twinId?.avatarInitials}</div>
                <div>
                  <h4>{c.title}</h4>
                  <div className="sub">{c.userId?.name} with {c.twinId?.name} · {c.messages?.length || 0} messages</div>
                </div>
              </div>
              <div className="text-tertiary" style={{ fontSize: 12.5 }}>{new Date(c.updatedAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
