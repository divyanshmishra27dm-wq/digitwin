import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, GitFork, Building2, Globe, Lock, CheckCircle2, XCircle, Clock } from 'lucide-react';
import api from '../../services/api.js';
import Badge from '../../components/Badge.jsx';
import ErrorAlert from '../../components/ErrorAlert.jsx';
import SkillFlowchart from '../../components/SkillFlowchart.jsx';
import { groupSkillsByTaxonomy } from '../../data/skillTaxonomy.js';

const STATUS_TONE = { published: 'success', draft: 'warning', unpublished: 'neutral', archived: 'neutral' };

export default function TwinDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [twin, setTwin] = useState(null);
  const [knowledge, setKnowledge] = useState([]);
  const [error, setError] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [showSkillFlowchart, setShowSkillFlowchart] = useState(false);

  const loadData = () => {
    Promise.all([api.get(`/twins/${id}`), api.get(`/twins/${id}/knowledge`)])
      .then(([t, k]) => {
        setTwin(t.data.twin);
        setKnowledge(k.data.knowledge);
      })
      .catch(() => setError('Could not load this Twin.'));
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleReview = async (action) => {
    let rejectionReason = '';
    if (action === 'reject') {
      rejectionReason = window.prompt('Provide a reason for rejecting global visibility (optional):') || 'Request declined by Administrator.';
    }
    setReviewing(true);
    setError('');
    try {
      const { data } = await api.post(`/twins/${id}/review-global`, { action, rejectionReason });
      setTwin(data.twin);
      setActionSuccess(data.message);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to review request.');
    } finally {
      setReviewing(false);
    }
  };

  const handleDirectVisibilityToggle = async (newVis) => {
    try {
      const { data } = await api.patch(`/twins/${id}`, { visibility: newVis });
      setTwin(data.twin);
      setActionSuccess(`Visibility updated to "${newVis === 'all' ? 'All Departments' : 'Department Only'}".`);
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update visibility.');
    }
  };

  if (error) return <ErrorAlert message={error} />;
  if (!twin) {
    return (
      <div>
        <div className="skeleton" style={{ width: 120, height: 32, marginBottom: 20 }} />
        <div className="skeleton" style={{ height: 80, marginBottom: 24 }} />
        <div className="skeleton" style={{ height: 200 }} />
      </div>
    );
  }

  const groupedSkills = groupSkillsByTaxonomy(twin.expertise || []);
  const isGlobal = twin.visibility === 'all';
  const hasPendingRequest = twin.globalAccessRequest?.status === 'pending';

  return (
    <div>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/twins')} style={{ marginBottom: 20 }}>
        <ArrowLeft size={15} /> All Twins
      </button>

      {actionSuccess && (
        <div className="badge badge-success" style={{ padding: '8px 16px', fontSize: '0.9rem', marginBottom: 16, display: 'inline-block' }}>
          ✓ {actionSuccess}
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-16">
          <div className="twin-avatar" style={{ width: 56, height: 56, fontSize: 18 }}>{twin.avatarInitials}</div>
          <div>
            <div className="page-title" style={{ marginBottom: 2 }}>{twin.name}</div>
            <div className="page-subtitle">{twin.title} · {twin.organization}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: '0.82rem',
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: 6,
              background: 'rgba(59, 130, 246, 0.1)',
              color: '#3b82f6',
              border: '1px solid rgba(59, 130, 246, 0.2)',
            }}
          >
            <Building2 size={13} /> {twin.dept || 'Engineering'}
          </span>
          <Badge tone={STATUS_TONE[twin.status]}>{twin.status}</Badge>
        </div>
      </div>

      {/* Admin Global Access Request Review Banner */}
      {hasPendingRequest && (
        <div style={{
          marginTop: 20,
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: 10,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Clock size={16} /> Global Access Approval Requested
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              A request has been raised to make this Digital Twin available across <strong>ALL NIIT Departments</strong> (currently restricted to <em>{twin.dept}</em>).
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              style={{ background: '#10b981', borderColor: '#10b981', display: 'flex', alignItems: 'center', gap: 5 }}
              onClick={() => handleReview('approve')}
              disabled={reviewing}
            >
              <CheckCircle2 size={14} /> Approve for All NIIT
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: 5 }}
              onClick={() => handleReview('reject')}
              disabled={reviewing}
            >
              <XCircle size={14} /> Decline
            </button>
          </div>
        </div>
      )}

      {/* Admin Visibility Controller */}
      <div style={{
        marginTop: 16,
        padding: '12px 18px',
        background: 'var(--bg-secondary)',
        borderRadius: 8,
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isGlobal ? <Globe size={16} style={{ color: '#10b981' }} /> : <Lock size={16} style={{ color: '#3b82f6' }} />}
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              Access Scope: {isGlobal ? '🌐 Available to All Departments' : `🏢 Restricted to ${twin.dept || 'Engineering'} Department Only`}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {isGlobal ? 'Any NIIT employee across all departments can discover and chat with this Twin.' : `Only employees belonging to "${twin.dept || 'Engineering'}" can access this Twin.`}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            className={`btn btn-sm ${!isGlobal ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => handleDirectVisibilityToggle('department')}
            style={{ fontSize: '0.78rem' }}
          >
            Dept Only
          </button>
          <button
            type="button"
            className={`btn btn-sm ${isGlobal ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => handleDirectVisibilityToggle('all')}
            style={{ fontSize: '0.78rem' }}
          >
            All Departments
          </button>
        </div>
      </div>

      <div className="flex gap-12 mt-24">
        <button className="btn btn-secondary" onClick={() => navigate(`/admin/twins/${id}/edit`)}>Edit Profile & Skills</button>
        <button className="btn btn-secondary" onClick={() => navigate(`/admin/twins/${id}/knowledge`)}>Knowledge ({knowledge.length})</button>
        <button className="btn btn-secondary" onClick={() => navigate(`/admin/twins/${id}/persona`)}>Persona</button>
        <button className="btn btn-primary" onClick={() => navigate(`/admin/twins/${id}/preview`)}>Preview</button>
      </div>

      <div className="grid-2 mt-32">
        <div className="card">
          <div className="section-title" style={{ marginBottom: 12 }}>About</div>
          <p className="text-muted" style={{ fontSize: 14, lineHeight: 1.65 }}>{twin.bio || 'No bio written yet.'}</p>
        </div>
        <div className="card">
          <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
            <div className="section-title">Expertise ({twin.expertise?.length || 0})</div>
            <button 
              type="button" 
              className="btn btn-ghost btn-sm"
              onClick={() => setShowSkillFlowchart(!showSkillFlowchart)}
            >
              <GitFork size={14} /> {showSkillFlowchart ? 'Hide Flowchart' : 'View Skill Flowchart'}
            </button>
          </div>

          <div className="flex flex-col gap-10">
            {groupedSkills.map((g) => (
              <div key={g.domainName} className="group-domain-section" style={{ borderColor: g.domainColor }}>
                <div className="group-domain-header" style={{ color: g.domainColor }}>
                  <span className="domain-dot" style={{ background: g.domainColor }} />
                  <span className="domain-title">{g.domainName}</span>
                  <span className="domain-count" style={{ background: g.domainBgColor, color: g.domainColor }}>
                    {g.totalSkills}
                  </span>
                </div>
                <div className="group-chips-grid">
                  {g.categories.flatMap((c) => c.skills).map((e) => (
                    <span className="selected-tag-chip" style={{ background: g.domainBgColor, color: g.domainColor, borderColor: g.domainColor + '40' }} key={e}>
                      {e}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {twin.expertise?.length === 0 && <p className="text-muted" style={{ fontSize: 13.5 }}>No expertise tags yet.</p>}
          </div>
        </div>
      </div>

      {showSkillFlowchart && (
        <div className="mt-24">
          <SkillFlowchart
            skills={twin.expertise || []}
            twinName={twin.name}
            twinRole={twin.title}
            readOnly={true}
            title={`${twin.name}'s Skill Flowchart Diagram`}
            subtitle="Full ontology breakdown and branch mapping"
          />
        </div>
      )}

      <div className="card mt-24">
        <div className="section-title" style={{ marginBottom: 12 }}>Persona</div>
        <div className="summary-row"><span className="label">Communication style</span><span className="value">{twin.communicationStyle?.join(', ') || '—'}</span></div>
        <div className="summary-row"><span className="label">Response length</span><span className="value">{twin.responseLength}</span></div>
        <div className="summary-row"><span className="label">Thinking patterns</span><span className="value">{twin.thinkingPatterns?.length || 0}</span></div>
      </div>
    </div>
  );
}
