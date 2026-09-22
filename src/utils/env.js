export const VITE_API_URL = import.meta.env.VITE_API_URL || '';
export const getEnv = (key, fallback='')=> import.meta.env[key] || fallback;
