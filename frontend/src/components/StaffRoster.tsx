import { useState, useEffect, FC } from 'react';
import { authService } from '../services/auth.service';
import { format } from 'date-fns';
import { loadStaffRoles, saveStaffRoles, resetStaffRoles, getDefaultStaffRoles } from '../utils/staffRoles';
import '../styles/StaffRoster.css';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'admin' | 'contractor';
  availableRoles: string[];
  createdAt: string;
}

interface CreateUserForm {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'contractor';
  phone: string;
  availableRoles: string[];
}

export const StaffRoster: FC = () => {
  const [staff, setStaff] = useState<User[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [staffRoles, setStaffRoles] = useState<string[]>(getDefaultStaffRoles());
  const [newRole, setNewRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formMessage, setFormMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [formData, setFormData] = useState<CreateUserForm>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'contractor',
    phone: '',
    availableRoles: []
  });

  useEffect(() => {
    loadStaff();
    setStaffRoles(loadStaffRoles());
  }, []);

  useEffect(() => {
    filterStaff();
  }, [searchTerm, roleFilter, staff]);

  const loadStaff = async (): Promise<void> => {
    try {
      setLoading(true);
      const data = await authService.getStaff();
      const onlyStaff = data.filter((u: any) => u.role === 'admin' || u.role === 'contractor');
      setStaff(onlyStaff);
      setFilteredStaff(onlyStaff);
    } catch (error) {
      console.error('Failed to load staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterStaff = (): void => {
    let filtered = staff;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((u: User) =>
        u.firstName.toLowerCase().includes(term) ||
        u.lastName.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter((u: User) => u.role === roleFilter);
    }

    setFilteredStaff(filtered);
  };

  const addRole = (): void => {
    const role = newRole.trim();
    if (!role) return;
    setStaffRoles(prev => {
      if (prev.includes(role)) return prev;
      const next = [...prev, role];
      saveStaffRoles(next);
      return next;
    });
    setNewRole('');
  };

  const removeRole = (role: string): void => {
    setStaffRoles(prev => {
      const next = prev.filter(r => r !== role);
      saveStaffRoles(next);
      return next;
    });
    setFormData(prev => ({
      ...prev,
      availableRoles: prev.availableRoles.filter(r => r !== role)
    }));
  };

  const resetRoles = (): void => {
    resetStaffRoles();
    const defaults = getDefaultStaffRoles();
    setStaffRoles(defaults);
    setFormData(prev => ({
      ...prev,
      availableRoles: prev.availableRoles.filter(r => defaults.includes(r))
    }));
  };

  const handleRoleToggle = (role: string): void => {
    setFormData((prev: CreateUserForm) => ({
      ...prev,
      availableRoles: prev.availableRoles.includes(role)
        ? prev.availableRoles.filter((r: string) => r !== role)
        : [...prev.availableRoles, role]
    }));
  };

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setFormMessage(null);
    setFormLoading(true);

    try {
      await authService.createUser(formData);
      setFormMessage({
        text: `${formData.firstName} ${formData.lastName} created successfully!`,
        type: 'success'
      });

      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'contractor',
        phone: '',
        availableRoles: []
      });

      setTimeout(() => {
        loadStaff();
        setShowCreateForm(false);
      }, 1500);
    } catch (error: any) {
      setFormMessage({
        text: error.response?.data?.message || 'Failed to create user',
        type: 'error'
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setFormData((prev: CreateUserForm) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDeleteUser = async (userId: string, userName: string): Promise<void> => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${userName}?\n\nThis action cannot be undone. All associated data will be permanently removed.`
    );

    if (!confirmed) return;

    try {
      await authService.deleteUser(userId);
      setActionMessage({
        text: `${userName} has been deleted successfully`,
        type: 'success'
      });
      loadStaff();
      setTimeout(() => setActionMessage(null), 5000);
    } catch (error: any) {
      setActionMessage({
        text: error.response?.data?.message || 'Failed to delete user',
        type: 'error'
      });
      setTimeout(() => setActionMessage(null), 5000);
    }
  };

  const handleResetPassword = async (userId: string, userName: string, userEmail: string): Promise<void> => {
    const confirmed = window.confirm(
      `Reset password for ${userName}?\n\nA temporary password will be generated. Make sure to save it and provide it to the user.`
    );

    if (!confirmed) return;

    try {
      const response = await authService.resetPassword(userId);
      const tempPassword = response.tempPassword;
      
      setActionMessage({
        text: `Password reset successfully for ${userName}`,
        type: 'info'
      });

      // Show temporary password in a more prominent way
      alert(
        `Password Reset Successful!\n\n` +
        `User: ${userName} (${userEmail})\n` +
        `Temporary Password: ${tempPassword}\n\n` +
        `IMPORTANT: Save this password now! The user should change it after logging in.`
      );

      setTimeout(() => setActionMessage(null), 5000);
    } catch (error: any) {
      setActionMessage({
        text: error.response?.data?.message || 'Failed to reset password',
        type: 'error'
      });
      setTimeout(() => setActionMessage(null), 5000);
    }
  };

  if (loading) {
    return <div className="loading">Loading staff directory...</div>;
  }

  const admins = staff.filter((u: User) => u.role === 'admin');
  const contractors = staff.filter((u: User) => u.role === 'contractor');

  return (
    <div className="staff-roster">
      <div className="roster-header">
        <div>
          <h2>Staff Directory</h2>
          <p className="roster-stats">
            {admins.length} admins, {contractors.length} contractors ({filteredStaff.length} shown)
          </p>
        </div>
        <button
          className="btn-add-staff"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? '✕ Close' : '+ Add Staff'}
        </button>
      </div>

      {actionMessage && (
        <div className={`action-message ${actionMessage.type}`}>
          {actionMessage.text}
        </div>
      )}

      {showCreateForm && (
        <div className="create-user-form-container">
          <form onSubmit={handleCreateUser} className="create-user-form">
            <h3>Create New User</h3>

            {formMessage && (
              <div className={`form-message ${formMessage.type}`}>
                {formMessage.text}
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name *</label>
                <input
                  id="firstName"
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last Name *</label>
                <input
                  id="lastName"
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleFormChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleFormChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleFormChange}
                minLength={6}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input
                id="phone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleFormChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="role">Role *</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleFormChange}
              >
                <option value="contractor">Contractor</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {formData.role === 'contractor' && (
              <div className="form-group">
                <label>Available Roles (select all that apply)</label>
                <div className="role-checkboxes">
                  {staffRoles.map((role: string) => (
                    <label key={role} className="checkbox-label" htmlFor={`role-${role}`}>
                      <input
                        type="checkbox"
                        id={`role-${role}`}
                        checked={formData.availableRoles.includes(role)}
                        onChange={() => handleRoleToggle(role)}
                      />
                      {role}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="form-group roles-editor">
              <label htmlFor="new-role">Manage Roles</label>
              <div className="roles-editor-row">
                <input
                  id="new-role"
                  type="text"
                  value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                  placeholder="Add a new role (e.g., Poker Dealer)"
                />
                <button type="button" onClick={addRole} className="btn-add-role">+ Add</button>
                <button type="button" onClick={resetRoles} className="btn-reset-role">Reset Defaults</button>
              </div>
              <div className="current-roles">
                {staffRoles.map(role => (
                  <span key={role} className="role-pill">
                    {role}
                    <button
                      type="button"
                      className="pill-remove"
                      onClick={() => removeRole(role)}
                      aria-label={`Remove role ${role}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="btn-submit"
              disabled={formLoading}
            >
              {formLoading ? 'Creating...' : 'Create User'}
            </button>
          </form>
        </div>
      )}

      <div className="roster-filters">
        <input
          type="text"
          className="search-input"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          aria-label="Search staff by name or email"
        />

        <label htmlFor="roleFilter" className="sr-only">Filter by Role</label>
        <select
          id="roleFilter"
          className="role-filter"
          value={roleFilter}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRoleFilter(e.target.value)}
          aria-label="Filter staff by role"
        >
          <option value="all">All Users</option>
          <option value="admin">Admins</option>
          <option value="contractor">Contractors</option>
        </select>
      </div>

      {filteredStaff.length === 0 ? (
        <p className="no-results">No staff found</p>
      ) : (
        <div className="staff-grid">
          {filteredStaff.map((user: User) => (
            <div key={user._id} className={`staff-card ${user.role}`}>
              <div className="staff-badge">{user.role}</div>
              <div className="staff-header">
                <div className="staff-avatar">
                  {user.firstName[0]}{user.lastName[0]}
                </div>
                <div className="staff-info">
                  <h3>{user.firstName} {user.lastName}</h3>
                  <p className="staff-email">{user.email}</p>
                  {user.phone && (
                    <p className="staff-phone">{user.phone}</p>
                  )}
                </div>
              </div>

              {user.role === 'contractor' && user.availableRoles.length > 0 && (
                <div className="staff-roles">
                  <strong>Roles:</strong>
                  <div className="role-tags">
                    {user.availableRoles.map((role: string, idx: number) => (
                      <span key={idx} className="role-tag">{role}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="staff-meta">
                <span className="join-date">
                  Joined {format(new Date(user.createdAt), 'MMM yyyy')}
                </span>
              </div>

              <div className="staff-actions">
                <button
                  className="btn-reset-password"
                  onClick={() => handleResetPassword(user._id, `${user.firstName} ${user.lastName}`, user.email)}
                  title="Reset password"
                >
                  🔑 Reset Password
                </button>
                <button
                  className="btn-delete-user"
                  onClick={() => handleDeleteUser(user._id, `${user.firstName} ${user.lastName}`)}
                  title="Delete user"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
