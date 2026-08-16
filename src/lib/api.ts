const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

async function request(path: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.assign('/login');
    }
    throw new Error('Unauthorized');
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

export const api = {
  login: (email: string, password: string) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  register: (name: string, email: string, password: string, role: string) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password, role }) }),

  getMe: () => request('/auth/me'),
  updateProfile: (data: { name?: string; password?: string }) => request('/users/me', { method: 'PATCH', body: JSON.stringify(data) }),

  getTickets: () => request('/tickets'),
  getTicket: (id: number) => request(`/tickets/${id}`),
  createTicket: (data: { subject: string; description: string; category?: string; priority?: string }) =>
    request('/tickets', { method: 'POST', body: JSON.stringify(data) }),
  updateTicket: (id: number, data: { status?: string; assigned_to?: number | null }) =>
    request(`/tickets/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  suggestClassify: (subject: string, description: string) =>
    request(`/tickets/suggest-classify?subject=${encodeURIComponent(subject)}&description=${encodeURIComponent(description)}`),

  getComments: (ticketId: number) => request(`/comments/${ticketId}`),
  addComment: (ticketId: number, content: string, is_internal: boolean = false, attachment?: { name: string; type: string; data: string }) =>
    request(`/comments/${ticketId}`, { method: 'POST', body: JSON.stringify({ content, is_internal, attachment }) }),
  getTicketSummary: (ticketId: number) => request(`/tickets/${ticketId}/summary`),

  getNotifications: () => request('/notifications'),
  markNotificationRead: (id: number) => request(`/notifications/${id}/read`, { method: 'PATCH' }),

  getKB: (search?: string, category?: string) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    return request(`/kb?${params.toString()}`);
  },
  suggestKB: (subject: string, description: string) =>
    request(`/kb/suggest?subject=${encodeURIComponent(subject)}&description=${encodeURIComponent(description)}`),
  createKB: (data: { title: string; body: string; category: string }) =>
    request('/kb', { method: 'POST', body: JSON.stringify(data) }),

  getAnalytics: () => request('/analytics'),
  getAgents: () => request('/users/agents'),
};
