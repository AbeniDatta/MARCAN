import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5050/api', // make sure backend is running
});

export default api;