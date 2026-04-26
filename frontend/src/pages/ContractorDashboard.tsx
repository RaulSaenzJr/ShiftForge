import { useState, useEffect, FC } from 'react';
import { Event, Application } from '../types';
import { eventService } from '../services/event.service';
import { applicationService } from '../services/application.service';
import { format } from 'date-fns';
import { CalendarView } from '../components/CalendarView';
import { formatTime12Hour } from '../utils/timeFormat';
import '../styles/Contractor.css';

export const ContractorDashboard: FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (): Promise<void> => {
    try {
      setLoading(true);
      const [eventsData, applicationsData] = await Promise.all([
        eventService.getEvents(),
        applicationService.getApplications()
      ]);
      setEvents(eventsData);
      setApplications(applicationsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (eventId: string, role: string): Promise<void> => {
    try {
      await applicationService.applyForShift(eventId, role);
      alert('Application submitted successfully!');
      loadData();
      setSelectedEvent(null);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to apply');
    }
  };

  const hasApplied = (eventId: string, role: string): boolean => {
    return applications.some(
      app => app.event._id === eventId && app.role === role
    );
  };

  const getApplicationStatus = (eventId: string, role: string): string | undefined => {
    const app = applications.find(
      a => a.event._id === eventId && a.role === role
    );
    return app?.status;
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="contractor-dashboard">
      <div className="dashboard-header">
        <h1>Available Shifts</h1>
      </div>

      <div className="calendar-card">
        <h2>Calendar</h2>
        <CalendarView />
      </div>

        <div className="my-applications">
        <h2>My Applications</h2>
        {applications.length === 0 ? (
          <p>No applications yet</p>
        ) : (
          <div className="applications-grid">
            {applications.map((app: Application) => (
              <div key={app._id} className={`application-card status-${app.status}`}>
                <h3>{app.event.title}</h3>
                <p className="app-date">
                  {format(new Date(app.event.date), 'MMM d, yyyy')} at {formatTime12Hour(app.event.startTime)}
                </p>
                <p className="app-role">{app.role}</p>
                <span className={`status-badge ${app.status}`}>
                  {app.status.toUpperCase()}
                </span>
                {app.notes && <p className="app-notes">{app.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="available-events">
        <h2>Available Events</h2>
        <div className="events-grid">
          {events.map((event: Event) => (
            <div
              key={event._id}
              className="event-card"
              onClick={() => setSelectedEvent(event)}
            >
              <h3>{event.title}</h3>
              <p className="event-date">
                {format(new Date(event.date), 'EEEE, MMMM d, yyyy')}
              </p>
              <p className="event-time">
                {formatTime12Hour(event.startTime)} - {formatTime12Hour(event.endTime)}
              </p>
              <p className="event-location">{event.location}</p>
              <div className="shifts-preview">
                {event.shifts.map((shift: any, idx: number) => (
                  <span key={idx} className="shift-tag">
                    {shift.role}: ${shift.payRate}/hr
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedEvent && (
        <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="modal-content event-detail-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedEvent(null)}>×</button>
            
            <h2>{selectedEvent.title}</h2>
            <div className="event-detail-info">
              <p><strong>Date:</strong> {format(new Date(selectedEvent.date), 'EEEE, MMMM d, yyyy')}</p>
              <p><strong>Time:</strong> {formatTime12Hour(selectedEvent.startTime)} - {formatTime12Hour(selectedEvent.endTime)}</p>
              <p><strong>Location:</strong> {selectedEvent.location}</p>
              <p><strong>Description:</strong> {selectedEvent.description}</p>
            </div>

            <h3>Available Positions</h3>
            <div className="shifts-apply">
              {selectedEvent.shifts.map((shift: any, idx: number) => {
                const applied = hasApplied(selectedEvent._id, shift.role);
                const status = getApplicationStatus(selectedEvent._id, shift.role);
                const isFull = shift.filled >= shift.count;

                return (
                  <div key={idx} className="shift-apply-item">
                    <div className="shift-apply-info">
                      <h4>{shift.role}</h4>
                      <p className="shift-pay">${shift.payRate}/hour</p>
                      <p className="shift-availability">
                        {shift.filled}/{shift.count} positions filled
                      </p>
                    </div>
                    <div className="shift-apply-action">
                      {applied ? (
                        <span className={`status-badge ${status}`}>
                          {status?.toUpperCase()}
                        </span>
                      ) : isFull ? (
                        <span className="status-badge full">FULL</span>
                      ) : (
                        <button
                          className="btn-apply"
                          onClick={() => handleApply(selectedEvent._id, shift.role)}
                        >
                          Apply for this position
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
