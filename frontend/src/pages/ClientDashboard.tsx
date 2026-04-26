import { useEffect, useState } from 'react';
import { eventService } from '../services/event.service';
import { Event } from '../types';
import { format } from 'date-fns';
import { formatTime12Hour } from '../utils/timeFormat';
import '../styles/Applications.css';

export const ClientDashboard = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await eventService.getMyEvents();
        setEvents(data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load your events');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="loading">Loading your events...</div>;
  if (error) return <div className="error-message">{error}</div>;

  if (events.length === 0) {
    return <div className="applications-list"><p>No events found for your account.</p></div>;
  }

  return (
    <div className="applications-list">
      <h2>Your Events</h2>
      {events.map(event => (
        <div key={event._id} className="application-card">
          <div className="application-header">
            <div>
              <h3>{event.title}</h3>
              <p className="application-meta">
                {format(new Date(event.date), 'PPP')} · {formatTime12Hour(event.startTime)} - {formatTime12Hour(event.endTime)} · {event.location}
              </p>
            </div>
            <span className={`status-badge ${event.status}`}>{event.status}</span>
          </div>
          <p className="application-description">{event.description}</p>
          <div className="application-meta">
            Created by: {event.createdBy?.firstName} {event.createdBy?.lastName}
          </div>
          <div className="application-roles">
            <strong>Staffing Needs:</strong>
            <ul>
              {event.shifts.map(shift => (
                <li key={shift.role}>
                  {shift.role}: {shift.filled}/{shift.count} filled (${shift.payRate}/hr)
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
};
