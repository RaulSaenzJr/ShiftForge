import { useState, FC, useEffect } from 'react';
import { eventService } from '../services/event.service';
import { loadStaffRoles, getDefaultStaffRoles, saveStaffRoles, resetStaffRoles } from '../utils/staffRoles';
import '../styles/EventForm.css';

interface ShiftInput {
  role: string;
  count: number;
  payRate: number;
}

interface FormData {
  title: string;
  clientName: string;
  clientEmail: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
}

interface EventFormProps {
  onSuccess: () => void;
}

export const EventForm: FC<EventFormProps> = ({ onSuccess }: EventFormProps) => {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    clientName: '',
    clientEmail: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    location: ''
  });
  const [staffRoles, setStaffRoles] = useState<string[]>(getDefaultStaffRoles());
  const [newRole, setNewRole] = useState('');

  const [shifts, setShifts] = useState<ShiftInput[]>([]);
  const [currentShift, setCurrentShift] = useState<ShiftInput>({
    role: '',
    count: 1,
    payRate: 15
  });
  const [error, setError] = useState('');

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleShiftChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value, type } = e.target;
    const numValue = type === 'number' ? parseFloat(value) : value;
    setCurrentShift(prev => ({
      ...prev,
      [name]: numValue
    }));
  };

  const addShift = (): void => {
    if (!currentShift.role) {
      alert('Please select a role');
      return;
    }
    
    if (shifts.some((s: ShiftInput) => s.role === currentShift.role)) {
      alert('This role has already been added');
      return;
    }

    setShifts(prev => [...prev, { ...currentShift }]);
    setCurrentShift({ role: '', count: 1, payRate: 15 });
  };

  useEffect(() => {
    setStaffRoles(loadStaffRoles());
  }, []);

  const removeShift = (index: number): void => {
    setShifts(prev => prev.filter((_, i) => i !== index));
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
  };

  const resetRoles = (): void => {
    resetStaffRoles();
    const defaults = getDefaultStaffRoles();
    setStaffRoles(defaults);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');

    if (shifts.length === 0) {
      setError('Please add at least one shift');
      return;
    }

    try {
      await eventService.createEvent({
        ...formData,
        shifts: shifts.map(s => ({ ...s, filled: 0 }))
      });
      alert('Event created successfully!');
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create event');
    }
  };

  return (
    <div className="event-form-container">
      <h2>Create New Event</h2>
      
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="event-form">
        <div className="form-group">
          <label>Event Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleFormChange}
            required
            aria-label="Event title"
          />
        </div>

        <div className="form-group">
          <label>Client Name</label>
          <input
            type="text"
            name="clientName"
            value={formData.clientName}
            onChange={handleFormChange}
            required
            aria-label="Client name"
          />
        </div>

        <div className="form-group">
          <label>Client Email</label>
          <input
            type="email"
            name="clientEmail"
            value={formData.clientEmail}
            onChange={handleFormChange}
            required
            aria-label="Client email"
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleFormChange}
            rows={4}
            required
            aria-label="Event description"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleFormChange}
              required
              aria-label="Event date"
            />
          </div>
          <div className="form-group">
            <label>Start Time</label>
            <input
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleFormChange}
              required
              aria-label="Start time"
            />
          </div>
          <div className="form-group">
            <label>End Time</label>
            <input
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleFormChange}
              required
              aria-label="End time"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Location</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleFormChange}
            required
            aria-label="Event location"
          />
        </div>

        <div className="roles-management-section">
          <h3>Manage Roles</h3>
          <div className="role-manager">
            <div className="role-input-row">
              <input
                type="text"
                value={newRole}
                onChange={e => setNewRole(e.target.value)}
                placeholder="Add a new role (e.g., Housekeeper)"
                aria-label="New role name"
              />
              <button type="button" onClick={addRole} className="btn-add-role">+ Add Role</button>
              <button type="button" onClick={resetRoles} className="btn-reset-roles">Reset Defaults</button>
            </div>
            <div className="current-roles-list">
              {staffRoles.map(role => (
                <span key={role} className="role-tag">
                  {role}
                  <button
                    type="button"
                    className="role-tag-remove"
                    onClick={() => removeRole(role)}
                    aria-label={`Remove role ${role}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="shifts-section">
          <h3>Staff Requirements</h3>
          
          <div className="shift-builder">
            <div className="form-row">
              <div className="form-group">
                <label>Role</label>
                <select
                  name="role"
                  value={currentShift.role}
                  onChange={handleShiftChange}
                  aria-label="Staff role"
                >
                  <option value="">Select a role</option>
                  {staffRoles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Number Needed</label>
                <input
                  type="number"
                  name="count"
                  value={currentShift.count}
                  onChange={handleShiftChange}
                  min="1"
                  aria-label="Number of staff needed"
                />
              </div>
              <div className="form-group">
                <label>Pay Rate ($/hr)</label>
                <input
                  type="number"
                  name="payRate"
                  value={currentShift.payRate}
                  onChange={handleShiftChange}
                  min="0"
                  step="0.01"
                  aria-label="Pay rate per hour"
                />
              </div>
              <button type="button" onClick={addShift} className="btn-add-shift">
                Add Shift
              </button>
            </div>
          </div>

          {shifts.length > 0 && (
            <div className="added-shifts">
              <h4>Added Shifts:</h4>
              {shifts.map((shift, index) => (
                <div key={index} className="shift-item">
                  <span className="shift-details">
                    <strong>{shift.role}</strong> - {shift.count} needed - ${shift.payRate}/hr
                  </span>
                  <button
                    type="button"
                    onClick={() => removeShift(index)}
                    className="btn-remove"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button type="submit" className="btn-submit">
          Create Event
        </button>
      </form>
    </div>
  );
};
