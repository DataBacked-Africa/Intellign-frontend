import axios from 'axios';
import { showToast } from '@/components/ui/CustomToast';

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

if (!CLOUD_NAME || !UPLOAD_PRESET) {
    console.warn("Cloudinary environment variables are missing!");
}

export interface CloudinaryResponse {
    secure_url: string;
    public_id: string;
    original_filename: string;
    format: string;
    bytes: number;
    created_at: string;
}

export const uploadToCloudinary = async (file: File): Promise<CloudinaryResponse | null> => {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
        showToast.error("Configuration Error", "Cloudinary credentials missing.");
        return null;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    try {
        const response = await axios.post<CloudinaryResponse>(
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
            formData,
            {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    // Optional: We could expose progress via a callback if needed
                    // const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
                    // console.log(percentCompleted);
                }
            }
        );

        return response.data;
    } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        showToast.error("Upload Failed", "Could not upload file to cloud storage.");
        return null;
    }
};
