import { useState, useEffect } from "react";
import { StreamChat } from "stream-chat";
import { useUser } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "@/lib/api";
import * as Sentry from "@sentry/react";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

export const useStreamChat=() => {
    const { user } = useUser();
    const [chatClient, setChatClient] = useState(null);

    const {
        data: streamToken,
        isLoading: tokenLoading,
        error:tokenError,}=useQuery({
            queryKey:["streamToken"],
            queryFn:() => getStreamToken(user.id), 
            enabled:!!user, //this is will take the object and convert it to a boolean value 
        })

        useEffect(()=>{
            const initChat=async() => {

                if (!tokendata?.token || !user) return;

                try{
                    const client=StreamChat.getInstance(STREAM_API_KEY);
                    await client.connectUser(
                        {
                            id:user.id,
                            name:user.fullName,
                            image:user.imageUrl,
                        }
                    )
                    setChatClient(client);
                }catch(error){
                    console.error("Error initializing Stream Chat:", error);
                    Sentry.captureException(error,{
                        tags:{component:"useStreamChat"},
                        extra:{userId:user.id,context:"Failed to initialize Stream Chat",streamApiKey:STREAM_API_KEY ? "present" : "missing"},
                    }); 
            }  
        } 
         initChat()
         return ()=>{
            if(chatClient) chatClient.disconnectUser();
         }
        },[tokendata,user,chatClient])

        return { chatClient, isLoading:tokenLoading, error:tokenError };
    } 
