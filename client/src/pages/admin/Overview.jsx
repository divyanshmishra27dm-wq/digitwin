import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api.js';
import ErrorAlert from '../../components/ErrorAlert.jsx';

export default function Overview() {
  const [stats, setStats] = useState(null);
  const [twins, setTwins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [a, t] = await Promise.all([api.get('/analytics'), api.get('/twins')]);
      setStats(a.data);
      setTwins(Array.isArray(t.data?.twins) ? t.data.twins : []);
    } catch (err) {
      setError('We could not load the dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (error) return <ErrorAlert message={error} onRetry={load} />;
  if (loading || !stats) {
    return (
      <div>
        <div className="skeleton" style={{ width: 140, height: 32, marginBottom: 8 }} />
        <div className="skeleton" style={{ width: 260, height: 18, marginBottom: 28 }} />
        <div className="grid-4">
          <div className="skeleton" style={{ height: 96 }} />
          <div className="skeleton" style={{ height: 96 }} />
          <div className="skeleton" style={{ height: 96 }} />
          <div className="skeleton" style={{ height: 96 }} />
        </div>
      </div>
    );
  }

  const activity = [
    ...twins
      .filter((t) => t.publishedAt)
      .map((t) => ({ text: `${t.name} Twin published`, at: t.publishedAt })),
  ]
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 5);

  return (
    <div>
      <div className="page-title">Overview</div>
      <div className="page-subtitle" style={{ marginBottom: 28 }}>
        NIIT Internal Innovation POC — Digital Twin platform snapshot.
      </div>

      <div className="grid-4">
        <div className="stat-card">
          <div className="stat-value">{stats.twinCount}</div>
          <div className="stat-label">Digital Twins</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.publishedCount}</div>
          <div className="stat-label">Published</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.conversationCount}</div>
          <div className="stat-label">Conversations</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.escalationCount}</div>
          <div className="stat-label">Human Escalations</div>
        </div>
      </div>

      <div className="grid-2 mt-32">
        <div className="card">
          <div className="section-title" style={{ marginBottom: 6 }}>Recent Activity</div>
          {activity.length === 0 ? (
            <p className="text-muted mt-16" style={{ fontSize: 13.5 }}>No activity yet.</p>
          ) : (
            activity.map((a, i) => (
              <div className="activity-item" key={i}>
                <span>{a.text}</span>
                <span className="time">{new Date(a.at).toLocaleDateString()}</span>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div className="section-title" style={{ marginBottom: 6 }}>Twin Performance</div>
          <div className="mt-16">
            <div className="summary-row"><span className="label">Questions answered</span><span className="value">{stats.questionsAnswered}</span></div>
            <div className="summary-row"><span className="label">Insufficient information</span><span className="value">{stats.insufficientInfo}</span></div>
            <div className="summary-row"><span className="label">Registered users</span><span className="value">{stats.userCount}</span></div>
          </div>
          <button className="btn btn-secondary btn-sm mt-16" onClick={() => navigate('/admin/analytics')}>
            View full analytics
          </button>
        </div>
      </div>
    </div>
  );
}
