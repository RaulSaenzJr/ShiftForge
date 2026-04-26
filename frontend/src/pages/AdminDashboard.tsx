import { useState, FC } from 'react';
import { CalendarView } from '../components/CalendarView';
import { EventForm } from '../components/EventForm';
import { ManageEvents } from '../components/ManageEvents';
import { ApplicationsList } from '../components/ApplicationsList';
import { ShiftAssignment } from '../components/ShiftAssignment';
import { StaffRoster } from '../components/StaffRoster';
import { ClientRoster } from '../components/ClientRoster';
import '../styles/Admin.css';

type AdminTab = 'calendar' | 'events' | 'manageEvents' | 'applications' | 'assignments' | 'staff' | 'clients';

export const AdminDashboard: FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('calendar');
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = (): void => setRefreshKey((prev: number) => prev + 1);

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <nav className="dashboard-nav">
          <button
            className={activeTab === 'calendar' ? 'active' : ''}
            onClick={() => setActiveTab('calendar' as AdminTab)}
          >
            Calendar
          </button>
          <button
            className={activeTab === 'events' ? 'active' : ''}
            onClick={() => setActiveTab('events' as AdminTab)}
          >
            Create Event
          </button>
          <button
            className={activeTab === 'manageEvents' ? 'active' : ''}
            onClick={() => setActiveTab('manageEvents' as AdminTab)}
          >
            Manage Events
          </button>
          <button
            className={activeTab === 'applications' ? 'active' : ''}
            onClick={() => setActiveTab('applications' as AdminTab)}
          >
            Applications
          </button>
          <button
            className={activeTab === 'assignments' ? 'active' : ''}
            onClick={() => setActiveTab('assignments' as AdminTab)}
          >
            Assign Shifts
          </button>
          <button
            className={activeTab === 'staff' ? 'active' : ''}
            onClick={() => setActiveTab('staff' as AdminTab)}
          >
            Staff
          </button>
          <button
            className={activeTab === 'clients' ? 'active' : ''}
            onClick={() => setActiveTab('clients' as AdminTab)}
          >
            Clients
          </button>
        </nav>
      </div>

      <div className="dashboard-content">
        {activeTab === 'calendar' && <CalendarView key={refreshKey} />}
        {activeTab === 'events' && <EventForm onSuccess={() => { refresh(); setActiveTab('calendar'); }} />}
        {activeTab === 'manageEvents' && <ManageEvents />}
        {activeTab === 'applications' && <ApplicationsList key={refreshKey} onUpdate={refresh} />}
        {activeTab === 'assignments' && <ShiftAssignment key={refreshKey} />}
        {activeTab === 'staff' && <StaffRoster />}
        {activeTab === 'clients' && <ClientRoster />}
      </div>
    </div>
  );
};
