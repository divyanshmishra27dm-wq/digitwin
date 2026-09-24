import { useState, useEffect } from 'react';
import api from '../../../services/api.js';
import SkillSelector from '../../../components/SkillSelector.jsx';
import SkillFlowchart from '../../../components/SkillFlowchart.jsx';
import { Sparkles } from 'lucide-react';

export default function StepExpertise({ twin, setTwin, next, back, cvPretext }) {
  const [tags, setTags] = useState(
    (twin?.expertise && twin.expertise.length > 0)
      ? twin.expertise
      : (cvPretext?.expertise || [])
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showLiveFlowchart, setShowLiveFlowchart] = useState(false);

  useEffect(() => {
    if ((!twin?.expertise || twin.expertise.length === 0) && cvPretext?.expertise?.length > 0) {
      setTags(cvPretext.expertise);
    }
  }, [cvPretext, twin?.expertise]);

  const toggleSkill = (skill) => {
    if (tags.includes(skill)) {
      setTags(tags.filter((s) => s !== skill));
    } else {
      setTags([...tags, skill]);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const { data } = await api.patch(`/twins/${twin._id}`, { expertise: tags });
      setTwin(data.twin);
      next();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save expertise.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="wizard-card" onSubmit={submit} style={{ maxWidth: 860 }}>
      <h2>Expertise & Competencies</h2>
      <p className="lead">
        Define the domain knowledge, technical skills, and granular competencies this Digital Twin represents.
      </p>

      {cvPretext?.expertise?.length > 0 && (
        <div
          style={{
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: '0.84rem',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 20,
          }}
        >
          <Sparkles size={15} style={{ color: '#3b82f6', flexShrink: 0 }} />
          <span>
            Auto-populated with <strong>{cvPretext.expertise.length} skills</strong> extracted from the uploaded CV. You can add more, remove, or customize below.
          </span>
        </div>
      )}

      {error && <div className="auth-error">{error}</div>}

      <SkillSelector
        selectedSkills={tags}
        onChange={setTags}
        twinName={twin?.name || "Digital Twin"}
        twinRole={twin?.title || "Intelligence Profile"}
        label="Select Technical & Domain Competencies"
        helperText="Type a context like 'Cybersecurity', 'Machine Learning', 'Full Stack', 'Cloud', or click quick contexts below to drill down."
      />

      <div style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => setShowLiveFlowchart(!showLiveFlowchart)}
          style={{ marginBottom: 12 }}
        >
          {showLiveFlowchart ? 'Hide Flowchart Diagram' : 'Preview Flowchart Diagram'}
        </button>

        {showLiveFlowchart && (
          <SkillFlowchart
            skills={tags}
            twinName={twin?.name || "Digital Twin"}
            twinRole={twin?.title || "Intelligence Profile"}
            onToggleSkill={toggleSkill}
            selectable={true}
            title="Skill Flowchart Architecture"
            subtitle="Live drill-down flowchart of selected competencies"
          />
        )}
      </div>

      <div className="wizard-actions" style={{ marginTop: 24 }}>
        <button type="button" className="btn btn-secondary" onClick={back}>Back</button>
        <button type="submit" className="btn btn-primary" disabled={saving || tags.length === 0}>
          {saving ? 'Saving…' : `Continue with ${tags.length} Skills`}
        </button>
      </div>
    </form>
  );
}
