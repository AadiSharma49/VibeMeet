import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email:{
        type:String,
        required:true,
        unique:true,
    },
    name:{
        type:String,
        required:true,
    },
    image:{
        type:String,
    },
    bio: {
        type: String,
        default: "",
        maxlength: 160,
    },
    status: {
        type: String,
        default: "",
        maxlength: 60,
    },
    username: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        lowercase: true,
    },
    allowDirectMessages: {
        type: Boolean,
        default: true,
    },
    allowChannelCreation: {
        type: Boolean,
        default: true,
    },
    clerkId:{
        type:String,
        required:true,
        unique:true,
    },
}, {timestamps:true});

export const User=mongoose.model("User", userSchema);
