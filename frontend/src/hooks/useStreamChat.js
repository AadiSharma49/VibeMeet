import { useState, useEffect } from "react";
import { StreamChat } from "stream-chat";
import { useUser } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "@/lib/api";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

export const useStreamChat = () => {
    const { user } = useUser();
    const userId = user?.id;
    const userName = user?.fullName || "Anonymous";
    const userImage = user?.imageUrl || "";
    const [chatClient, setChatClient] = useState(null);
    const [connectionError, setConnectionError] = useState(null);

    const {
        data: tokenData,
        isLoading: isTokenLoading,
        error: tokenError,
    } = useQuery({
        queryKey: ["streamToken", userId],
        queryFn: () => getStreamToken(userId),
        enabled: Boolean(userId),
        retry: 1,
        staleTime: Infinity,
    })

    useEffect(() => {
        if (!tokenData?.token || !userId || !STREAM_API_KEY) return;

        let isCancelled = false;

        const initChat = async () => {
            try {
                const client = StreamChat.getInstance(STREAM_API_KEY);

                if (client.userID && client.userID !== userId) {
                    await client.disconnectUser().catch(() => {});
                }

                if (!client.userID) {
                    await client.connectUser(
                        {
                            id: userId,
                            name: userName,
                            image: userImage,
                        },
                        tokenData.token
                    );
                }

                if (!isCancelled) {
                    setChatClient(client);
                    setConnectionError(null);
                }
            } catch (err) {
                console.error("Stream Chat error:", err);
                if (!isCancelled) {
                    setConnectionError(err?.message || "Failed to connect");
                }
            }
        }

        initChat();

        return () => {
            isCancelled = true;
        };
    }, [tokenData?.token, userId, userImage, userName]);

    useEffect(() => {
        return () => {
            if (chatClient?.userID) {
                chatClient.disconnectUser().catch(() => {});
            }
        };
    }, [chatClient]);

    return {
        chatClient,
        isLoading: isTokenLoading && !tokenData?.token,
        error: tokenError || connectionError || (!STREAM_API_KEY ? new Error("Missing Stream API key") : null),
    }
} 
