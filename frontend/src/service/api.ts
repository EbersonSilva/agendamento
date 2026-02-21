import axios from 'axios';

export const api = axios.create({
    baseURL: 'http://localhost:3333',   
});

const storedToken = localStorage.getItem('@Estudio:token');
if (storedToken) {
    api.defaults.headers.Authorization = `Bearer ${storedToken}`;
}

