import { api } from '../lib/api';

export const getMyNotifications = () => api.get('/notifications/mine');
export const markNotificationRead = (id) => api.patch(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => api.patch('/notifications/read-all');
