import {axiosInstance} from './axios';

export async function getStreamToken(userId) {
    if (!userId) throw new Error("userId is required");
    const response = await axiosInstance.get(`/chat/token?userId=${userId}`);
    return response.data;
}

export async function getCurrentUserProfile() {
    const response = await axiosInstance.get("/users/me");
    return response.data;
}

export async function joinChannelByPasscode(payload) {
    const response = await axiosInstance.post("/chat/join-by-passcode", payload);
    return response.data;
}

export async function updateCurrentUserProfile(payload) {
    const response = await axiosInstance.patch("/users/me", payload);
    return response.data;
}

export async function getChannelNameSuggestions(payload) {
    const response = await axiosInstance.post("/ai/channel-suggestions", payload);
    return response.data;
}

export async function askChannelAI(payload) {
    const response = await axiosInstance.post("/ai/channel-assistant", payload);
    return response.data;
}

export async function getChannelCatchUp(payload) {
    const response = await axiosInstance.post("/ai/catch-up", payload);
    return response.data;
}

export async function rewriteMessageWithAI(payload) {
    const response = await axiosInstance.post("/ai/rewrite", payload);
    return response.data;
}

export async function getChannelInsights(payload) {
    const response = await axiosInstance.post("/ai/insights", payload);
    return response.data;
}

export async function generateCallRecap(payload) {
    const response = await axiosInstance.post("/ai/call-recap", payload);
    return response.data;
}
