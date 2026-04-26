import { useState, useEffect, FC } from 'react';
import { Event } from '../types';
import { eventService } from '../services/event.service';
import { authService } from '../services/auth.service';
import { applicationService } from '../services/application.service';
import { format } from 'date-fns';
import { formatTime12Hour } from '../utils/timeFormat';
import '../styles/ShiftAssignment.css';

interface Contractor {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  availableRoles: string[];
}

export const ShiftAssignment: FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [filteredContractors, setFilteredContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedEvent && selectedRole) {
      // Filter contractors who can do this role
      const filtered = contractors.filter(c =>
        c.availableRoles.includes(selectedRole)
      );
      setFilteredContractors(filtered);
    } else {
      setFilteredContractors([]);
    }
  }, [selectedEvent, selectedRole, contractors]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [eventsData, contractorsData] = await Promise.all([
        eventService.getEvents(),
        authService.getContractors()
      ]);
      setEvents(eventsData);
      setContractors(contractorsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (contractorId: string) => {
    if (!selectedEvent || !selectedRole) return;

    setAssigning(true);
    setMessage(null);

    try {
      await applicationService.assignContractor(
        selectedEvent._id,
        contractorId,
        selectedRole
      );
      
      const contractor = contractors.find(c => c._id === contractorId);
      setMessage({
        text: `Successfully assigned ${contractor?.firstName} ${contractor?.lastName} to ${selectedRole}!`,
        type: 'success'
      });

      // Reload events to update shift counts
      const updatedEvents = await eventService.getEvents();
      setEvents(updatedEvents);
      
      // Update selected event
      const updated = updatedEvents.find(e => e._id === selectedEvent._id);
      if (updated) {
        setSelectedEvent(updated);
      }

      // Reset selection after 2 seconds
      setTimeout(() => {
        setSelectedRole('');
        setMessage(null);
      }, 2000);
    } catch (error: any) {
      setMessage({
        text: error.response?.data?.message || 'Failed to assign contractor',
        type: 'error'
      });
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading assignment data...</div>;
  }

  return (
    <div className="shift-assignment">
      <div className="assignment-header">
        <h2>Direct Shift Assignment</h2>
        <p>Assign contractors to event shifts without waiting for applications</p>
      </div>

      {message && (
        <div className={`message-banner ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="assignment-workflow">
        {/* Step 1: Select Event */}
        <div className="workflow-step">
          <h3>1. Select Event</h3>
          <div className="event-selector">
            {events.length === 0 ? (
              <p className="no-data">No events available</p>
            ) : (
              <div className="event-list">
                {events.map(event => (
                  <div
                    key={event._id}
                    className={`event-item ${selectedEvent?._id === event._id ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedEvent(event);
                      setSelectedRole('');
                    }}
                  >
                    <h4>{event.title}</h4>
                    <p className="event-date">
                      {format(new Date(event.date), 'MMM d, yyyy')} at {formatTime12Hour(event.startTime)}
                    </p>
                    <p className="event-location">{event.location}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Select Role */}
        {selectedEvent && (
          <div className="workflow-step">
            <h3>2. Select Position</h3>
            <div className="role-selector">
              {selectedEvent.shifts.map((shift, idx) => (
                <div
                  key={idx}
                  className={`role-item ${selectedRole === shift.role ? 'selected' : ''} ${
                    shift.filled >= shift.count ? 'full' : ''
                  }`}
                  onClick={() => {
                    if (shift.filled < shift.count) {
                      setSelectedRole(shift.role);
                    }
                  }}
                >
                  <div className="role-info">
                    <h4>{shift.role}</h4>
                    <p className="role-pay">${shift.payRate}/hr</p>
                  </div>
                  <div className="role-status">
                    <span className={`fill-count ${shift.filled >= shift.count ? 'full' : ''}`}>
                      {shift.filled}/{shift.count} filled
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Select Contractor */}
        {selectedEvent && selectedRole && (
          <div className="workflow-step">
            <h3>3. Select Contractor</h3>
            <div className="contractor-selector">
              {filteredContractors.length === 0 ? (
                <p className="no-data">No contractors available for {selectedRole}</p>
              ) : (
                <div className="contractor-list">
                  {filteredContractors.map(contractor => (
                    <div key={contractor._id} className="contractor-item">
                      <div className="contractor-avatar">
                        {contractor.firstName[0]}{contractor.lastName[0]}
                      </div>
                      <div className="contractor-details">
                        <h4>{contractor.firstName} {contractor.lastName}</h4>
                        <p className="contractor-email">{contractor.email}</p>
                        <div className="contractor-roles-mini">
                          {contractor.availableRoles.slice(0, 3).map((role, idx) => (
                            <span key={idx} className="role-badge-mini">{role}</span>
                          ))}
                          {contractor.availableRoles.length > 3 && (
                            <span className="role-badge-mini">+{contractor.availableRoles.length - 3}</span>
                          )}
                        </div>
                      </div>
                      <button
                        className="btn-assign-contractor"
                        onClick={() => handleAssign(contractor._id)}
                        disabled={assigning}
                      >
                        {assigning ? 'Assigning...' : 'Assign'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {!selectedEvent && (
        <div className="placeholder-message">
          <p>👆 Select an event above to begin assigning shifts</p>
        </div>
      )}
    </div>
  );
};
