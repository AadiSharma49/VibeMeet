import { User } from "../models/user.model.js";
import { upsertStreamUser } from "../config/stream.js";

const sanitizeUsername = (value = "") =>
  value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "")
    .slice(0, 24);

export const getCurrentUserProfile = async (req, res) => {
  try {
    const clerkId = req.auth()?.userId;

    if (!clerkId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findOne({ clerkId }).lean();

    if (!user) {
      return res.status(404).json({ message: "User profile not found" });
    }

    return res.status(200).json({
      user: {
        id: user._id,
        clerkId: user.clerkId,
        email: user.email,
        name: user.name,
        image: user.image,
        username: user.username || "",
        bio: user.bio || "",
        status: user.status || "",
        presenceStatus: user.presenceStatus || "online",
        allowDirectMessages: user.allowDirectMessages !== false,
        allowChannelCreation: user.allowChannelCreation !== false,
      },
    });
  } catch (error) {
    console.error("Error fetching current user profile:", error);
    return res.status(500).json({ message: "Failed to fetch profile" });
  }
};

export const updateCurrentUserProfile = async (req, res) => {
  try {
    const clerkId = req.auth()?.userId;

    if (!clerkId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const existingUser = await User.findOne({ clerkId });

    if (!existingUser) {
      return res.status(404).json({ message: "User profile not found" });
    }

    const nextName = String(req.body?.name || "").trim();
    const nextBio = String(req.body?.bio || "").trim().slice(0, 160);
    const nextStatus = String(req.body?.status || "").trim().slice(0, 60);
    const nextUsername = sanitizeUsername(req.body?.username || "");
    const allowDirectMessages = req.body?.allowDirectMessages !== false;
    const allowChannelCreation = req.body?.allowChannelCreation !== false;

    if (!nextName) {
      return res.status(400).json({ message: "Name is required" });
    }

    if (nextUsername) {
      const usernameTaken = await User.findOne({
        clerkId: { $ne: clerkId },
        username: nextUsername,
      }).lean();

      if (usernameTaken) {
        return res.status(409).json({ message: "Username is already taken" });
      }
    }

    existingUser.name = nextName;
    existingUser.bio = nextBio;
    existingUser.status = nextStatus;
    existingUser.username = nextUsername || undefined;
    existingUser.allowDirectMessages = allowDirectMessages;
    existingUser.allowChannelCreation = allowChannelCreation;

    await existingUser.save();

    await upsertStreamUser({
      userData: {
        id: existingUser.clerkId.toString(),
        name: existingUser.name,
        image: existingUser.image || "",
        bio: existingUser.bio || "",
        status: existingUser.status || "",
        allow_direct_messages: existingUser.allowDirectMessages !== false,
      },
    });

    return res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: existingUser._id,
        clerkId: existingUser.clerkId,
        email: existingUser.email,
        name: existingUser.name,
        image: existingUser.image,
        username: existingUser.username || "",
        bio: existingUser.bio || "",
        status: existingUser.status || "",
        presenceStatus: existingUser.presenceStatus || "online",
        allowDirectMessages: existingUser.allowDirectMessages !== false,
        allowChannelCreation: existingUser.allowChannelCreation !== false,
      },
    });
  } catch (error) {
    console.error("Error updating current user profile:", error);
    return res.status(500).json({ message: "Failed to update profile" });
  }
};

export const updatePresenceStatus = async (req, res) => {
  try {
    const clerkId = req.auth()?.userId;

    if (!clerkId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { presenceStatus } = req.body;

    if (!presenceStatus || !['online', 'dnd', 'sleep', 'invisible'].includes(presenceStatus)) {
      return res.status(400).json({ message: "Invalid presence status. Must be one of: online, dnd, sleep, invisible" });
    }

    const existingUser = await User.findOne({ clerkId });

    if (!existingUser) {
      return res.status(404).json({ message: "User profile not found" });
    }

    existingUser.presenceStatus = presenceStatus;
    await existingUser.save();

    // Update Stream user with presence info
    await upsertStreamUser({
      userData: {
        id: existingUser.clerkId.toString(),
        name: existingUser.name,
        image: existingUser.image || "",
        bio: existingUser.bio || "",
        status: existingUser.status || "",
        allow_direct_messages: existingUser.allowDirectMessages !== false,
        custom: {
          presenceStatus: existingUser.presenceStatus
        }
      },
    });

    return res.status(200).json({
      message: "Presence status updated successfully",
      presenceStatus: existingUser.presenceStatus,
    });
  } catch (error) {
    console.error("Error updating presence status:", error);
    return res.status(500).json({ message: "Failed to update presence status" });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: "Search query must be at least 2 characters" });
    }

    const searchPattern = new RegExp(q.trim(), 'i');

    const users = await User.find({
      $or: [
        { name: searchPattern },
        { username: searchPattern }
      ],
      allowDirectMessages: true
    })
    .select('name image username email presenceStatus')
    .limit(20)
    .lean();

    const serializedUsers = users.map(user => ({
      id: user.clerkId,
      name: user.name,
      image: user.image,
      username: user.username || "",
      presenceStatus: user.presenceStatus || "online"
    }));

    return res.status(200).json({ users: serializedUsers });
  } catch (error) {
    console.error("Error searching users:", error);
    return res.status(500).json({ message: "Failed to search users" });
  }
};
