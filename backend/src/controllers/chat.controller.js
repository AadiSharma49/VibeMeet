import { generateStreamToken, streamClient } from "../config/stream.js"
import { User } from "../models/user.model.js";

const normalizePasscode = (value = "") =>
  String(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);

export const getStreamToken=async(req,res)=>{
    try {
        const userId = req.auth()?.userId;
        if (!userId) {
            return res.status(401).json({ message: "User ID not found" });
        }
        
        const token = generateStreamToken({ userId });
        
        if (!token) {
            return res.status(500).json({ message: "Failed to generate token" });
        }
        
        res.status(200).json({ token });
    } catch (error) { 
        console.error("Error in getStreamToken:", error);
        res.status(500).json({ message: "Failed to generate stream token", error: error.message });
    }
}

export const joinChannelByPasscode = async (req, res) => {
    try {
        const userId = req.auth()?.userId;
        const passcode = normalizePasscode(req.body?.passcode);

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (!passcode) {
            return res.status(400).json({ message: "A valid passcode is required" });
        }

        const channels = await streamClient.queryChannels(
            {
                type: "messaging",
                join_passcode: passcode,
            },
            {
                last_message_at: -1,
            },
            {
                limit: 1,
                state: true,
                watch: false,
            }
        );

        const targetChannel = channels[0];

        if (!targetChannel) {
            return res.status(404).json({ message: "No channel matches that passcode" });
        }

        const members = Object.keys(targetChannel.state?.members || {});
        const isMember = members.includes(userId);

        if (isMember) {
            return res.status(200).json({
                status: "joined",
                channelId: targetChannel.id,
                channelName: targetChannel.data?.name || targetChannel.id,
                private: Boolean(targetChannel.data?.private),
            });
        }

        if (targetChannel.data?.private) {
            const existingRequests = Array.isArray(targetChannel.data?.pending_join_requests)
                ? targetChannel.data.pending_join_requests
                : [];

            const alreadyRequested = existingRequests.some((request) => request?.userId === userId);

            if (!alreadyRequested) {
                const requester = await User.findOne({ clerkId: userId }).lean();
                const nextRequests = [
                    ...existingRequests,
                    {
                        userId,
                        name: requester?.name || userId,
                        image: requester?.image || "",
                        requestedAt: new Date().toISOString(),
                    },
                ];

                await targetChannel.updatePartial({
                    set: {
                        pending_join_requests: nextRequests,
                    },
                });
            }

            return res.status(200).json({
                status: "requested",
                channelId: targetChannel.id,
                channelName: targetChannel.data?.name || targetChannel.id,
                private: true,
            });
        }

        await targetChannel.addMembers([userId]);

        return res.status(200).json({
            status: "joined",
            channelId: targetChannel.id,
            channelName: targetChannel.data?.name || targetChannel.id,
            private: false,
        });
    } catch (error) {
        console.error("Error joining channel by passcode:", error);
        return res.status(500).json({ message: "Failed to join channel by passcode" });
    }
};
