import React, { useState, useEffect, FC } from 'react';
import Calendar from 'react-calendar';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Event } from '../types';
import { eventService } from '../services/event.service';
import { applicationService } from '../services/application.service';
import { useAuth } from '../contexts/AuthContext';
import { formatTime12Hour } from '../utils/timeFormat';
import 'react-calendar/dist/Calendar.css';
import '../styles/Calendar.css';

export const CalendarView: FC = () => {
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, [date]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const start = format(startOfMonth(date), 'yyyy-MM-dd');
      const end = format(endOfMonth(date), 'yyyy-MM-dd');
      const data = await eventService.getEvents(start, end);
      setEvents(data);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventsForDate = (checkDate: Date) => {
    const dateStr = format(checkDate, 'yyyy-MM-dd');
    return events.filter((event: Event) => 
      format(new Date(event.date), 'yyyy-MM-dd') === dateStr
    );
  };

  const tileContent = ({ date: tileDate, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const dayEvents = getEventsForDate(tileDate);
      if (dayEvents.length > 0) {
        // Show up to 5 events, then "..." if more
        const visibleEvents = dayEvents.slice(0, 5);
        const hasMore = dayEvents.length > 5;
        
        return (
          <div className="event-dots">
            {visibleEvents.map((event: Event) => {
              // Determine event category for styling
              let category = 'corporate';
              if (event.title.includes('Wedding')) category = 'wedding';
              if (event.title.includes('Christmas') || event.title.includes('New Year')) category = 'holiday';
              
              return (
                <div 
                  key={event._id} 
                  className={`event-item-mini ${category}`}
                  title={event.title}
                  onClick={() => handleEventClick(event)}
                >
                  {event.title}
                </div>
              );
            })}
            {hasMore && (
              <span className="more-events" title={`${dayEvents.length - 5} more events`}>
                +{dayEvents.length - 5} more
              </span>
            )}
          </div>
        );
      }
    }
    return null;
  };

  const handleDateClick = (value: Date | Date[]) => {
    const clickedDate = Array.isArray(value) ? value[0] : value;
    setDate(clickedDate);
    const dayEvents = getEventsForDate(clickedDate);
    if (dayEvents.length > 0) {
      setSelectedEvent(dayEvents[0]);
      setShowEventModal(true);
    }
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  return (
    <div className="calendar-container">
      <div className="calendar-section">
        <Calendar
          onChange={(value: any) => handleDateClick(value)}
          value={date}
          tileContent={tileContent}
          tileClassName={({ date: tileDate }: { date: Date }) => {
            const hasEvents = getEventsForDate(tileDate).length > 0;
            return hasEvents ? 'has-events' : '';
          }}
        />
      </div>

      <div className="events-list">
        <h2>Events for {format(date, 'MMMM d, yyyy')}</h2>
        {loading ? (
          <p>Loading events...</p>
        ) : getEventsForDate(date).length === 0 ? (
          <p className="no-events">No events scheduled for this date</p>
        ) : (
          <div className="event-items">
            {getEventsForDate(date).map((event: Event) => (
              <div
                key={event._id}
                className="event-item"
                onClick={() => handleEventClick(event)}
              >
                <h3>{event.title}</h3>
                <p className="event-time">
                  {formatTime12Hour(event.startTime)} - {formatTime12Hour(event.endTime)}
                </p>
                <p className="event-location">{event.location}</p>
                <div className="event-shifts">
                  {event.shifts.map((shift: any, idx: number) => (
                    <span key={idx} className="shift-badge">
                      {shift.role} ({shift.filled}/{shift.count})
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showEventModal && selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={() => {
            setShowEventModal(false);
            setSelectedEvent(null);
          }}
          onUpdate={loadEvents}
        />
      )}
    </div>
  );
};

interface EventModalProps {
  event: Event;
  onClose: () => void;
  onUpdate: () => void;
}

const EventModal: FC<EventModalProps> = ({ event, onClose, onUpdate }: EventModalProps) => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePickupShift = async (role: string) => {
    if (!user) {
      setMessage('You must be logged in to pick up a shift');
      return;
    }

    setLoading(true);
    try {
        await applicationService.applyForShift(event._id, role);
      setMessage(`Successfully applied for ${role} position!`);
      setTimeout(() => {
        onUpdate();
        onClose();
      }, 1000);
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to pick up shift');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <h2>{event.title}</h2>
        <div className="event-details">
          <p><strong>Date:</strong> {format(new Date(event.date), 'MMMM d, yyyy')}</p>
          <p><strong>Time:</strong> {formatTime12Hour(event.startTime)} - {formatTime12Hour(event.endTime)}</p>
          <p><strong>Location:</strong> {event.location}</p>
          <p><strong>Description:</strong> {event.description}</p>
          
          {message && (
            <div className={message.includes('Successfully') ? 'success-message' : 'error-message'}>
              {message}
            </div>
          )}
          
          <h3>Required Staff</h3>
          <div className="shifts-list">
            {event.shifts.map((shift: any, idx: number) => (
              <div key={idx} className="shift-detail">
                <div className="shift-info">
                  <strong>{shift.role}</strong>
                  <span className="shift-count">
                    {shift.filled}/{shift.count} filled
                  </span>
                </div>
                <div className="shift-footer">
                  <div className="shift-pay">${shift.payRate}/hr</div>
                  {shift.filled < shift.count && (
                    <button
                      className="pickup-btn"
                      onClick={() => handlePickupShift(shift.role)}
                      disabled={loading}
                    >
                      {loading ? 'Applying...' : 'Pick Up'}
                    </button>
                  )}
                  {shift.filled >= shift.count && (
                    <span className="filled-badge">Filled</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
