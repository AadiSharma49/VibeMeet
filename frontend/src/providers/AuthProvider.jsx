import { createContext, useEffect, useRef } from "react";
import { useAuth } from "@clerk/clerk-react";
import { axiosInstance } from "@/lib/axios";
import toast from "react-hot-toast";

const AuthContext = createContext({});

export default function AuthProvider({ children }) {
    const { getToken, isSignedIn, isLoaded } = useAuth();
    const interceptorRef = useRef(null);

    useEffect(() => {
        // Only set up interceptor if we have a signed-in user
        if (!isLoaded) return;

        // Clear any existing interceptor
        if (interceptorRef.current) {
            axiosInstance.interceptors.request.eject(interceptorRef.current);
        }

        interceptorRef.current = axiosInstance.interceptors.request.use(
            async (config) => {
                try {
                    // Only add token if user is signed in
                    if (isSignedIn) {
                        const token = await getToken();
                        if (token) {
                            config.headers.Authorization = `Bearer ${token}`;
                        }
                    }
                    return config;
                } catch (error) {
                    console.error("Token error:", error);
                    // Don't block request on token error, just proceed without auth
                    return config;
                }
            },
            (error) => {
                console.error("Error in Axios request:", error);
                return Promise.reject(error);
            }
        );

        return () => {
            if (interceptorRef.current) {
                axiosInstance.interceptors.request.eject(interceptorRef.current);
            }
        };
    }, [getToken, isSignedIn, isLoaded]);

    return <AuthContext.Provider value={{}}>{children}</AuthContext.Provider>;
}
