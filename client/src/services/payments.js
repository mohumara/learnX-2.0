import { api } from '../lib/api';

export const initializePayment = (requestId) => api.post('/payments/initialize', { requestId });
export const verifyPayment = (reference) => api.get(`/payments/verify/${reference}`);
export const confirmSession = (requestId) => api.patch(`/payments/requests/${requestId}/confirm`);
export const disputeSession = (requestId, reason) => api.patch(`/payments/requests/${requestId}/dispute`, { reason });
