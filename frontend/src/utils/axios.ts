import axios from 'axios';

const BACKEND_URL: string = import.meta.env.VITE_BACKEND_URL;

const api = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});


export default api;