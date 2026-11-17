import { api } from '../lib/api';

export const sendLessonRequest = (data) => api.post('/requests', data);
export const getMyRequests = () => api.get('/requests/mine');
export const respondToRequest = (id, status) => api.patch(`/requests/${id}`, { status });
export const updateLessonRequest = (id, data) => api.patch(`/requests/${id}`, data);
export const cancelLessonRequest = (id) => api.delete(`/requests/${id}`);
