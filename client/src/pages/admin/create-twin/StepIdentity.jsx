import { useState } from 'react';
import api from '../../../services/api.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import CVUploader from '../../../components/CVUploader.jsx';

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

export default function StepIdentity({ twin, setTwin, next, cvPretext, setCvPretext }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: twin?.name || cvPretext?.name || user?.name || '',
    title: twin?.title || cvPretext?.title || user?.title || '',
    organization: twin?.organization || cvPretext?.organization || 'NIIT Ltd.',
    dept: twin?.dept || cvPretext?.dept || user?.dept || 'Engineering',
    visibility: twin?.visibility || 'department',
    bio: twin?.bio || cvPretext?.bio || '',
    tagline: twin?.tagline || cvPretext?.tagline || '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleCVParsed = (parsed) => {
    if (!parsed) return;
    if (setCvPretext) {
      setCvPretext(parsed);
    }
    setForm((f) => ({
      ...f,
      name: parsed.name || f.name,
      title: parsed.title || f.title,
      organization: parsed.organization || f.organization,
      dept: parsed.dept || f.dept,
      bio: parsed.bio || f.bio,
      tagline: parsed.tagline || f.tagline,
    }));
  };

  const handleCVClear = () => {
    if (setCvPretext) {
      setCvPretext(null);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.title.trim()) {
      setError('Full name and professional title are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (twin?._id) {
        const { data } = await api.patch(`/twins/${twin._id}`, form);
        setTwin(data.twin);
      } else {
        const payload = {
          ...form,
          expertise: cvPretext?.expertise || [],
          communicationStyle: cvPretext?.communicationStyle || [],
          thinkingPatterns: cvPretext?.thinkingPatterns || [],
          education: cvPretext?.education || [],
          experience: cvPretext?.experience || [],
          cvFileName: cvPretext?.fileName || '',
          initialProjects: cvPretext?.projects || [],
        };
        const { data } = await api.post('/twins', payload);
        setTwin(data.twin);
      }
      next();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save this step.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="wizard-card" onSubmit={submit}>
      <h2>Identity & Knowledge Ingestion</h2>
      <p className="lead">
        Who is this Digital Twin representing? Upload a CV to auto-extract their documented projects, background, and skills, or enter manually.
      </p>

      {/* CV Uploader Dropzone at the start */}
      {!twin?._id && (
        <CVUploader
          onParsed={handleCVParsed}
          onClear={handleCVClear}
          initialParsed={cvPretext}
        />
      )}

      {error && <div className="auth-error">{error}</div>}

      <div className="field">
        <label>Full Name</label>
        <input
          className="input"
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          placeholder="Divyansh Mishra"
          required
        />
      </div>

      <div className="field">
        <label>Professional Title</label>
        <input
          className="input"
          value={form.title}
          onChange={(e) => update('title', e.target.value)}
          placeholder="Leadership Trainee & AI Architect"
          required
        />
      </div>

      <div className="grid-2">
        <div className="field">
          <label>Department</label>
          <input
            className="input"
            value={form.dept}
            onChange={(e) => update('dept', e.target.value)}
            list="create-twin-dept-suggestions"
            placeholder="Engineering"
            required
          />
          <datalist id="create-twin-dept-suggestions">
            {DEPT_OPTIONS.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
          <span className="hint">Users in this department can discover this twin.</span>
        </div>

        <div className="field">
          <label>Initial Scope</label>
          <select
            className="select"
            value={form.visibility}
            onChange={(e) => update('visibility', e.target.value)}
          >
            <option value="department">Department Only (Scoped)</option>
            <option value="all">All NIIT Departments (Global)</option>
          </select>
          <span className="hint">Admins can publish across all departments.</span>
        </div>
      </div>

      <div className="field">
        <label>Organization</label>
        <input
          className="input"
          value={form.organization}
          onChange={(e) => update('organization', e.target.value)}
        />
      </div>

      <div className="field">
        <label>Tagline</label>
        <input
          className="input"
          value={form.tagline}
          onChange={(e) => update('tagline', e.target.value)}
          placeholder='"Ask me about my projects, technical thinking and experiences."'
        />
      </div>

      <div className="field">
        <label>Short Bio</label>
        <textarea
          className="textarea"
          style={{ minHeight: 90 }}
          value={form.bio}
          onChange={(e) => update('bio', e.target.value)}
          placeholder="A polished, factual biography."
        />
        <span className="hint">Keep this factual — this feeds the Twin's public profile and system prompt.</span>
      </div>

      <div className="wizard-actions">
        <span />
        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Continue to Expertise'}
        </button>
      </div>
    </form>
  );
}
