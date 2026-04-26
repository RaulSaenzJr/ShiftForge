export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'contractor' | 'client';
  phone?: string;
  availableRoles?: string[];
}

export interface AuthResponse {
  token: string;
  user: User;
  client?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  clientName?: string;
  clientEmail?: string;
  clientContacts?: Array<{
    name: string;
    email?: string;
    role?: string;
    phone?: string;
  }>;
}

export interface Shift {
  _id?: string;
  role: string;
  count: number;
  payRate: number;
  filled: number;
}

export interface Event {
  _id: string;
  title: string;
  client?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  clientName?: string;
  clientEmail?: string;
  clientContacts?: Array<{
    name: string;
    email?: string;
    role?: string;
    phone?: string;
  }>;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  shifts: Shift[];
  status: 'draft' | 'published' | 'completed' | 'cancelled';
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

export interface Application {
  _id: string;
  event: {
    _id: string;
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    location: string;
  };
  contractor: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  role: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
  reviewedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  reviewedAt?: string;
  notes?: string;
}

