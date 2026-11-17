import { api } from '../lib/api';

export const getMyChats = () => api.get('/chats/mine');
export const getChat = (id) => api.get(`/chats/${id}`);
export const getChatMessages = (id) => api.get(`/chats/${id}/messages`);
export const sendChatMessage = (id, text) => api.post(`/chats/${id}/messages`, { text });
