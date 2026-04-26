import { useEffect, useState, FC } from 'react';
import { authService } from '../services/auth.service';
import { format } from 'date-fns';
import '../styles/StaffRoster.css';

interface Client {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  createdAt: string;
}

export const ClientRoster: FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [filtered, setFiltered] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await authService.getClients();
        setClients(data);
        setFiltered(data);
      } catch (err) {
        console.error('Failed to load clients', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const term = search.toLowerCase();
    setFiltered(
      clients.filter(c =>
        c.firstName.toLowerCase().includes(term) ||
        c.lastName.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term)
      )
    );
  }, [search, clients]);

  if (loading) return <div className="loading">Loading clients...</div>;

  return (
    <div className="staff-roster">
      <div className="roster-header">
        <div>
          <h2>Client Directory</h2>
          <p className="roster-stats">{clients.length} clients ({filtered.length} shown)</p>
        </div>
      </div>

      <div className="roster-filters">
        <input
          type="text"
          className="search-input"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search clients by name or email"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="no-results">No clients found</p>
      ) : (
        <div className="staff-grid">
          {filtered.map(client => (
            <div key={client._id} className="staff-card client">
              <div className="staff-badge">client</div>
              <div className="staff-header">
                <div className="staff-avatar">
                  {client.firstName[0]}{client.lastName[0]}
                </div>
                <div className="staff-info">
                  <h3>{client.firstName} {client.lastName}</h3>
                  <p className="staff-email">{client.email}</p>
                  {client.phone && <p className="staff-phone">{client.phone}</p>}
                </div>
              </div>
              <div className="staff-meta">
                <span className="join-date">Created {format(new Date(client.createdAt), 'MMM yyyy')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
