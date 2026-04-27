import { useState, useEffect, FC } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/auth.service';
import { loadStaffRoles } from '../utils/staffRoles';
import '../styles/Auth.css';

export const Profile: FC = () => {
  const { user } = useAuth();
  const [staffRoles, setStaffRoles] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    availableRoles: user?.availableRoles || []
  });

  useEffect(() => {
    setStaffRoles(loadStaffRoles());
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleToggle = (role: string) => {
    setFormData(prev => ({
      ...prev,
      availableRoles: prev.availableRoles.includes(role)
        ? prev.availableRoles.filter(r => r !== role)
        : [...prev.availableRoles, role]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaved(false);
    try {
      await authService.updateProfile(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save profile');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>My Profile</h1>
        <p className="auth-subtitle">{user?.email}</p>

        {saved && <div className="success-message">Profile saved successfully</div>}
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          {user?.role === 'contractor' && (
            <div className="form-group">
              <label>Available Roles (select all that apply)</label>
              <div className="role-checkboxes">
                {staffRoles.map(role => {
                  const roleId = `role-${role.replace(/\s+/g, '-').toLowerCase()}`;
                  return (
                    <label key={role} className="checkbox-label" htmlFor={roleId}>
                      <input
                        type="checkbox"
                        id={roleId}
                        checked={formData.availableRoles.includes(role)}
                        onChange={() => handleRoleToggle(role)}
                      />
                      {role}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <button type="submit" className="btn-primary">Save Profile</button>
        </form>
      </div>
    </div>
  );
};
