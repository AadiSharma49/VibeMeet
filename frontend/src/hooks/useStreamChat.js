import { useState, useEffect } from "react";
import { StreamChat } from "stream-chat";
import { useUser } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "@/lib/api";
import * as Sentry from "@sentry/react";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

export const useStreamChat = () => {
    const { user } = useUser();
    const [chatClient, setChatClient] = useState(null);
    const [error, setError] = useState(null);

    const {
        data: tokenData,
        isLoading: isTokenLoading,
        error: tokenError,
    } = useQuery({
        queryKey: ["streamToken", user?.id],
        queryFn: () => getStreamToken(user.id),
        enabled: !!user,
        retry: 1,
        staleTime: Infinity,
    })

    useEffect(() => {
        if (!tokenData?.token || !user || chatClient) return;

        const initChat = async () => {
            try {
                const client = StreamChat.getInstance(STREAM_API_KEY);
                await client.connectUser(
                    {
                        id: user.id,
                        name: user.fullName || "Anonymous",
                        image: user.imageUrl || "",
                    },
                    tokenData.token
                );
                setChatClient(client);
                setError(null);
            } catch (err) {
                console.error("Stream Chat error:", err);
                setError(err?.message || "Failed to connect");
            }
        }

        initChat();
    }, [chatClient, tokenData?.token, user]);

    return {
        chatClient,
        isLoading: isTokenLoading && !tokenData?.token,
        error: tokenError || error,
    }
} 
