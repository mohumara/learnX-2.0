import { api } from '../lib/api';

export const sendLessonRequest = (data) => api.post('/requests', data);
export const getMyRequests = () => api.get('/requests/mine');
export const respondToRequest = (id, status) => api.patch(`/requests/${id}`, { status });
