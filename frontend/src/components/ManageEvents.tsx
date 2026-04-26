import { useEffect, useState, type ChangeEvent } from 'react';
import { eventService } from '../services/event.service';
import { Event, Shift } from '../types';
import { format } from 'date-fns';
import '../styles/EventForm.css';
import '../styles/Applications.css';

interface ShiftInput {
  role: string;
  count: number;
  payRate: number;
  filled?: number;
}

interface ContactInput {
  name: string;
  email: string;
  role: string;
  phone: string;
}

interface FormState {
  title: string;
  clientName: string;
  clientEmail: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  status: Event['status'];
}

export const ManageEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selected, setSelected] = useState<Event | null>(null);
  const [shifts, setShifts] = useState<ShiftInput[]>([]);
  const [contacts, setContacts] = useState<ContactInput[]>([]);
  const [currentShift, setCurrentShift] = useState<ShiftInput>({ role: '', count: 1, payRate: 15, filled: 0 });
  const [currentContact, setCurrentContact] = useState<ContactInput>({ name: '', email: '', role: '', phone: '' });
  const [formData, setFormData] = useState<FormState>({
    title: '',
    clientName: '',
    clientEmail: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    status: 'published'
  });
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const load = async () => {
    try {
      setLoading(true);
      const data = await eventService.getEvents();
      setEvents(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const pickEvent = (event: Event) => {
    setSelected(event);
    setFormData({
      title: event.title,
      clientName: event.clientName || event.client?.firstName || '',
      clientEmail: event.clientEmail || event.client?.email || '',
      description: event.description,
      date: event.date.slice(0, 10),
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      status: event.status
    });
    setShifts(event.shifts.map((s: Shift) => ({
      role: s.role,
      count: s.count,
      payRate: s.payRate,
      filled: s.filled
    })));
    const contactsData = (event.clientContacts || []).map((c: Partial<ContactInput>) => ({
      name: c.name || '',
      email: c.email || '',
      role: c.role || '',
      phone: c.phone || ''
    }));
    setContacts(contactsData);
    setMessage('');
    setError('');
  };

  const handleFormChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const nextValue = name === 'status' ? value as Event['status'] : value;
    setFormData(prev => ({ ...prev, [name]: nextValue } as FormState));
  };

  const handleShiftChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const numValue = type === 'number' ? parseFloat(value) : value;
    setCurrentShift(prev => ({ ...prev, [name]: numValue }));
  };

  const addShift = () => {
    if (!currentShift.role) return alert('Select a role');
    if (shifts.some(s => s.role === currentShift.role)) return alert('Role already added');
    setShifts(prev => [...prev, { ...currentShift, filled: currentShift.filled ?? 0 }]);
    setCurrentShift({ role: '', count: 1, payRate: 15, filled: 0 });
  };

  const removeShift = (idx: number) => setShifts(prev => prev.filter((_, i) => i !== idx));

  const handleContactChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentContact(prev => ({ ...prev, [name]: value }));
  };

  const addContact = () => {
    if (!currentContact.name) return alert('Contact name required');
    setContacts(prev => [...prev, currentContact]);
    setCurrentContact({ name: '', email: '', role: '', phone: '' });
  };

  const removeContact = (idx: number) => setContacts(prev => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (!selected) return;
    if (shifts.length === 0) return setError('Add at least one shift');
    try {
      setError('');
      const payload: Partial<Event> = {
        ...formData,
        status: formData.status,
        shifts: shifts.map(s => ({
          role: s.role,
          count: s.count,
          payRate: s.payRate,
          filled: s.filled ?? 0
        } as Shift)),
        clientContacts: contacts.filter(c => c.name || c.email || c.role || c.phone)
      };
      const updated = await eventService.updateEvent(selected._id, payload);
      setMessage('Event updated successfully');
      setSelected(updated);
      setTimeout(() => setMessage(''), 4000);
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update event');
    }
  };

  if (loading) return <div className="loading">Loading events...</div>;

  return (
    <div className="event-form-container">
      <h2>Manage Events</h2>
      {message && <div className="form-message success">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="applications-list manage-events-list">
        <div className="applications-header">
          <h3>Events</h3>
        </div>
        {events.length === 0 ? (
          <p>No events yet.</p>
        ) : (
          events.map(evt => (
            <div key={evt._id} className={`application-card ${selected?._id === evt._id ? 'selected' : ''}`}>
              <div className="application-header">
                <div>
                  <h4>{evt.title}</h4>
                  <p className="application-meta">{format(new Date(evt.date), 'PPP')} · {evt.location}</p>
                </div>
                <button className="btn-assign" onClick={() => pickEvent(evt)}>Edit</button>
              </div>
              <p className="application-description">{evt.description}</p>
            </div>
          ))
        )}
      </div>

      {selected && (
        <div className="event-form">
          <div className="form-group">
            <label htmlFor="event-title">Event Title</label>
            <input id="event-title" name="title" value={formData.title} onChange={handleFormChange} />
          </div>

          <div className="form-group">
            <label htmlFor="client-name">Client Name</label>
            <input id="client-name" name="clientName" value={formData.clientName} onChange={handleFormChange} />
          </div>

          <div className="form-group">
            <label htmlFor="client-email">Client Email</label>
            <input id="client-email" name="clientEmail" type="email" value={formData.clientEmail} onChange={handleFormChange} />
          </div>

          <div className="form-group">
            <label htmlFor="event-description">Description</label>
            <textarea id="event-description" name="description" rows={3} value={formData.description} onChange={handleFormChange} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="event-date">Date</label>
              <input id="event-date" type="date" name="date" value={formData.date} onChange={handleFormChange} />
            </div>
            <div className="form-group">
              <label htmlFor="event-start">Start Time</label>
              <input id="event-start" type="time" name="startTime" value={formData.startTime} onChange={handleFormChange} />
            </div>
            <div className="form-group">
              <label htmlFor="event-end">End Time</label>
              <input id="event-end" type="time" name="endTime" value={formData.endTime} onChange={handleFormChange} />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="event-location">Location</label>
            <input id="event-location" name="location" value={formData.location} onChange={handleFormChange} />
          </div>

          <div className="form-group">
            <label htmlFor="event-status">Status</label>
            <select id="event-status" name="status" value={formData.status} onChange={handleFormChange} aria-label="Event status">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="shifts-section">
            <h3>Staff Requirements</h3>
            <div className="shift-builder">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="shift-role">Role</label>
                  <input id="shift-role" name="role" value={currentShift.role} onChange={handleShiftChange} />
                </div>
                <div className="form-group">
                  <label htmlFor="shift-count">Number Needed</label>
                  <input id="shift-count" type="number" name="count" value={currentShift.count} onChange={handleShiftChange} min={1} />
                </div>
                <div className="form-group">
                  <label htmlFor="shift-rate">Pay Rate ($/hr)</label>
                  <input id="shift-rate" type="number" name="payRate" value={currentShift.payRate} onChange={handleShiftChange} min={0} step={0.01} />
                </div>
                <div className="form-group">
                  <label htmlFor="shift-filled">Currently Filled</label>
                  <input id="shift-filled" type="number" name="filled" value={currentShift.filled} onChange={handleShiftChange} min={0} />
                </div>
              </div>
              <button type="button" className="btn-add" onClick={addShift}>+ Add Role</button>
            </div>

            <div className="shift-list">
              {shifts.map((shift, idx) => (
                <div key={shift.role} className="shift-item">
                  <div>
                    <strong>{shift.role}</strong> — {shift.count} needed @ ${shift.payRate}/hr (filled: {shift.filled ?? 0})
                  </div>
                  <button type="button" className="btn-delete" onClick={() => removeShift(idx)}>Remove</button>
                </div>
              ))}
            </div>
          </div>

          <div className="shifts-section">
            <h3>Client Contacts (coordinator, caterer, etc.)</h3>
            <div className="shift-builder">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="contact-name">Name</label>
                  <input id="contact-name" name="name" value={currentContact.name} onChange={handleContactChange} />
                </div>
                <div className="form-group">
                  <label htmlFor="contact-email">Email</label>
                  <input id="contact-email" name="email" value={currentContact.email} onChange={handleContactChange} />
                </div>
                <div className="form-group">
                  <label htmlFor="contact-role">Role</label>
                  <input id="contact-role" name="role" value={currentContact.role} onChange={handleContactChange} />
                </div>
                <div className="form-group">
                  <label htmlFor="contact-phone">Phone</label>
                  <input id="contact-phone" name="phone" value={currentContact.phone} onChange={handleContactChange} />
                </div>
              </div>
              <button type="button" className="btn-add" onClick={addContact}>+ Add Contact</button>
            </div>

            <div className="shift-list">
              {contacts.map((c, idx) => (
                <div key={`${c.name}-${idx}`} className="shift-item">
                  <div>
                    <strong>{c.name}</strong> {c.role ? `(${c.role})` : ''} — {c.email || 'no email'} {c.phone ? `· ${c.phone}` : ''}
                  </div>
                  <button type="button" className="btn-delete" onClick={() => removeContact(idx)}>Remove</button>
                </div>
              ))}
            </div>
          </div>

          <button type="button" className="btn-submit" onClick={handleSave}>Save Changes</button>
        </div>
      )}
    </div>
  );
};
