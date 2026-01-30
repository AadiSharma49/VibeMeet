import { Inngest } from "inngest";
import { connectDB } from "./db.js";
import { User } from "../models/user.model.js";
import { deleteStreamUser, upsertStreamUser } from "./stream.js";


// Create a client to send and receive events
export const inngest = new Inngest({ id: "Vibe-Meet" });

const syncUser=inngest.createFunction(
    {id:"sync-user"},
    {event:"clerk/user.created"},
    async({event})=>{
        await connectDB();

        const {id, email_addresses, first_name, last_name, image_url}=event.data;

        const newUser={
            clerkId:id,
            email:email_addresses[0]?.email_address,
            name:`${first_name||""}  ${last_name ||""}`.trim(),
            image:image_url,
        }
        await User.create(newUser)
        await upsertStreamUser({
  userData: {
    id: newUser.clerkId.toString(),
    name: newUser.name,
    image: newUser.image,
  },
});
    }
)

const deleteUser=inngest.createFunction(
    {id:"delete-user"},
    {event:"clerk/user.deleted"},
    async({event})=>{
        await connectDB();  
        const {id}=event.data;
        await User.deleteOne({clerkId:id});
        await deleteStreamUser({userId:id.toString()});
    }
)

// Create an empty array where we'll export future Inngest functions
export const functions = [syncUser, deleteUser];