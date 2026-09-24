import { useState } from 'react';
import { Building2, Briefcase, Shield, User, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../services/api.js';

export default function Profile() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setSubmitting(true);
    try {
      await api.patch('/users/me/password', { currentPassword, newPassword });
      setMessage('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 560 }}>
      <div className="page-title">Profile</div>
      <div className="page-subtitle" style={{ marginBottom: 24 }}>Your account and organization details.</div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="summary-row">
          <span className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <User size={14} style={{ color: 'var(--text-muted)' }} /> Name
          </span>
          <span className="value" style={{ fontWeight: 600 }}>{user?.name}</span>
        </div>

        <div className="summary-row">
          <span className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Mail size={14} style={{ color: 'var(--text-muted)' }} /> Email Address
          </span>
          <span className="value">{user?.email}</span>
        </div>

        <div className="summary-row">
          <span className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Building2 size={14} style={{ color: '#3b82f6' }} /> Department
          </span>
          <span className="value">
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: 'rgba(59, 130, 246, 0.1)',
                color: '#3b82f6',
                padding: '3px 10px',
                borderRadius: 6,
                fontSize: '0.82rem',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                fontWeight: 600,
              }}
            >
              <Building2 size={12} /> {user?.dept || 'Engineering'}
            </span>
          </span>
        </div>

        <div className="summary-row">
          <span className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Briefcase size={14} style={{ color: 'var(--primary)' }} /> Job Title
          </span>
          <span className="value">
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: 'var(--bg-secondary)',
                padding: '3px 10px',
                borderRadius: 6,
                fontSize: '0.82rem',
                border: '1px solid var(--border)',
                fontWeight: 600,
              }}
            >
              <Briefcase size={12} style={{ color: 'var(--primary)' }} /> {user?.title || 'Employee'}
            </span>
          </span>
        </div>

        <div className="summary-row">
          <span className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Shield size={14} style={{ color: 'var(--text-muted)' }} /> System Access
          </span>
          <span className="value" style={{ textTransform: 'capitalize' }}>
            {user?.role === 'admin' ? 'Administrator (Full Access)' : 'Standard User'}
          </span>
        </div>
      </div>

      <div className="card mt-24">
        <div className="section-title" style={{ marginBottom: 18 }}>Change Password</div>
        {message && <div className="badge badge-success" style={{ marginBottom: 16 }}>✓ {message}</div>}
        {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}
        <form onSubmit={submit}>
          <div className="field">
            <label>Current Password</label>
            <input type="password" className="input" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
          </div>
          <div className="field">
            <label>New Password</label>
            <input type="password" className="input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
