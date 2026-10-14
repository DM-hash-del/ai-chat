import axios from 'axios';

const api = axios.create({
    baseURL: '/',
    timeout: 10000,
    withCredentials: true,
    withXSRFToken: true,
    xsrfHeaderName: 'X-XSRF-TOKEN',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

export default api;