import { useEffect, useState } from 'react';
import { Edit2, Check, X, Briefcase, Building2, UserPlus, Trash2, Eye, EyeOff } from 'lucide-react';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import ErrorAlert from '../../components/ErrorAlert.jsx';
import Badge from '../../components/Badge.jsx';

const TITLE_SUGGESTIONS = [
  'Business Head',
  'CEO',
  'Tech Lead',
  'Product Manager',
  'Software Engineer',
  'Cybersecurity Analyst',
  'Marketing Director',
  'Data Scientist',
  'Employee',
];

const DEPT_SUGGESTIONS = [
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

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Editing state
  const [editingUserId, setEditingUserId] = useState(null);
  const [editTitleValue, setEditTitleValue] = useState('');
  const [editDeptValue, setEditDeptValue] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  // Create user modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: 'Password123!',
    title: 'Business Head',
    dept: 'Engineering',
    role: 'user',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [createError, setCreateError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    api
      .get('/users')
      .then(({ data }) => setUsers(Array.isArray(data?.users) ? data.users : []))
      .catch(() => setError('Could not load users.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (user) => {
    setEditingUserId(user._id);
    setEditTitleValue(user.title || 'Employee');
    setEditDeptValue(user.dept || 'Engineering');
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setEditTitleValue('');
    setEditDeptValue('');
  };

  const saveUserUpdates = async (userId) => {
    setUpdatingId(userId);
    try {
      const { data } = await api.patch(`/users/${userId}`, {
        title: editTitleValue.trim() || 'Employee',
        dept: editDeptValue.trim() || 'Engineering',
      });
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId
            ? {
                ...u,
                title: data.user?.title || editTitleValue.trim(),
                dept: data.user?.dept || editDeptValue.trim(),
              }
            : u
        )
      );
      setEditingUserId(null);
      setSuccessMsg('User profile & department updated successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update user.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete user "${userName}"?`)) return;
    try {
      await api.delete(`/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      setSuccessMsg(`User "${userName}" was removed.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete user.');
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      const { data } = await api.post('/users', createForm);
      setUsers((prev) => [data.user, ...prev]);
      setShowCreateModal(false);
      setCreateForm({
        name: '',
        email: '',
        password: 'Password123!',
        title: 'Business Head',
        dept: 'Engineering',
        role: 'user',
      });
      setSuccessMsg(`User "${data.user.name}" (${data.user.dept}) created successfully!`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create user.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div className="page-title">Users, Titles & Departments</div>
          <div className="page-subtitle">
            Manage user accounts, assign job titles and departments. Department isolation ensures users see relevant twins, and titles drive persona calibration.
          </div>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
        >
          <UserPlus size={16} /> Create New User
        </button>
      </div>

      {successMsg && (
        <div className="badge badge-success" style={{ padding: '8px 16px', fontSize: '0.9rem', marginBottom: 16, display: 'inline-block' }}>
          ✓ {successMsg}
        </div>
      )}

      {error && <ErrorAlert message={error} onRetry={load} />}

      {/* Create User Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div className="card" style={{ maxWidth: 520, width: '92%', padding: 24, borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserPlus size={20} style={{ color: 'var(--primary)' }} />
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Provision New User</h3>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setShowCreateModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 18 }}>
              Create an account with a specific Department (for twin visibility) and Job Title (for persona calibration).
            </p>

            {createError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid #ef4444',
                color: '#ef4444',
                padding: '8px 12px',
                borderRadius: 6,
                fontSize: '0.85rem',
                marginBottom: 16
              }}>
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit}>
              <div className="field">
                <label>Full Name</label>
                <input
                  className="input"
                  placeholder="e.g. Rajesh Sharma"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  required
                  autoFocus
                />
              </div>

              <div className="field">
                <label>Email Address</label>
                <input
                  type="email"
                  className="input"
                  placeholder="e.g. businesshead@niit.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  required
                />
              </div>

              <div className="grid-2">
                <div className="field">
                  <label>Department</label>
                  <input
                    className="input"
                    placeholder="e.g. Engineering, Product"
                    value={createForm.dept}
                    onChange={(e) => setCreateForm({ ...createForm, dept: e.target.value })}
                    list="new-user-dept-suggestions"
                    required
                  />
                  <datalist id="new-user-dept-suggestions">
                    {DEPT_SUGGESTIONS.map((d) => (
                      <option key={d} value={d} />
                    ))}
                  </datalist>
                </div>

                <div className="field">
                  <label>Job Title / Role</label>
                  <input
                    className="input"
                    placeholder="e.g. Business Head, CEO"
                    value={createForm.title}
                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                    list="new-user-title-suggestions"
                    required
                  />
                  <datalist id="new-user-title-suggestions">
                    {TITLE_SUGGESTIONS.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="field">
                <label>Initial Password</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    required
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', padding: '4px 8px' }}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="field">
                <label>System Role</label>
                <select
                  className="select"
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                >
                  <option value="user">User (Standard Department Access)</option>
                  <option value="admin">Administrator (Full Access & Approvals)</option>
                </select>
              </div>

              <div style={{ marginTop: 24, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={creating}
                >
                  {creating ? 'Creating Account…' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-12">
          <div className="skeleton" style={{ height: 60 }} />
          <div className="skeleton" style={{ height: 60 }} />
          <div className="skeleton" style={{ height: 60 }} />
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Job Title / Role</th>
                <th>System Role</th>
                <th>Last Login</th>
                <th style={{ width: 140, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isEditing = editingUserId === u._id;
                const isSaving = updatingId === u._id;
                const isSelf = currentUser?._id === u._id;

                return (
                  <tr key={u._id}>
                    <td data-label="Name" style={{ fontWeight: 500 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {u.name}
                        {isSelf && (
                          <span style={{ fontSize: '0.72rem', background: 'var(--primary)', color: '#fff', padding: '1px 6px', borderRadius: 4 }}>
                            You
                          </span>
                        )}
                      </div>
                    </td>
                    <td data-label="Email" style={{ color: 'var(--text-muted)' }}>
                      {u.email}
                    </td>
                    <td data-label="Department">
                      {isEditing ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input
                            className="input"
                            style={{ padding: '4px 8px', fontSize: '0.85rem', width: 130 }}
                            value={editDeptValue}
                            onChange={(e) => setEditDeptValue(e.target.value)}
                            list={`dept-suggestions-${u._id}`}
                          />
                          <datalist id={`dept-suggestions-${u._id}`}>
                            {DEPT_SUGGESTIONS.map((d) => (
                              <option key={d} value={d} />
                            ))}
                          </datalist>
                        </div>
                      ) : (
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
                          <Building2 size={13} />
                          {u.dept || 'Engineering'}
                        </span>
                      )}
                    </td>
                    <td data-label="Job Title">
                      {isEditing ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input
                            className="input"
                            style={{ padding: '4px 8px', fontSize: '0.85rem', width: 140 }}
                            value={editTitleValue}
                            onChange={(e) => setEditTitleValue(e.target.value)}
                            list={`title-suggestions-${u._id}`}
                          />
                          <datalist id={`title-suggestions-${u._id}`}>
                            {TITLE_SUGGESTIONS.map((s) => (
                              <option key={s} value={s} />
                            ))}
                          </datalist>
                          <button
                            className="btn btn-primary btn-sm"
                            style={{ padding: '4px 8px' }}
                            onClick={() => saveUserUpdates(u._id)}
                            disabled={isSaving}
                            title="Save Updates"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '4px 8px' }}
                            onClick={cancelEdit}
                            title="Cancel"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              background: 'var(--bg-secondary)',
                              padding: '3px 10px',
                              borderRadius: 6,
                              fontSize: '0.85rem',
                              border: '1px solid var(--border)',
                              fontWeight: 500,
                            }}
                          >
                            <Briefcase size={13} style={{ color: 'var(--primary)' }} />
                            {u.title || 'Employee'}
                          </span>
                        </div>
                      )}
                    </td>
                    <td data-label="Role">
                      <Badge tone={u.role === 'admin' ? 'accent' : 'neutral'}>{u.role}</Badge>
                    </td>
                    <td data-label="Last login" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : '—'}
                    </td>
                    <td data-label="Actions" style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                        {!isEditing && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                            onClick={() => startEdit(u)}
                            title="Edit Title & Department"
                          >
                            <Edit2 size={13} style={{ marginRight: 4 }} /> Edit
                          </button>
                        )}
                        {!isSelf && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '4px 6px', color: '#ef4444' }}
                            onClick={() => handleDeleteUser(u._id, u.name)}
                            title="Delete User"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
