import { api } from '../lib/api';

export const getStats = () => api.get('/admin/stats');
export const getUsers = () => api.get('/admin/users');
export const getAllTutors = () => api.get('/admin/tutors');
export const setTutorStatus = (id, status) => api.patch(`/admin/tutors/${id}/status`, { status });
export const deleteUser = (uid) => api.delete(`/admin/users/${uid}`);
