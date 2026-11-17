import { api } from '../lib/api';

export const getBankDetails = () => api.get('/tutors/me/bank');
export const saveBankDetails = (data) => api.post('/tutors/me/bank', data);
