import { api } from '../lib/api';

export const searchTutors = (filters) => api.get('/tutors', { params: filters, authenticated: false });
export const getTutor = (id) => api.get(`/tutors/${id}`, { authenticated: false });
export const getMyTutorProfile = () => api.get('/tutors/me');
export const saveMyTutorProfile = (data) => api.put('/tutors/me', data);
