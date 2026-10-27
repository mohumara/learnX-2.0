import { api } from '../lib/api';

export const sendContactMessage = (data) => api.post('/contact', data, { authenticated: false });
