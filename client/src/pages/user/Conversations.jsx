import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api.js';
import EmptyState from '../../components/EmptyState.jsx';
import ErrorAlert from '../../components/ErrorAlert.jsx';
import { SkeletonRow } from '../../components/SkeletonCard.jsx';

function formatDate(d) {
  const date = new Date(d);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  if (isToday) return `Today, ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function Conversations() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get('/conversations')
      .then(({ data }) => setConversations(data.conversations))
      .catch(() => setError('We could not load your conversations.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-title">My Conversations</div>
      <div className="page-subtitle mt-8" style={{ marginBottom: 24 }}>
        Your conversation history with NIIT's Digital Twins.
      </div>

      {error && <ErrorAlert message={error} />}

      {loading ? (
        <div className="card">{[1, 2, 3].map((i) => <SkeletonRow key={i} />)}</div>
      ) : conversations.length === 0 ? (
        <EmptyState
          title="No conversations yet."
          description="Start a conversation with a Digital Twin to see it appear here."
        />
      ) : (
        <div className="card" style={{ padding: 0 }}>
          {conversations.map((c) => (
            <div
              key={c._id}
              className="twin-list-row"
              style={{ cursor: 'pointer', padding: '18px 24px' }}
              onClick={() => navigate(`/conversations/${c._id}`)}
            >
              <div className="who">
                <div className="twin-avatar" style={{ width: 38, height: 38, fontSize: 13 }}>
                  {c.twinId?.avatarInitials}
                </div>
                <div>
                  <h4>{c.title}</h4>
                  <div className="sub">with {c.twinId?.name}</div>
                </div>
              </div>
              <div className="text-tertiary" style={{ fontSize: 12.5 }}>{formatDate(c.updatedAt)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
