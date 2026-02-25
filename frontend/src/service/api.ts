import axios from 'axios';

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3333',   
});

const storedToken = localStorage.getItem('@Estudio:token');
if (storedToken) {
    api.defaults.headers.Authorization = `Bearer ${storedToken}`;
}

