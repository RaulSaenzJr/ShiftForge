import { useState, FC, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { loadStaffRoles, getDefaultStaffRoles } from '../utils/staffRoles';
import '../styles/Auth.css';

interface LoginFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  availableRoles: string[];
  adminCode?: string;
}

export const Login: FC = () => {
  const navigate = useNavigate();
  const { login, register: registerUser } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [showAdminCode, setShowAdminCode] = useState(false);
  const [staffRoles, setStaffRoles] = useState<string[]>(getDefaultStaffRoles());
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    availableRoles: [],
    adminCode: ''
  });

  useEffect(() => {
    setStaffRoles(loadStaffRoles());
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');

    try {
      if (isRegister) {
        await registerUser(formData);
      } else {
        await login(formData.email, formData.password);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Authentication failed');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setFormData((prev: LoginFormData) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRoleToggle = (role: string): void => {
    setFormData((prev: LoginFormData) => ({
      ...prev,
      availableRoles: prev.availableRoles.includes(role)
        ? prev.availableRoles.filter((r: string) => r !== role)
        : [...prev.availableRoles, role]
    }));
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>{isRegister ? 'Create Account' : 'Welcome Back'}</h1>
        <p className="auth-subtitle">
          {isRegister ? 'Sign up to get started' : 'Sign in to continue'}
        </p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <>
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

              <div className="form-group">
                <label>Available Roles (select all that apply)</label>
                <div className="role-checkboxes">
                  {staffRoles.map((role: string) => {
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

              <div className="form-group">
                <button
                  type="button"
                  onClick={() => setShowAdminCode(!showAdminCode)}
                  className="link-button"
                >
                  {showAdminCode ? '✕ Hide' : '+ Admin Access'}
                </button>
              </div>

              {showAdminCode && (
                <div className="form-group admin-code-field">
                  <label htmlFor="adminCode">Admin Code</label>
                  <input
                    type="password"
                    id="adminCode"
                    name="adminCode"
                    value={formData.adminCode || ''}
                    onChange={handleChange}
                    placeholder="Enter admin code if you have one"
                  />
                  <small>Contact your administrator for an admin code</small>
                </div>
              )}
            </>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>

          <button type="submit" className="btn-primary">
            {isRegister ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div className="auth-switch">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button onClick={() => setIsRegister(!isRegister)} className="link-button">
            {isRegister ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
};
