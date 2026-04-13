//https://vibe-backend-lake.vercel.app/api

import axios from 'axios';

// const BASE_URL=import.meta.env.MODE=="development"?"http://localhost:5001/api":"https://vibe-backend-lake.vercel.app/api";
const BASE_URL=import.meta.env.VITE_Base_URL || "http://localhost:5173";
export const axiosInstance=axios.create(
    {
        baseURL:BASE_URL,
        withCredentials:true,
    }
)

let getTokenFn = null;

export const setupAxiosAuth = (getToken) => {
    getTokenFn = getToken;
};

axiosInstance.interceptors.request.use(async (config) => {
    try {
        if (getTokenFn) {
            const token = await getTokenFn();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
    } catch (error) {
        console.error("Token error:", error);
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});