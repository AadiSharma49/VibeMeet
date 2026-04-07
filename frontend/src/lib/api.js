import {axiosInstance} from './axios';

export async function getStreamToken(userId) {
    if (!userId) throw new Error("userId is required");
    const response = await axiosInstance.get(`/chat/token?userId=${userId}`);
    return response.data;
}