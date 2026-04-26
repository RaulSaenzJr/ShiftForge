import { useState, useEffect, FC } from 'react';
import { Application } from '../types';
import { applicationService } from '../services/application.service';
import { format } from 'date-fns';
import { formatTime12Hour } from '../utils/timeFormat';
import '../styles/Applications.css';

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

interface ApplicationsListProps {
  onUpdate: () => void;
}

export const ApplicationsList: FC<ApplicationsListProps> = ({ onUpdate }: ApplicationsListProps) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filter, setFilter] = useState<FilterStatus>('pending');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplications();
  }, [filter]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const data = await applicationService.getApplications(
        filter === 'all' ? {} : { status: filter }
      );
      setApplications(data);
    } catch (error) {
      console.error('Failed to load applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id: string, status: 'approved' | 'rejected', notes?: string) => {
    try {
      await applicationService.reviewApplication(id, status, notes);
      loadApplications();
      onUpdate();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to review application');
    }
  };

  if (loading) {
    return <div className="loading">Loading applications...</div>;
  }

  return (
    <div className="applications-list">
      <div className="applications-header">
        <h2>Staff Applications</h2>
        <div className="filter-tabs">
          <button
            className={filter === 'pending' ? 'active' : ''}
            onClick={() => setFilter('pending')}
          >
            Pending ({applications.filter(a => a.status === 'pending').length})
          </button>
          <button
            className={filter === 'approved' ? 'active' : ''}
            onClick={() => setFilter('approved')}
          >
            Approved
          </button>
          <button
            className={filter === 'rejected' ? 'active' : ''}
            onClick={() => setFilter('rejected')}
          >
            Rejected
          </button>
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All
          </button>
        </div>
      </div>

      {applications.length === 0 ? (
        <p className="no-applications">No applications to display</p>
      ) : (
        <div className="applications-grid">
          {applications.map((app: Application) => (
            <div key={app._id} className={`application-item status-${app.status}`}>
              <div className="application-header">
                <div>
                  <h3>{app.contractor.firstName} {app.contractor.lastName}</h3>
                  <p className="contractor-email">{app.contractor.email}</p>
                </div>
                <span className={`status-badge ${app.status}`}>
                  {app.status.toUpperCase()}
                </span>
              </div>

              <div className="application-details">
                <div className="detail-row">
                  <strong>Event:</strong> {app.event.title}
                </div>
                <div className="detail-row">
                  <strong>Date:</strong> {format(new Date(app.event.date), 'MMM d, yyyy')} at {formatTime12Hour(app.event.startTime)}
                </div>
                <div className="detail-row">
                  <strong>Location:</strong> {app.event.location}
                </div>
                <div className="detail-row">
                  <strong>Role:</strong> <span className="role-badge">{app.role}</span>
                </div>
                <div className="detail-row">
                  <strong>Applied:</strong> {format(new Date(app.appliedAt), 'MMM d, yyyy h:mm a')}
                </div>
                {app.reviewedAt && app.reviewedBy && (
                  <>
                    <div className="detail-row">
                      <strong>Reviewed:</strong> {format(new Date(app.reviewedAt), 'MMM d, yyyy h:mm a')}
                    </div>
                    <div className="detail-row">
                      <strong>Reviewed by:</strong> {app.reviewedBy.firstName} {app.reviewedBy.lastName}
                    </div>
                  </>
                )}
                {app.notes && (
                  <div className="detail-row">
                    <strong>Notes:</strong> {app.notes}
                  </div>
                )}
              </div>

              {app.status === 'pending' && (
                <div className="application-actions">
                  <button
                    className="btn-approve"
                    onClick={() => handleReview(app._id, 'approved')}
                  >
                    Approve
                  </button>
                  <button
                    className="btn-reject"
                    onClick={() => {
                      const notes = prompt('Rejection reason (optional):');
                      handleReview(app._id, 'rejected', notes || undefined);
                    }}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
