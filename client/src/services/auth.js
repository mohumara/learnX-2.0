import { api } from '../lib/api';

export const registerAccount = (data) => api.post('/auth/register', data, { authenticated: false });
export const getMe = () => api.get('/auth/me');
export const updateMe = (data) => api.patch('/auth/me', data);
