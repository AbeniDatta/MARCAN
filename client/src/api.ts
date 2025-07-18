import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api', // Use relative URL for same-domain deployment
});

export default api;