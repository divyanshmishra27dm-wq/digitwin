import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PhoneCall, Users2, Sparkles, Check, X, Shield, Cpu, Briefcase, Zap, HelpCircle, ArrowRight
} from 'lucide-react';
import api from '../services/api.js';
import ErrorAlert from './ErrorAlert.jsx';

const PRESET_CALL_TOPICS = [
  {
    title: 'Enterprise AI & Security Debate',
    topic: 'How should we balance rapid AI prototyping speed against strict zero-trust IAM boundaries and data governance in production?',
    mode: 'debate',
  },
  {
    title: 'Quarterly Architecture & Scaling Review',
    topic: 'Review our scalable LLM mesh infrastructure, token caching strategy, and customer journey MVP milestones.',
    mode: 'team_call',
  },
  {
    title: 'EdTech World Models & Decision Simulation',
    topic: 'Can we simulate learner behavior and course completion outcomes using generative AI world models?',
    mode: 'team_call',
  },
  {
    title: 'Cloud Migration & Infrastructure Resiliency',
    topic: 'Containerizing services with Docker, deploying to AWS/Azure, and achieving sub-200ms p99 latency guarantees.',
    mode: 'team_call',
  },
];

const CALL_MODES = [
  {
    id: 'team_call',
    label: 'Collaborative Sync',
    icon: PhoneCall,
    desc: 'Interactive discussion with speech, Q&A, and shared problem-solving',
    color: '#3E63DD',
    bg: 'rgba(62, 99, 221, 0.1)',
  },
  {
    id: 'debate',
    label: 'Cross-Domain Debate',
    icon: Zap,
    desc: 'Twins actively challenge trade-offs, probe edge cases, and debate each other',
    color: '#D97706',
    bg: 'rgba(217, 119, 6, 0.1)',
  },
  {
    id: 'briefing',
    label: 'Executive Briefing',
    icon: Sparkles,
    desc: 'High-level concise updates with direct leadership Q&A',
    color: '#7C3AED',
    bg: 'rgba(124, 58, 237, 0.1)',
  },
];

const DEPT_COLORS = {
  Engineering: { bg: '#3E63DD', soft: 'rgba(62, 99, 221, 0.12)', text: '#2E4CB0' },
  Product: { bg: '#8A42DD', soft: 'rgba(138, 66, 221, 0.12)', text: '#6D28D9' },
  Cybersecurity: { bg: '#C2422D', soft: 'rgba(194, 66, 45, 0.12)', text: '#991B1B' },
  Executive: { bg: '#1F8A5C', soft: 'rgba(31, 138, 92, 0.12)', text: '#065F46' },
  Operations: { bg: '#D97706', soft: 'rgba(217, 119, 6, 0.12)', text: '#92400E' },
  Sales: { bg: '#0284C7', soft: 'rgba(2, 132, 199, 0.12)', text: '#0369A1' },
};

export default function CallModal({
  isOpen,
  onClose,
  initialSelectedTwinId = null,
  existingCallId = null,
  alreadyInCallTwinIds = [],
  onTwinsInvited = null,
}) {
  const navigate = useNavigate();
  const [twins, setTwins] = useState([]);
  const [selectedIds, setSelectedIds] = useState(initialSelectedTwinId ? [initialSelectedTwinId] : []);
  const [topic, setTopic] = useState('');
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState('team_call');
  const [activeDept, setActiveDept] = useState('all');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError('');
    api.get('/twins')
      .then(({ data }) => {
        setTwins(data.twins || []);
        if (initialSelectedTwinId && !selectedIds.includes(initialSelectedTwinId)) {
          setSelectedIds([initialSelectedTwinId]);
        }
      })
      .catch(() => setError('Could not load accessible Digital Twins.'))
      .finally(() => setLoading(false));
  }, [isOpen, initialSelectedTwinId]);

  if (!isOpen) return null;

  const isInviteMode = !!existingCallId;

  const availableTwins = isInviteMode
    ? twins.filter((t) => !alreadyInCallTwinIds.includes(t._id))
    : twins;

  const filteredTwins = activeDept === 'all'
    ? availableTwins
    : availableTwins.filter((t) => (t.dept || 'Engineering') === activeDept);

  const departments = ['all', ...Array.from(new Set(availableTwins.map((t) => t.dept || 'Engineering')))];

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedIds(filteredTwins.map((t) => t._id));
  };

  const clearAll = () => {
    setSelectedIds([]);
  };

  const handleApplyPreset = (preset) => {
    setTitle(preset.title);
    setTopic(preset.topic);
    setMode(preset.mode);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedIds.length === 0) {
      setError('Please select at least one Digital Twin to join the call.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      if (isInviteMode) {
        // Invite to existing call
        const { data } = await api.post(`/calls/${existingCallId}/invite`, {
          twinIds: selectedIds,
        });
        onTwinsInvited?.(data.addedTwins);
        onClose();
      } else {
        // Start brand new call
        if (!topic.trim()) {
          setError('Please provide a meeting agenda or topic for the call.');
          setSubmitting(false);
          return;
        }

        const { data } = await api.post('/calls', {
          title: title.trim() || `Team Call: ${topic.slice(0, 45)}`,
          topic: topic.trim(),
          mode,
          twinIds: selectedIds,
        });

        onClose();
        navigate(`/calls/${data.call._id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initialize call.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onMouseDown={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(10, 17, 34, 0.65)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        zIndex: 1000,
      }}
    >
      <div
        className="modal-panel"
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 780,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          borderRadius: 16,
          boxShadow: '0 25px 60px rgba(10, 17, 34, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          padding: 0,
          overflow: 'hidden',
          animation: 'modal-in 180ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* ── Modal Header ────────────────────────────────────────── */}
        <div
          style={{
            padding: '22px 28px 18px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, #FFFFFF 0%, #F9FAFB 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #3E63DD 0%, #2563EB 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(62, 99, 221, 0.3)',
                flexShrink: 0,
              }}
            >
              <PhoneCall size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
                {isInviteMode ? 'Invite Digital Twins to Live Call' : 'Start Team Call with Digital Twins'}
              </h2>
              <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {isInviteMode
                  ? 'Bring additional department twins into the active stage in real time.'
                  : 'Host an interactive voice meeting with AI personas who converse, debate, and speak aloud.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: 'none',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface-muted)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-tertiary)';
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Modal Form Body ─────────────────────────────────────── */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ overflowY: 'auto', flex: 1, padding: '24px 28px' }}>
            {error && <ErrorAlert message={error} style={{ marginBottom: 18 }} />}

            {!isInviteMode && (
              <>
                {/* Step 1: Call Format */}
                <div style={{ marginBottom: 22 }}>
                  <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>
                    1. Select Discussion Format
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    {CALL_MODES.map((m) => {
                      const Icon = m.icon;
                      const active = mode === m.id;
                      return (
                        <div
                          key={m.id}
                          onClick={() => setMode(m.id)}
                          style={{
                            border: active ? `2px solid ${m.color}` : '1px solid var(--border)',
                            background: active ? m.bg : 'var(--surface)',
                            borderRadius: 12,
                            padding: '14px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 6,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 700, fontSize: '0.9rem', color: active ? m.color : 'var(--text-primary)' }}>
                            <Icon size={16} />
                            {m.label}
                          </div>
                          <div style={{ fontSize: '0.78rem', lineHeight: 1.35, color: 'var(--text-secondary)' }}>
                            {m.desc}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Step 2: Call Title & Topic */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>
                    2. Call Title / Meeting Name
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g., AI Systems Architecture & Security Alignment"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: '1px solid var(--border-strong)',
                      fontSize: '0.92rem',
                    }}
                  />
                </div>

                <div style={{ marginBottom: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      3. Meeting Agenda / Discussion Prompt <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                  </div>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="What specific question, architectural trade-off, or strategic topic should the digital twins converse and debate?"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: '1px solid var(--border-strong)',
                      fontSize: '0.92rem',
                      lineHeight: 1.45,
                      resize: 'vertical',
                    }}
                  />
                </div>

                {/* Quick Topic Presets */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Sparkles size={13} style={{ color: '#D97706' }} /> Suggested Topic Presets
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {PRESET_CALL_TOPICS.map((p, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleApplyPreset(p)}
                        style={{
                          background: 'var(--surface-muted)',
                          border: '1px solid var(--border)',
                          padding: '6px 12px',
                          borderRadius: 20,
                          fontSize: '0.78rem',
                          fontWeight: 500,
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--blue-accent)';
                          e.currentTarget.style.color = 'var(--blue-accent)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border)';
                          e.currentTarget.style.color = 'var(--text-secondary)';
                        }}
                      >
                        + {p.title}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Step 3: Select Digital Twins */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                    {isInviteMode ? 'Select Twins to Add' : '4. Invite Digital Twins to the Call'}
                  </label>
                  <span
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: 'var(--blue-accent)',
                      background: 'var(--blue-accent-soft)',
                      padding: '2px 8px',
                      borderRadius: 12,
                    }}
                  >
                    {selectedIds.length} Selected
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    type="button"
                    onClick={selectAll}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--border)',
                      padding: '3px 8px',
                      borderRadius: 6,
                      fontSize: '0.74rem',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={clearAll}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--border)',
                      padding: '3px 8px',
                      borderRadius: 6,
                      fontSize: '0.74rem',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Department Tabs */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto', paddingBottom: 2 }}>
                {departments.map((dept) => {
                  const active = activeDept === dept;
                  return (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => setActiveDept(dept)}
                      style={{
                        background: active ? 'var(--blue-accent)' : 'var(--surface-muted)',
                        border: `1px solid ${active ? 'var(--blue-accent)' : 'var(--border)'}`,
                        color: active ? '#ffffff' : 'var(--text-secondary)',
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {dept}
                    </button>
                  );
                })}
              </div>

              {loading ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading Digital Twins…</div>
              ) : availableTwins.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--surface-muted)', borderRadius: 10 }}>
                  All available digital twins are already participating in this call!
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 10 }}>
                  {filteredTwins.map((twin) => {
                    const isSelected = selectedIds.includes(twin._id);
                    const deptStyle = DEPT_COLORS[twin.dept] || DEPT_COLORS.Engineering;
                    return (
                      <div
                        key={twin._id}
                        onClick={() => toggleSelect(twin._id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '10px 12px',
                          borderRadius: 10,
                          cursor: 'pointer',
                          background: isSelected ? 'var(--blue-accent-soft)' : 'var(--surface)',
                          border: isSelected ? '2px solid var(--blue-accent)' : '1px solid var(--border)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: deptStyle.bg,
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            flexShrink: 0,
                          }}
                        >
                          {twin.avatarInitials || twin.name.slice(0, 2).toUpperCase()}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {twin.name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {twin.title}
                          </div>
                          <span
                            style={{
                              display: 'inline-block',
                              fontSize: '0.68rem',
                              fontWeight: 600,
                              color: deptStyle.text,
                              background: deptStyle.soft,
                              padding: '1px 6px',
                              borderRadius: 4,
                              marginTop: 2,
                            }}
                          >
                            {twin.dept || 'Engineering'}
                          </span>
                        </div>

                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            border: isSelected ? 'none' : '1px solid var(--border-strong)',
                            background: isSelected ? 'var(--blue-accent)' : 'transparent',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Modal Footer ────────────────────────────────────────── */}
          <div
            style={{
              padding: '16px 28px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#F9FAFB',
            }}
          >
            <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
              {selectedIds.length === 0 ? (
                'Select at least 1 twin'
              ) : (
                <span>
                  <strong>{selectedIds.length}</strong> Digital Twin{selectedIds.length > 1 ? 's' : ''} ready to connect
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                style={{ padding: '8px 16px', fontSize: '0.88rem' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-accent"
                disabled={submitting || selectedIds.length === 0}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '8px 20px',
                  fontSize: '0.88rem',
                  background: 'linear-gradient(135deg, #3E63DD 0%, #2563EB 100%)',
                }}
              >
                <PhoneCall size={15} />
                {submitting
                  ? 'Connecting Stage…'
                  : isInviteMode
                  ? `Invite ${selectedIds.length} Twin${selectedIds.length > 1 ? 's' : ''}`
                  : `Launch Team Call (${selectedIds.length})`}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
