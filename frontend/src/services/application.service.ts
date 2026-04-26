import api from './api';
import { Application } from '../types';

export const applicationService = {
  async getApplications(filters?: {
    status?: string;
    eventId?: string;
  }): Promise<Application[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.eventId) params.append('eventId', filters.eventId);
    
    const response = await api.get(`/applications?${params.toString()}`);
    return response.data;
  },

  async applyForShift(eventId: string, role: string): Promise<Application> {
    const response = await api.post('/applications', { eventId, role });
    return response.data;
  },

  async reviewApplication(
    id: string,
    status: 'approved' | 'rejected',
    notes?: string
  ): Promise<Application> {
    const response = await api.patch(`/applications/${id}/review`, {
      status,
      notes
    });
    return response.data;
  },

  async cancelApplication(id: string): Promise<void> {
    await api.delete(`/applications/${id}`);
  },

  async assignContractor(
    eventId: string,
    contractorId: string,
    role: string
  ): Promise<Application> {
    const response = await api.post('/applications/assign', {
      eventId,
      contractorId,
      role
    });
    return response.data;
  }
};
