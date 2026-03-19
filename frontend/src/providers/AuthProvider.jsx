import { createContext,useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { axiosInstance } from "@/lib/axios";
import toast from "react-hot-toast";

const AuthContext=createContext({});


export default function AuthProvider({children}){
    const {getToken}=useAuth();
    useEffect(()=>{

        const interceptor=axiosInstance.interceptors.request.use(
        async(config)=>{
            try{
                const token=await getToken();
                if(token) config.headers.Authorization=`Bearer ${token}`;
                return config;
           }catch(error){
            if(error.message?.includes("Failed to fetch") || error.message?.includes("Network Error")){
                toast.error("Authentication error. Please refresh page.");
            }
            console.error("Error in Axios request:", error);
        }
                return config;
           },
           (error)=>{
            console.error("Error in Axios request:", error);
            return Promise.reject(error);
           }
        );
        return()=>axiosInstance.interceptors.request.eject(interceptor);

    },[getToken]);

    return <AuthContext.Provider value={{}}>{children}</AuthContext.Provider>
}