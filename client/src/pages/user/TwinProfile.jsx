import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CircleCheck, GitFork, LayoutGrid, Building2, Globe, Lock, Clock, Send, Users2, Link2, PhoneCall, Zap, MessageSquare, Key } from 'lucide-react';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import ErrorAlert from '../../components/ErrorAlert.jsx';
import SkillFlowchart from '../../components/SkillFlowchart.jsx';
import SummonModal from '../../components/SummonModal.jsx';
import CallModal from '../../components/CallModal.jsx';
import WebLinkIngesterModal from '../../components/WebLinkIngesterModal.jsx';
import { groupSkillsByTaxonomy } from '../../data/skillTaxonomy.js';

const EXPERIENCE = [
  { title: 'LLM Council', cat: 'Enterprise AI', desc: 'Strategic AI-assisted intelligence from MBR/QBR business data.' },
  { title: 'NexIQ', cat: 'Software Engineering', desc: 'Enterprise application engineering and production deployment infrastructure.' },
  { title: 'Wakubo', cat: 'Entrepreneurship', desc: 'AI fashion-tech venture: stylist, recommendations, and virtual try-on.' },
  { title: 'World Model / EdTech', cat: 'Research', desc: 'Concept for accelerated simulation of education and product decisions.' },
  { title: 'AI Research', cat: 'Research', desc: 'Generative AI, computer vision and related technical experimentation.' },
];

export default function TwinProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [twin, setTwin] = useState(null);
  const [error, setError] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState('');
  const [skillViewTab, setSkillViewTab] = useState('flowchart');
  const [showSummonModal, setShowSummonModal] = useState(false);
  const [showWebModal, setShowWebModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);

  useEffect(() => {
    api
      .get(`/twins/${id}`)
      .then(({ data }) => setTwin(data.twin))
      .catch((err) => setError(err.response?.data?.message || 'We could not load this Digital Twin.'));
  }, [id]);

  const handleRequestGlobal = async () => {
    setRequesting(true);
    setRequestSuccess('');
    try {
      const { data } = await api.post(`/twins/${id}/request-global`);
      setTwin(data.twin);
      setRequestSuccess('Your request for All-NIIT global availability has been submitted to Administrators.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit global access request.');
    } finally {
      setRequesting(false);
    }
  };

  if (error) return <ErrorAlert message={error} onRetry={() => window.location.reload()} />;
  if (!twin) return null;

  const groupedSkills = groupSkillsByTaxonomy(twin.expertise || []);
  const isGlobal = twin.visibility === 'all';
  const requestStatus = twin.globalAccessRequest?.status || 'none';

  return (
    <div>
      <div className="flex items-center justify-between mt-8" style={{ marginBottom: 20 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={15} /> Back
        </button>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: '0.8rem',
              fontWeight: 600,
              padding: '3px 10px',
              borderRadius: 6,
              background: 'rgba(59, 130, 246, 0.1)',
              color: '#3b82f6',
              border: '1px solid rgba(59, 130, 246, 0.2)',
            }}
          >
            <Building2 size={13} /> {twin.dept || 'Engineering'}
          </span>

          {isGlobal ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: '0.8rem',
                fontWeight: 600,
                padding: '3px 10px',
                borderRadius: 6,
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.2)',
              }}
            >
              <Globe size={13} /> Available to All NIIT
            </span>
          ) : (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: '0.8rem',
                fontWeight: 600,
                padding: '3px 10px',
                borderRadius: 6,
                background: 'var(--bg-secondary)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border)',
              }}
            >
              <Lock size={13} /> Department Restricted
            </span>
          )}

          {twin.status === 'published' && (
            <span className="badge badge-success">Published</span>
          )}
        </div>
      </div>

      {requestSuccess && (
        <div className="badge badge-success" style={{ padding: '8px 16px', fontSize: '0.88rem', marginBottom: 16, display: 'inline-block' }}>
          ✓ {requestSuccess}
        </div>
      )}

      {/* Global Access Request Banner for Department-restricted Twins */}
      {!isGlobal && (
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '14px 18px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <Globe size={15} style={{ color: 'var(--primary)' }} />
              Department Visibility: {twin.dept || 'Engineering'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {requestStatus === 'pending'
                ? 'A request to make this Twin available to ALL NIIT departments is currently under Administrator review.'
                : requestStatus === 'rejected'
                ? `Global request was declined${twin.globalAccessRequest?.rejectionReason ? `: "${twin.globalAccessRequest.rejectionReason}"` : ''}. You may re-submit.`
                : 'This Twin is currently restricted to this department. Want to make it accessible across all NIIT departments?'}
            </div>
          </div>

          <div>
            {requestStatus === 'pending' ? (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: '0.82rem',
                color: '#f59e0b',
                background: 'rgba(245, 158, 11, 0.1)',
                padding: '6px 12px',
                borderRadius: 6,
                fontWeight: 600,
              }}>
                <Clock size={14} /> Pending Admin Approval
              </span>
            ) : (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleRequestGlobal}
                disabled={requesting}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Send size={13} /> {requesting ? 'Submitting…' : 'Request Global Access (All NIIT)'}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="twin-hero">
        <div className="twin-avatar">{twin.avatarInitials}</div>
        <h1>{twin.name}</h1>
        <div className="role">{twin.title} · {twin.organization}</div>
        <div className="tags">{(twin.expertise || []).slice(0, 6).join(' • ')}</div>
        {twin.tagline && <blockquote>"{twin.tagline}"</blockquote>}
        <div className="flex items-center justify-center gap-10" style={{ marginTop: 8, flexWrap: 'wrap' }}>
          <button
            className="btn btn-accent"
            onClick={() => setShowCallModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#10b981', borderColor: '#10b981' }}
          >
            <PhoneCall size={15} /> Voice Team Call
          </button>
          <button className="btn btn-accent" onClick={() => navigate(`/twins/${twin._id}/chat`)}>
            Start Conversation
          </button>
          <button className="btn btn-secondary" onClick={() => setShowSummonModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Users2 size={15} /> Summon in Roundtable
          </button>
          <button className="btn btn-secondary" onClick={() => setShowWebModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Link2 size={15} /> Feed Learning Link
          </button>
        </div>
      </div>

      <div className="card mt-24">
        <div className="section-title" style={{ marginBottom: 12 }}>About</div>
        <p className="text-muted" style={{ lineHeight: 1.7, fontSize: 14.5 }}>{twin.bio}</p>
      </div>

      {/* Relationship Manager (RM) Interaction Blueprint */}
      {(twin.interactionFrequency || twin.usualChannel || (twin.typicalInteractions && twin.typicalInteractions.length > 0)) && (
        <div className="card mt-24" style={{ borderLeft: '4px solid #10b981', background: 'var(--surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Zap size={18} style={{ color: '#10b981' }} />
                Branch Relationship Manager (RM) Interaction Blueprint
              </div>
              <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Field cadence, operational communication channels, and typical collaborative scenarios.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {twin.interactionFrequency && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    padding: '4px 10px',
                    borderRadius: 6,
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: '#059669',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                  }}
                  title="Interaction Frequency with RM"
                >
                  <Clock size={13} /> Interacts: {twin.interactionFrequency}
                </span>
              )}

              {twin.usualChannel && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    padding: '4px 10px',
                    borderRadius: 6,
                    background: 'rgba(59, 130, 246, 0.1)',
                    color: '#2563eb',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                  }}
                  title="Primary Communication Channels"
                >
                  <MessageSquare size={13} /> Channel: {twin.usualChannel}
                </span>
              )}
            </div>
          </div>

          {twin.typicalInteractions && twin.typicalInteractions.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                Typical Interactions & Scenarios:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {twin.typicalInteractions.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      background: 'var(--surface-muted, #f8fafc)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      padding: '10px 14px',
                      fontSize: '0.88rem',
                      lineHeight: 1.5,
                      color: 'var(--text-primary)',
                    }}
                  >
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: '#059669',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    >
                      {idx + 1}
                    </span>
                    <div>{item}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div
            style={{
              marginTop: 14,
              paddingTop: 10,
              borderTop: '1px dashed var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.76rem',
              color: 'var(--text-secondary)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Key size={12} style={{ color: '#059669' }} /> Accessible via Universal API Key: <code style={{ background: 'var(--surface-muted)', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>ndt_twin_access_key_99</code>
            </span>
            <span>API Route: <code style={{ background: 'var(--surface-muted)', padding: '2px 6px', borderRadius: 4 }}>POST /api/shared/twins/chat</code></span>
          </div>
        </div>
      )}

      {/* Areas of Expertise & Skill Flowchart */}
      <div className="mt-32">
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
          <div>
            <div className="section-title">Technical Expertise & Flowchart Ontology</div>
            <p className="text-muted" style={{ fontSize: 13, marginTop: 2 }}>
              Interactive flowchart map connecting {twin.name}'s verified domains to sub-disciplines and granular skills.
            </p>
          </div>

          <div className="flowchart-btn-group">
            <button
              type="button"
              className={`flowchart-tool-btn ${skillViewTab === 'flowchart' ? 'active' : ''}`}
              onClick={() => setSkillViewTab('flowchart')}
            >
              <GitFork size={13} style={{ marginRight: 4 }} /> Flowchart Diagram
            </button>
            <button
              type="button"
              className={`flowchart-tool-btn ${skillViewTab === 'chips' ? 'active' : ''}`}
              onClick={() => setSkillViewTab('chips')}
            >
              <LayoutGrid size={13} style={{ marginRight: 4 }} /> Grouped List
            </button>
          </div>
        </div>

        {skillViewTab === 'flowchart' ? (
          <SkillFlowchart
            skills={twin.expertise || []}
            twinName={twin.name}
            twinRole={twin.title}
            readOnly={true}
            title={`${twin.name}'s Skill Flowchart Chart`}
            subtitle="Explore competencies from broad domain contexts down to specific technologies & tools."
          />
        ) : (
          <div className="selected-skills-summary-box">
            <div className="selected-groups-list">
              {groupedSkills.map((group) => (
                <div 
                  key={group.domainName} 
                  className="group-domain-section"
                  style={{ borderColor: group.domainColor, marginBottom: 12 }}
                >
                  <div className="group-domain-header" style={{ color: group.domainColor }}>
                    <span className="domain-dot" style={{ background: group.domainColor }} />
                    <span className="domain-title" style={{ fontSize: 13.5 }}>{group.domainName}</span>
                    <span className="domain-count" style={{ background: group.domainBgColor, color: group.domainColor }}>
                      {group.totalSkills} skills
                    </span>
                  </div>

                  <div className="group-chips-grid">
                    {group.categories.flatMap((c) => c.skills).map((skill) => (
                      <span 
                        key={skill} 
                        className="selected-tag-chip"
                        style={{ background: group.domainBgColor, color: group.domainColor, borderColor: group.domainColor + '40', fontSize: 12.5, padding: '5px 12px' }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="card mt-32">
        <div className="section-title" style={{ marginBottom: 8 }}>Featured Experience</div>
        {EXPERIENCE.map((item) => (
          <div className="timeline-item" key={item.title}>
            <div className="dot" />
            <div>
              <div className="cat">{item.cat}</div>
              <h4>{item.title}</h4>
              <p>{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {twin.thinkingPatterns?.length > 0 && (
        <div className="card mt-32" style={{ marginBottom: 40 }}>
          <div className="section-title" style={{ marginBottom: 8 }}>How this Twin thinks</div>
          {twin.thinkingPatterns.map((p) => (
            <div className="principle-row" key={p}>
              <CircleCheck size={16} />
              <span>{p}</span>
            </div>
          ))}
        </div>
      )}

      <SummonModal
        isOpen={showSummonModal}
        onClose={() => setShowSummonModal(false)}
        initialSelectedTwinId={twin._id}
      />

      <CallModal
        isOpen={showCallModal}
        onClose={() => setShowCallModal(false)}
        initialSelectedTwinId={twin._id}
      />

      <WebLinkIngesterModal
        isOpen={showWebModal}
        onClose={() => setShowWebModal(false)}
        defaultTwinId={twin._id}
        onIngested={(data) => {
          if (data.twin) {
            setTwin((prev) => ({ ...prev, expertise: data.twin.expertise }));
          }
        }}
      />
    </div>
  );
}
