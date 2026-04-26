const DEFAULT_STAFF_ROLES = [
  'Server',
  'Bartender',
  'Busser',
  'Dishwasher',
  'Food Runner',
  'Chef',
  'Kitchen Assistant',
  'Set up/Break down',
  'Equipment Drivers',
  'Event Lead',
  'Event Planner',
  'Day of Coordinator'
];

const STORAGE_KEY = 'staffRoles';

const normalize = (roles: string[]): string[] => {
  const trimmed = roles.map(r => r.trim()).filter(Boolean);
  const unique = Array.from(new Set(trimmed));
  return unique;
};

export const loadStaffRoles = (): string[] => {
  if (typeof window === 'undefined' || !window.localStorage) return DEFAULT_STAFF_ROLES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STAFF_ROLES;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_STAFF_ROLES;
    const normalized = normalize(parsed);
    return normalized.length ? normalized : DEFAULT_STAFF_ROLES;
  } catch (err) {
    console.warn('Failed to load staff roles from storage, using defaults', err);
    return DEFAULT_STAFF_ROLES;
  }
};

export const saveStaffRoles = (roles: string[]): void => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  const normalized = normalize(roles);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
};

export const resetStaffRoles = (): void => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  window.localStorage.removeItem(STORAGE_KEY);
};

export const getDefaultStaffRoles = (): string[] => DEFAULT_STAFF_ROLES;
