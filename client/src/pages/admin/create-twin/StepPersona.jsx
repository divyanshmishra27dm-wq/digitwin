import { useState } from 'react';
import { Plus, X, UserCheck, Briefcase, Trash2 } from 'lucide-react';
import api from '../../../services/api.js';

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

export default function StepPersona({ twin, setTwin, next, back, cvPretext }) {
  const [style, setStyle] = useState(
    twin?.communicationStyle?.length
      ? twin.communicationStyle
      : cvPretext?.communicationStyle?.length
      ? cvPretext.communicationStyle
      : []
  );
  const [patterns, setPatterns] = useState(
    twin?.thinkingPatterns?.length
      ? twin.thinkingPatterns
      : cvPretext?.thinkingPatterns?.length
      ? cvPretext.thinkingPatterns
      : ['']
  );
  const [length, setLength] = useState(twin?.responseLength || 'balanced');
  const [titlePersonas, setTitlePersonas] = useState(twin?.titlePersonas || []);
  const [activeTab, setActiveTab] = useState('default');
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const toggleStyle = (s) => setStyle((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  const updatePattern = (i, v) => setPatterns((p) => p.map((x, idx) => (idx === i ? v : x)));
  const addPattern = () => setPatterns((p) => [...p, '']);
  const removePattern = (i) => setPatterns((p) => p.filter((_, idx) => idx !== i));

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

  const submit = async (e) => {
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

      const { data } = await api.patch(`/twins/${twin._id}`, {
        communicationStyle: style,
        thinkingPatterns: patterns.map((p) => p.trim()).filter(Boolean),
        responseLength: length,
        titlePersonas: cleanedTitlePersonas,
      });
      setTwin(data.twin);
      next();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save persona.');
    } finally {
      setSaving(false);
    }
  };

  const currentTitleObj = typeof activeTab === 'number' ? titlePersonas[activeTab] : null;

  return (
    <form className="wizard-card" onSubmit={submit} style={{ maxWidth: 760 }}>
      <h2>Persona & Role Directives</h2>
      <p className="lead">Configure how this Twin communicates and calibrate responses tailored to user job titles (e.g. Business Head, CEO, Tech Lead).</p>

      {error && <div className="auth-error">{error}</div>}

      {/* Tabs */}
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
          <Plus size={14} /> Add Title Persona
        </button>
      </div>

      {/* Modal */}
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
          <div className="card" style={{ maxWidth: 520, width: '90%', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Select Role Template or Custom</h3>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowPresetModal(false)}>
                <X size={16} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, marginBottom: 16 }}>
              {PRESET_TITLE_PERSONAS.map((preset) => (
                <div
                  key={preset.targetTitle}
                  onClick={() => addTitlePersona(preset)}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '10px 14px',
                    cursor: 'pointer',
                    background: 'var(--bg-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Briefcase size={14} style={{ color: 'var(--primary)' }} />
                      {preset.targetTitle}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {preset.toneGuidance.slice(0, 75)}...
                    </div>
                  </div>
                  <Plus size={15} style={{ color: 'var(--primary)' }} />
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

      {/* Tab Content */}
      {activeTab === 'default' ? (
        <div>
          <div className="field">
            <label>Communication Style</label>
            <div className="checkbox-grid">
              {STYLE_OPTIONS.map((s) => (
                <label className={`checkbox-pill${style.includes(s) ? ' checked' : ''}`} key={s}>
                  <input type="checkbox" checked={style.includes(s)} onChange={() => toggleStyle(s)} />
                  {s}
                </label>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Thinking Patterns</label>
            {patterns.map((p, i) => (
              <div className="dynamic-list-row" key={i} style={{ marginBottom: 8 }}>
                <input className="input" value={p} onChange={(e) => updatePattern(i, e.target.value)} placeholder="e.g. Start with the problem." />
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => removePattern(i)}><X size={15} /></button>
              </div>
            ))}
            <button type="button" className="btn btn-secondary btn-sm" onClick={addPattern}><Plus size={14} /> Add pattern</button>
          </div>

          <div className="field">
            <label>Response Behaviour</label>
            <select className="select" value={length} onChange={(e) => setLength(e.target.value)}>
              {LENGTH_OPTIONS.map((o) => <option key={o} value={o}>{o[0].toUpperCase() + o.slice(1)}</option>)}
            </select>
          </div>
        </div>
      ) : (
        currentTitleObj && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                Configuring: {currentTitleObj.targetTitle || 'Custom Role'}
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ color: '#ef4444' }}
                onClick={() => removeTitlePersona(activeTab)}
              >
                <Trash2 size={14} /> Remove
              </button>
            </div>

            <div className="field">
              <label>Target Job Title</label>
              <input
                className="input"
                placeholder="e.g. Business Head, CEO, Tech Lead"
                value={currentTitleObj.targetTitle || ''}
                onChange={(e) => updateActiveTitlePersona('targetTitle', e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label>Role Calibration & Tone Guidance</label>
              <textarea
                className="input"
                rows={2}
                placeholder="Directives on how to communicate with this role..."
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
                    placeholder="e.g., Evaluate market opportunity first..."
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
        )
      )}

      <div className="wizard-actions">
        <button type="button" className="btn btn-secondary" onClick={back}>Back</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Continue'}</button>
      </div>
    </form>
  );
}
