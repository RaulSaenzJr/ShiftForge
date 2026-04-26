import api from './api';
import { AuthResponse } from '../types';

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
    phone?: string;
    availableRoles?: string[];
  }): Promise<AuthResponse> {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  async getContractors() {
    const response = await api.get('/auth/contractors');
    return response.data;
  },

  async getStaff() {
    const response = await api.get('/auth/staff');
    return response.data;
  },

  async getClients() {
    const response = await api.get('/auth/clients');
    return response.data;
  },

  async createUser(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'admin' | 'contractor';
    phone?: string;
    availableRoles?: string[];
  }) {
    const response = await api.post('/auth/create-user', data);
    return response.data;
  },

  async deleteUser(userId: string) {
    const response = await api.delete(`/auth/user/${userId}`);
    return response.data;
  },

  async resetPassword(userId: string) {
    const response = await api.post(`/auth/reset-password/${userId}`);
    return response.data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};
