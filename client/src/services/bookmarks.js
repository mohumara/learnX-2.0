import { api } from '../lib/api';

export const getBookmarkedTutors = () => api.get('/bookmarks');
export const toggleBookmark = (tutorId) => api.post(`/bookmarks/${tutorId}`);
