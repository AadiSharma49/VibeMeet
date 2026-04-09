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
        allowDirectMessages: existingUser.allowDirectMessages !== false,
        allowChannelCreation: existingUser.allowChannelCreation !== false,
      },
    });
  } catch (error) {
    console.error("Error updating current user profile:", error);
    return res.status(500).json({ message: "Failed to update profile" });
  }
};
