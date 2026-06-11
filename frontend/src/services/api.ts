const API_BASE = '/api';

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData extends LoginData {
  role: 'parent' | 'babysitter';
  firstName: string;
  lastName: string;
}

async function request(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

export const api = {
  login: (data: LoginData) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data: RegisterData) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getProfile: () => request('/profile'),
  updateProfile: (data: Record<string, unknown>) => request('/profile', { method: 'PATCH', body: JSON.stringify(data) }),
  getNearbyBabysitters: (lat: number, lng: number, radius = 10) =>
    request(`/babysitters/nearby?lat=${lat}&lng=${lng}&radius=${radius}`),
  getBabysitter: (id: string) => request(`/babysitters/${id}`),
  health: () => request('/health'),
};
