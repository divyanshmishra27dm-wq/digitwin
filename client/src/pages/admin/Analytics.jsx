import { useEffect, useState } from 'react';
import api from '../../services/api.js';
import ErrorAlert from '../../components/ErrorAlert.jsx';

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = () => {
    setLoading(true);
    setError('');
    api
      .get('/analytics')
      .then(({ data }) => setStats(data))
      .catch(() => setError('Could not load analytics.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  if (error) return <ErrorAlert message={error} onRetry={load} />;
  if (loading || !stats) {
    return (
      <div>
        <div className="skeleton" style={{ width: 160, height: 32, marginBottom: 8 }} />
        <div className="skeleton" style={{ width: 280, height: 18, marginBottom: 24 }} />
        <div className="grid-4">
          <div className="skeleton" style={{ height: 96 }} />
          <div className="skeleton" style={{ height: 96 }} />
          <div className="skeleton" style={{ height: 96 }} />
          <div className="skeleton" style={{ height: 96 }} />
        </div>
      </div>
    );
  }

  const topics = Array.isArray(stats.topTopics) ? stats.topTopics : [];
  const maxTopic = Math.max(1, ...topics.map((t) => t.count || 0));

  return (
    <div>
      <div className="page-title">Twin Analytics</div>
      <div className="page-subtitle" style={{ marginBottom: 24 }}>How users are engaging with Digital Twins.</div>

      <div className="grid-4">
        <div className="stat-card"><div className="stat-value">{stats.conversationCount}</div><div className="stat-label">Total conversations</div></div>
        <div className="stat-card"><div className="stat-value">{stats.questionsAnswered}</div><div className="stat-label">Questions answered</div></div>
        <div className="stat-card"><div className="stat-value">{stats.escalationCount}</div><div className="stat-label">Human escalations</div></div>
        <div className="stat-card"><div className="stat-value">{stats.insufficientInfo}</div><div className="stat-label">Insufficient information</div></div>
      </div>

      <div className="card mt-32">
        <div className="section-title" style={{ marginBottom: 20 }}>Most Asked Topics</div>
        {stats.topTopics.length === 0 ? (
          <p className="text-muted" style={{ fontSize: 13.5 }}>Not enough conversation data yet.</p>
        ) : (
          stats.topTopics.map((t) => (
            <div className="bar-row" key={t.topic}>
              <span className="label">{t.topic}</span>
              <div className="track"><div className="fill" style={{ width: `${(t.count / maxTopic) * 100}%` }} /></div>
              <span className="count">{t.count}</span>
            </div>
          ))
        )}
      </div>

      <div className="card mt-24">
        <div className="section-title" style={{ marginBottom: 16 }}>Escalation Rate</div>
        <div className="bar-row">
          <span className="label">Escalated</span>
          <div className="track">
            <div
              className="fill"
              style={{
                width: `${stats.conversationCount ? Math.min(100, (stats.escalationCount / stats.conversationCount) * 100) : 0}%`,
                background: 'var(--warning)',
              }}
            />
          </div>
          <span className="count">
            {stats.conversationCount ? Math.round((stats.escalationCount / stats.conversationCount) * 100) : 0}%
          </span>
        </div>
      </div>
    </div>
  );
}
