import api from './api';
import { Event } from '../types';

export const eventService = {
  async getEvents(startDate?: string, endDate?: string): Promise<Event[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get(`/events?${params.toString()}`);
    return response.data;
  },

  async getEvent(id: string): Promise<Event> {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  async createEvent(data: Partial<Event>): Promise<Event> {
    const response = await api.post('/events', data);
    return response.data;
  },

  async getMyEvents(): Promise<Event[]> {
    const response = await api.get('/events/mine/list');
    return response.data;
  },

  async updateEvent(id: string, data: Partial<Event>): Promise<Event> {
    const response = await api.put(`/events/${id}`, data);
    return response.data;
  },

  async deleteEvent(id: string): Promise<void> {
    await api.delete(`/events/${id}`);
  }
};
