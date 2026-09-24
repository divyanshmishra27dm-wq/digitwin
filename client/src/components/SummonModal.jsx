import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users2, Sparkles, Check, X, Shield, Cpu, Briefcase, HelpCircle, Layers } from 'lucide-react';
import api from '../services/api.js';
import ErrorAlert from './ErrorAlert.jsx';

const PRESET_TOPICS = [
  {
    title: 'Enterprise AI Decision Intelligence',
    topic: 'How can we build a production-grade multi-agent AI system to analyze quarterly MBR/QBR data, ensure high-confidence insights, and deploy it securely in our cloud infrastructure?',
    mode: 'problem_solving',
  },
  {
    title: 'Zero-Trust Architecture for AI Services',
    topic: 'What is the optimal end-to-end architecture to secure internal AI microservices with Keycloak IAM, least-privilege RBAC, and data privacy isolation without adding friction for users?',
    mode: 'architecture',
  },
  {
    title: 'AI Virtual Try-On: POC to Enterprise Scale',
    topic: 'How do we design, prototype, and validate a computer-vision powered fashion styling assistant with measurable MVP milestones and rapid pilot feedback?',
    mode: 'strategy',
  },
  {
    title: 'EdTech World Models & Decision Simulation',
    topic: 'How can we simulate student learning outcomes and curriculum decisions using AI world models while balancing product usability and engineering feasibility?',
    mode: 'brainstorm',
  },
];

const MODES = [
  { id: 'problem_solving', label: 'Collaborative Problem Solving', desc: 'Formulate an end-to-end actionable solution' },
  { id: 'architecture', label: 'Architecture & Security', desc: 'Deep technical blueprint & compliance review' },
  { id: 'strategy', label: 'Product & Go-To-Market', desc: 'Customer value, MVP milestones, & telemetry' },
  { id: 'debate', label: 'Cross-functional Debate', desc: 'Constructively challenge assumptions & trade-offs' },
  { id: 'brainstorm', label: 'Rapid Brainstorming', desc: 'High-velocity creative exploration' },
];

export default function SummonModal({ isOpen, onClose, initialSelectedTwinId = null, existingRoundtableId = null, onSummoned = null }) {
  const navigate = useNavigate();
  const [twins, setTwins] = useState([]);
  const [selectedIds, setSelectedIds] = useState(initialSelectedTwinId ? [initialSelectedTwinId] : []);
  const [topic, setTopic] = useState('');
  const [sessionTitle, setSessionTitle] = useState('');
  const [mode, setMode] = useState('problem_solving');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    api.get('/twins')
      .then(({ data }) => {
        setTwins(data.twins || []);
        if (initialSelectedTwinId && !selectedIds.includes(initialSelectedTwinId)) {
          setSelectedIds((prev) => [...prev, initialSelectedTwinId]);
        }
      })
      .catch(() => setError('Could not load accessible Digital Twins.'))
      .finally(() => setLoading(false));
  }, [isOpen, initialSelectedTwinId]);

  if (!isOpen) return null;

  const toggleTwin = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedIds(twins.map((t) => t._id));
  };

  const clearAll = () => {
    setSelectedIds([]);
  };

  const applyPreset = (preset) => {
    setTopic(preset.topic);
    setSessionTitle(preset.title);
    setMode(preset.mode);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedIds.length < (existingRoundtableId ? 1 : 2)) {
      setError(existingRoundtableId ? 'Select at least 1 twin to summon.' : 'Please select at least 2 Digital Twins.');
      return;
    }

    if (!existingRoundtableId && !topic.trim()) {
      setError('Please provide a topic or select a preset.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      if (existingRoundtableId) {
        // Summoning into existing discussion
        const { data } = await api.post(`/roundtables/${existingRoundtableId}/summon`, { twinIds: selectedIds });
        if (onSummoned) onSummoned(data.roundtable);
        onClose();
      } else {
        // Create new roundtable
        const { data } = await api.post('/roundtables', {
          title: sessionTitle.trim() || topic.trim().slice(0, 60),
          topic: topic.trim(),
          discussionMode: mode,
          twinIds: selectedIds,
        });
        onClose();
        navigate(`/roundtable/${data.roundtable._id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start roundtable session.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onMouseDown={onClose} style={{ zIndex: 1000 }}>
      <div
        className="modal-panel summon-modal-panel"
        onMouseDown={(e) => e.stopPropagation()}
        style={{ maxWidth: 760, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="modal-header flex justify-between items-center" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
          <div className="flex items-center gap-10">
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '8px',
              background: 'var(--blue-accent-soft)',
              color: 'var(--blue-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Users2 size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>
                {existingRoundtableId ? 'Summon More Twins to Discussion' : 'Summon Digital Twins Roundtable'}
              </h2>
              <p className="text-muted" style={{ fontSize: '0.84rem', margin: 0 }}>
                {existingRoundtableId
                  ? 'Bring additional department twins into the live room.'
                  : 'Select experts to collaboratively analyze, debate, and formulate a real-world approach.'}
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {error && <div style={{ marginTop: 14 }}><ErrorAlert message={error} /></div>}

        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', flex: 1, paddingRight: 4, marginTop: 16 }}>
          {/* Step 1: Select Twins */}
          <div className="form-section">
            <div className="flex justify-between items-center mb-10">
              <label className="section-label" style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Users2 size={16} style={{ color: 'var(--blue-accent)' }} />
                1. Select Twins to Summon ({selectedIds.length} selected)
              </label>
              <div className="flex gap-8">
                <button type="button" className="btn btn-secondary btn-sm" onClick={selectAll} style={{ fontSize: '0.75rem', padding: '3px 8px' }}>
                  Select All
                </button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={clearAll} style={{ fontSize: '0.75rem', padding: '3px 8px' }}>
                  Clear
                </button>
              </div>
            </div>

            {loading ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>Loading accessible twins...</div>
            ) : (
              <div className="summon-twins-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 10,
                marginBottom: 16
              }}>
                {twins.map((twin) => {
                  const isSelected = selectedIds.includes(twin._id);
                  const isDeptEng = twin.dept === 'Engineering';
                  const isDeptSec = twin.dept === 'Cybersecurity';
                  const isDeptProd = twin.dept === 'Product';

                  return (
                    <div
                      key={twin._id}
                      onClick={() => toggleTwin(twin._id)}
                      className={`summon-twin-card ${isSelected ? 'selected' : ''}`}
                      style={{
                        border: isSelected ? '2px solid var(--blue-accent)' : '1px solid var(--border)',
                        background: isSelected ? 'var(--blue-accent-soft)' : 'var(--surface)',
                        borderRadius: 10,
                        padding: 12,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        position: 'relative'
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-8">
                          <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: isDeptEng ? '#3E63DD' : isDeptSec ? '#C2422D' : isDeptProd ? '#8A42DD' : '#1F8A5C',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.8rem'
                          }}>
                            {twin.avatarInitials || twin.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                              {twin.name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              {twin.title}
                            </div>
                          </div>
                        </div>
                        <div style={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          border: isSelected ? 'none' : '1px solid var(--border-strong)',
                          background: isSelected ? 'var(--blue-accent)' : 'transparent',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {isSelected && <Check size={13} strokeWidth={3} />}
                        </div>
                      </div>

                      <div className="flex items-center gap-6 mt-4">
                        <span className="badge" style={{
                          fontSize: '0.7rem',
                          padding: '2px 6px',
                          background: 'var(--surface-muted)',
                          color: 'var(--text-secondary)'
                        }}>
                          {twin.dept || 'General'}
                        </span>
                        {twin.visibility === 'all' && (
                          <span className="badge" style={{ fontSize: '0.7rem', padding: '2px 6px', background: '#E6F4EC', color: '#1F8A5C' }}>
                            Global
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {!existingRoundtableId && (
            <>
              {/* Step 2: Preset Topics */}
              <div className="form-section mt-16">
                <label className="section-label" style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Sparkles size={16} style={{ color: 'var(--blue-accent)' }} />
                  2. Choose a High-Impact Problem Preset (Optional)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                  {PRESET_TOPICS.map((p) => (
                    <button
                      type="button"
                      key={p.title}
                      onClick={() => applyPreset(p)}
                      className="preset-chip-btn"
                      style={{
                        textAlign: 'left',
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                        background: topic === p.topic ? 'var(--blue-accent-soft)' : 'var(--surface-muted)',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)' }}>{p.title}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.topic}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Custom Topic */}
              <div className="form-section mt-12">
                <label className="section-label" style={{ fontWeight: 600, fontSize: '0.9rem', display: 'block', marginBottom: 6 }}>
                  3. Discussion Topic or Problem Statement <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <textarea
                  rows={3}
                  className="input-textarea"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.88rem', fontFamily: 'inherit' }}
                  placeholder="e.g. How can we integrate automated financial variance analysis with Keycloak SSO and an intuitive leadership dashboard?"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  required
                />
              </div>

              {/* Step 4: Discussion Mode */}
              <div className="form-section mt-16">
                <label className="section-label" style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Layers size={16} style={{ color: 'var(--blue-accent)' }} />
                  4. Discussion Mode
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
                  {MODES.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => setMode(m.id)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: mode === m.id ? '2px solid var(--blue-accent)' : '1px solid var(--border)',
                        background: mode === m.id ? 'var(--blue-accent-soft)' : 'var(--surface)',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{m.label}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: 2 }}>{m.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="modal-actions flex justify-end gap-12 mt-24 pt-16" style={{ borderTop: '1px solid var(--border)' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-accent"
              disabled={submitting || selectedIds.length < (existingRoundtableId ? 1 : 2) || (!existingRoundtableId && !topic.trim())}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {submitting ? 'Summoning...' : existingRoundtableId ? 'Summon to Room' : 'Launch Roundtable'}
              <Sparkles size={15} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
