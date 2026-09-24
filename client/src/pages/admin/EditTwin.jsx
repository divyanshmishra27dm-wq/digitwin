import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, GitFork } from 'lucide-react';
import api from '../../services/api.js';
import ErrorAlert from '../../components/ErrorAlert.jsx';
import SkillSelector from '../../components/SkillSelector.jsx';
import SkillFlowchart from '../../components/SkillFlowchart.jsx';

const DEPT_OPTIONS = [
  'Engineering',
  'Product',
  'Cybersecurity',
  'Executive',
  'Marketing',
  'Sales',
  'Finance',
  'Human Resources',
  'Operations',
  'General',
];

export default function EditTwin() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [showEmbeddedFlowchart, setShowEmbeddedFlowchart] = useState(false);

  useEffect(() => {
    api.get(`/twins/${id}`).then(({ data }) => setForm(data.twin)).catch(() => setError('Could not load this Twin.'));
  }, [id]);

  if (error) return <ErrorAlert message={error} />;
  if (!form) {
    return (
      <div style={{ maxWidth: 860 }}>
        <div className="skeleton" style={{ width: 120, height: 32, marginBottom: 20 }} />
        <div className="skeleton" style={{ height: 400 }} />
      </div>
    );
  }

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const toggleSkill = (skill) => {
    const current = form.expertise || [];
    if (current.includes(skill)) {
      update('expertise', current.filter((s) => s !== skill));
    } else {
      update('expertise', [...current, skill]);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      const { data } = await api.patch(`/twins/${id}`, {
        name: form.name,
        title: form.title,
        organization: form.organization,
        dept: form.dept,
        visibility: form.visibility,
        bio: form.bio,
        tagline: form.tagline,
        expertise: form.expertise || [],
      });
      setForm(data.twin);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 920, margin: '0 auto' }}>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/admin/twins/${id}`)} style={{ marginBottom: 20 }}>
        <ArrowLeft size={15} /> Back to Twin
      </button>

      <div className="page-title" style={{ marginBottom: 6 }}>Edit {form.name}</div>
      <p className="page-subtitle" style={{ marginBottom: 24 }}>Update identity, department scope, and technical expertise ontology.</p>

      {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}
      {saved && <div className="badge badge-success" style={{ marginBottom: 16, padding: '8px 16px', fontSize: 13 }}>✓ Changes successfully saved</div>}

      <form className="card" onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div className="field"><label>Full Name</label><input className="input" value={form.name || ''} onChange={(e) => update('name', e.target.value)} required /></div>
        <div className="field"><label>Professional Title</label><input className="input" value={form.title || ''} onChange={(e) => update('title', e.target.value)} required /></div>

        <div className="grid-2">
          <div className="field">
            <label>Department Scope</label>
            <input
              className="input"
              value={form.dept || 'Engineering'}
              onChange={(e) => update('dept', e.target.value)}
              list="edit-twin-dept-suggestions"
              required
            />
            <datalist id="edit-twin-dept-suggestions">
              {DEPT_OPTIONS.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </div>

          <div className="field">
            <label>Access Visibility</label>
            <select
              className="select"
              value={form.visibility || 'department'}
              onChange={(e) => update('visibility', e.target.value)}
            >
              <option value="department">Department Only (Scoped)</option>
              <option value="all">All NIIT Departments (Global)</option>
            </select>
          </div>
        </div>

        <div className="field"><label>Organization</label><input className="input" value={form.organization || ''} onChange={(e) => update('organization', e.target.value)} /></div>
        <div className="field"><label>Tagline</label><input className="input" value={form.tagline || ''} onChange={(e) => update('tagline', e.target.value)} /></div>
        <div className="field"><label>Bio</label><textarea className="textarea" value={form.bio || ''} onChange={(e) => update('bio', e.target.value)} /></div>

        {/* In-depth Context Skill Selector */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 6 }}>
          <SkillSelector
            selectedSkills={form.expertise || []}
            onChange={(newSkills) => update('expertise', newSkills)}
            twinName={form.name}
            twinRole={form.title}
            label="Expertise & Technical Competencies"
            helperText="Type a context (e.g. 'Cybersecurity', 'Digital Marketing', 'Software Engineering', 'Python') to drill down and select multiple skills."
          />
        </div>

        {/* Embedded Flowchart Toggle Section */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 18 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
            <div>
              <div className="section-title">Skill Architecture Flowchart</div>
              <p className="text-muted" style={{ fontSize: 13 }}>Visual flowchart graph showing active skill ontology branches.</p>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setShowEmbeddedFlowchart(!showEmbeddedFlowchart)}
            >
              <GitFork size={14} /> {showEmbeddedFlowchart ? 'Hide Flowchart' : 'Show Flowchart Diagram'}
            </button>
          </div>

          {showEmbeddedFlowchart && (
            <SkillFlowchart
              skills={form.expertise || []}
              twinName={form.name}
              twinRole={form.title}
              onToggleSkill={toggleSkill}
              selectable={true}
              title={`${form.name}'s Skill Flowchart Diagram`}
              subtitle="Flowchart visual of active domain branches and competencies"
            />
          )}
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Saving changes…' : 'Save Changes'}
          </button>
          <button className="btn btn-secondary" type="button" onClick={() => navigate(`/admin/twins/${id}`)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
