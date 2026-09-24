import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, UserCheck, ShieldCheck, Briefcase, Code, Sparkles, Trash2, Info } from 'lucide-react';
import api from '../../services/api.js';
import ErrorAlert from '../../components/ErrorAlert.jsx';

const STYLE_OPTIONS = [
  'Direct', 'Concise', 'Conversational', 'Technical',
  'Strategic', 'Storytelling', 'Formal', 'Practical',
  'Analytical', 'Executive', 'Mentoring', 'Visionary'
];
const LENGTH_OPTIONS = ['concise', 'balanced', 'detailed'];

const PRESET_TITLE_PERSONAS = [
  {
    targetTitle: 'Business Head',
    toneGuidance: 'Provide high-level strategic summaries, revenue and ROI impact, market positioning, and operational feasibility. Minimize low-level technical jargon.',
    communicationStyle: ['Strategic', 'Concise', 'Executive', 'Direct'],
    thinkingPatterns: [
      'Evaluate market opportunity and ROI first',
      'Assess operational risks and time-to-market trade-offs',
      'Align outcomes with organizational quarterly objectives'
    ],
    responseLength: 'concise',
  },
  {
    targetTitle: 'CEO / Executive',
    toneGuidance: 'Deliver concise executive briefings, strategic vision, bottom-line metrics, competitive advantage, and key decision levers.',
    communicationStyle: ['Executive', 'Strategic', 'Visionary', 'Direct'],
    thinkingPatterns: [
      'Synthesize high-level business vision and enterprise impact',
      'Highlight critical governance and competitive advantages',
      'Present clear bottom-line recommendations'
    ],
    responseLength: 'concise',
  },
  {
    targetTitle: 'Tech Lead / Architect',
    toneGuidance: 'Discuss in-depth system architecture, engineering trade-offs, code paradigms, scalability, security, and concrete technical solutions.',
    communicationStyle: ['Technical', 'Analytical', 'Practical', 'Direct'],
    thinkingPatterns: [
      'Analyze architectural trade-offs, scalability, and latency bottlenecks',
      'Provide concrete implementation specifics and best practices',
      'Evaluate maintainability, technical debt, and test coverage'
    ],
    responseLength: 'detailed',
  },
  {
    targetTitle: 'Product Manager',
    toneGuidance: 'Focus on user experience, feature prioritization, customer problem-solution fit, roadmap milestones, and MVP validation metrics.',
    communicationStyle: ['Strategic', 'Conversational', 'Practical', 'Direct'],
    thinkingPatterns: [
      'Prioritize user pain points and customer journey mapping',
      'Balance engineering effort against customer value delivery',
      'Define clear measurable success metrics (KPIs)'
    ],
    responseLength: 'balanced',
  },
];

export default function PersonaEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [twin, setTwin] = useState(null);
  
  // Base default persona
  const [baseStyle, setBaseStyle] = useState([]);
  const [basePatterns, setBasePatterns] = useState(['']);
  const [baseLength, setBaseLength] = useState('balanced');

  // Title-specific personas
  const [titlePersonas, setTitlePersonas] = useState([]);
  
  // Active Tab: 'default' or number index in titlePersonas
  const [activeTab, setActiveTab] = useState('default');
  const [showPresetModal, setShowPresetModal] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/twins/${id}`).then(({ data }) => {
      const t = data.twin;
      setTwin(t);
      setBaseStyle(t.communicationStyle || []);
      setBasePatterns(t.thinkingPatterns?.length ? t.thinkingPatterns : ['']);
      setBaseLength(t.responseLength || 'balanced');
      setTitlePersonas(t.titlePersonas || []);
    }).catch(() => setError('Could not load this Twin.'));
  }, [id]);

  if (error) return <ErrorAlert message={error} />;
  if (!twin) {
    return (
      <div style={{ maxWidth: 880 }}>
        <div className="skeleton" style={{ width: 120, height: 32, marginBottom: 20 }} />
        <div className="skeleton" style={{ height: 450 }} />
      </div>
    );
  }

  // Helpers for base persona
  const toggleBaseStyle = (s) => setBaseStyle((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  const updateBasePattern = (i, v) => setBasePatterns((p) => p.map((x, idx) => (idx === i ? v : x)));

  // Helpers for title personas
  const addTitlePersona = (preset) => {
    const newPersona = preset
      ? { ...preset }
      : {
          targetTitle: 'New Role / Title',
          toneGuidance: '',
          communicationStyle: ['Conversational', 'Direct'],
          thinkingPatterns: [''],
          responseLength: 'balanced',
        };
    const nextList = [...titlePersonas, newPersona];
    setTitlePersonas(nextList);
    setActiveTab(nextList.length - 1);
    setShowPresetModal(false);
  };

  const removeTitlePersona = (index) => {
    const nextList = titlePersonas.filter((_, idx) => idx !== index);
    setTitlePersonas(nextList);
    if (activeTab === index) {
      setActiveTab('default');
    } else if (typeof activeTab === 'number' && activeTab > index) {
      setActiveTab(activeTab - 1);
    }
  };

  const updateActiveTitlePersona = (field, value) => {
    if (activeTab === 'default') return;
    setTitlePersonas((prev) =>
      prev.map((item, idx) => (idx === activeTab ? { ...item, [field]: value } : item))
    );
  };

  const toggleTitlePersonaStyle = (s) => {
    if (activeTab === 'default') return;
    const currentList = titlePersonas[activeTab]?.communicationStyle || [];
    const updated = currentList.includes(s) ? currentList.filter((x) => x !== s) : [...currentList, s];
    updateActiveTitlePersona('communicationStyle', updated);
  };

  const updateTitlePattern = (patternIndex, val) => {
    if (activeTab === 'default') return;
    const current = titlePersonas[activeTab]?.thinkingPatterns || [''];
    const updated = current.map((p, i) => (i === patternIndex ? val : p));
    updateActiveTitlePersona('thinkingPatterns', updated);
  };

  const addTitlePatternRow = () => {
    if (activeTab === 'default') return;
    const current = titlePersonas[activeTab]?.thinkingPatterns || [];
    updateActiveTitlePersona('thinkingPatterns', [...current, '']);
  };

  const removeTitlePatternRow = (patternIndex) => {
    if (activeTab === 'default') return;
    const current = titlePersonas[activeTab]?.thinkingPatterns || [];
    const updated = current.filter((_, i) => i !== patternIndex);
    updateActiveTitlePersona('thinkingPatterns', updated.length ? updated : ['']);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const cleanedTitlePersonas = titlePersonas
        .filter((tp) => tp.targetTitle && tp.targetTitle.trim())
        .map((tp) => ({
          ...tp,
          targetTitle: tp.targetTitle.trim(),
          toneGuidance: tp.toneGuidance?.trim() || '',
          thinkingPatterns: (tp.thinkingPatterns || []).map((p) => p.trim()).filter(Boolean),
        }));

      await api.patch(`/twins/${id}`, {
        communicationStyle: baseStyle,
        thinkingPatterns: basePatterns.map((p) => p.trim()).filter(Boolean),
        responseLength: baseLength,
        titlePersonas: cleanedTitlePersonas,
      });
      setTitlePersonas(cleanedTitlePersonas);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save persona.');
    } finally {
      setSaving(false);
    }
  };

  const currentTitleObj = typeof activeTab === 'number' ? titlePersonas[activeTab] : null;

  return (
    <div style={{ maxWidth: 880 }}>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/admin/twins/${id}`)} style={{ marginBottom: 20 }}>
        <ArrowLeft size={15} /> Back to Twin
      </button>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div className="page-title" style={{ marginBottom: 4 }}>Persona & Role Calibration — {twin.name}</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
            Configure how this Digital Twin thinks and responds by default, and calibrate specialized personas for specific job titles (e.g. Business Head, CEO, Tech Lead).
          </p>
        </div>
        {saved && <div className="badge badge-success" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>✓ Saved</div>}
      </div>

      {/* Tabs Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        overflowX: 'auto',
        paddingBottom: 8,
        marginBottom: 20,
        borderBottom: '1px solid var(--border)'
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('default')}
          className={`btn btn-sm ${activeTab === 'default' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
        >
          <UserCheck size={14} />
          <span>Default Persona</span>
        </button>

        {titlePersonas.map((tp, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setActiveTab(idx)}
            className={`btn btn-sm ${activeTab === idx ? 'btn-primary' : 'btn-ghost'}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              whiteSpace: 'nowrap',
              position: 'relative'
            }}
          >
            <Briefcase size={13} />
            <span>{tp.targetTitle || `Persona ${idx + 1}`}</span>
            <span
              onClick={(e) => {
                e.stopPropagation();
                removeTitlePersona(idx);
              }}
              style={{
                marginLeft: 4,
                padding: '2px 4px',
                borderRadius: '50%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.7,
                cursor: 'pointer'
              }}
              title="Remove persona"
            >
              <X size={12} />
            </span>
          </button>
        ))}

        <button
          type="button"
          onClick={() => setShowPresetModal(true)}
          className="btn btn-secondary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', marginLeft: 'auto' }}
        >
          <Plus size={14} /> Add Persona for Title
        </button>
      </div>

      {/* Preset Modal */}
      {showPresetModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div className="card" style={{ maxWidth: 540, width: '90%', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Select Role Template or Custom</h3>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowPresetModal(false)}>
                <X size={16} />
              </button>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>
              Choose a calibrated role preset to customize, or start with a blank custom role:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10, marginBottom: 20 }}>
              {PRESET_TITLE_PERSONAS.map((preset) => (
                <div
                  key={preset.targetTitle}
                  onClick={() => addTitlePersona(preset)}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '12px 16px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    background: 'var(--bg-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Briefcase size={14} style={{ color: 'var(--primary)' }} />
                      {preset.targetTitle}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                      {preset.toneGuidance.slice(0, 85)}...
                    </div>
                  </div>
                  <Plus size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                </div>
              ))}
            </div>

            <button
              type="button"
              className="btn btn-outline"
              style={{ width: '100%' }}
              onClick={() => addTitlePersona(null)}
            >
              + Create Custom Title Persona
            </button>
          </div>
        </div>
      )}

      {/* Main Form */}
      <form className="card" onSubmit={save}>
        {activeTab === 'default' ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <UserCheck size={18} style={{ color: 'var(--primary)' }} />
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Default Persona</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Active when no specific role matching exists for the logged-in user.
                </span>
              </div>
            </div>

            <div className="field">
              <label>Communication Style</label>
              <div className="checkbox-grid">
                {STYLE_OPTIONS.map((s) => (
                  <label className={`checkbox-pill${baseStyle.includes(s) ? ' checked' : ''}`} key={s}>
                    <input type="checkbox" checked={baseStyle.includes(s)} onChange={() => toggleBaseStyle(s)} />
                    {s}
                  </label>
                ))}
              </div>
            </div>

            <div className="field">
              <label>Core Thinking Patterns</label>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: -4, marginBottom: 8 }}>
                Cognitive heuristics and principles this twin uses when reasoning through answers.
              </p>
              {basePatterns.map((p, i) => (
                <div className="dynamic-list-row" key={i} style={{ marginBottom: 8 }}>
                  <input
                    className="input"
                    placeholder="e.g., First-principles reasoning, emphasize empirical data..."
                    value={p}
                    onChange={(e) => updateBasePattern(i, e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setBasePatterns((prev) => prev.filter((_, idx) => idx !== i))}
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setBasePatterns((p) => [...p, ''])}
              >
                <Plus size={14} /> Add pattern
              </button>
            </div>

            <div className="field">
              <label>Default Response Behaviour</label>
              <select className="select" value={baseLength} onChange={(e) => setBaseLength(e.target.value)}>
                {LENGTH_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o[0].toUpperCase() + o.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div>
            {currentTitleObj && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Briefcase size={18} style={{ color: 'var(--primary)' }} />
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.05rem' }}>
                        Persona for {currentTitleObj.targetTitle || 'Custom Role'}
                      </h3>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        When a user with title matching this role chats with the Twin, these calibration directives take effect.
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ color: '#ef4444' }}
                    onClick={() => removeTitlePersona(activeTab)}
                  >
                    <Trash2 size={15} /> Remove Persona
                  </button>
                </div>

                <div className="field">
                  <label>Target Job Title / Role Keyword</label>
                  <input
                    className="input"
                    placeholder="e.g. Business Head, CEO, Tech Lead, Product Manager"
                    value={currentTitleObj.targetTitle || ''}
                    onChange={(e) => updateActiveTitlePersona('targetTitle', e.target.value)}
                    required
                  />
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                    Matches users with this title (case-insensitive fuzzy match, e.g. "Business Head", "CEO", "Tech Lead").
                  </span>
                </div>

                <div className="field">
                  <label>Role Calibration & Tone Guidance</label>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="Provide specific directives for how the twin should talk to this title (e.g. Focus on high-level ROI, strategic impact, and avoid low-level code specifics)..."
                    value={currentTitleObj.toneGuidance || ''}
                    onChange={(e) => updateActiveTitlePersona('toneGuidance', e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>Communication Style for this Role</label>
                  <div className="checkbox-grid">
                    {STYLE_OPTIONS.map((s) => (
                      <label
                        className={`checkbox-pill${(currentTitleObj.communicationStyle || []).includes(s) ? ' checked' : ''}`}
                        key={s}
                      >
                        <input
                          type="checkbox"
                          checked={(currentTitleObj.communicationStyle || []).includes(s)}
                          onChange={() => toggleTitlePersonaStyle(s)}
                        />
                        {s}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="field">
                  <label>Role-Specific Thinking Patterns</label>
                  {(currentTitleObj.thinkingPatterns || ['']).map((p, i) => (
                    <div className="dynamic-list-row" key={i} style={{ marginBottom: 8 }}>
                      <input
                        className="input"
                        placeholder="e.g., Evaluate market opportunity first, consider trade-offs..."
                        value={p}
                        onChange={(e) => updateTitlePattern(i, e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => removeTitlePatternRow(i)}
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={addTitlePatternRow}
                  >
                    <Plus size={14} /> Add role pattern
                  </button>
                </div>

                <div className="field">
                  <label>Response Behaviour for this Role</label>
                  <select
                    className="select"
                    value={currentTitleObj.responseLength || 'balanced'}
                    onChange={(e) => updateActiveTitlePersona('responseLength', e.target.value)}
                  >
                    {LENGTH_OPTIONS.map((o) => (
                      <option key={o} value={o}>{o[0].toUpperCase() + o.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'center' }}>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Saving Changes…' : 'Save Persona Calibration'}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => navigate(`/admin/twins/${id}`)}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
