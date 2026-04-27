import axios from 'axios';
import { showToast } from '@/components/ui/CustomToast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://intellign.up.railway.app';

const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Paths where 404s are expected and should be swallowed silently
const SILENT_404_PATTERNS = ['/ingest/', '/results/'];

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        const status: number | undefined = error.response?.status;
        const url: string = error.config?.url ?? '';
        const message: string = error.response?.data?.detail ?? error.response?.data?.message ?? error.message ?? 'Something went wrong';

        if (!error.response) {
            showToast.error('Network Error', 'Please check your internet connection.');
            return Promise.reject(error);
        }

        if (status === 404 && SILENT_404_PATTERNS.some(p => url.includes(p))) {
            return Promise.reject(error);
        }

        if (status === 422) {
            // Validation error — let callers handle
            return Promise.reject(error);
        }

        if (status === 500) {
            showToast.error('Server Error', 'Something went wrong on the server. Please try again.');
        } else if (status && status >= 400 && status !== 404 && status !== 422) {
            showToast.error('Error', message);
        }

        return Promise.reject(error);
    }
);

export { API_URL };
export default axiosInstance;
