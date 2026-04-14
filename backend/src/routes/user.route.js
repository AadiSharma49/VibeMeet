import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getCurrentUserProfile, updateCurrentUserProfile, updatePresenceStatus, searchUsers } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/me", protectRoute, getCurrentUserProfile);
router.patch("/me", protectRoute, updateCurrentUserProfile);
router.patch("/presence", protectRoute, updatePresenceStatus);
router.get("/search", protectRoute, searchUsers);

export default router;
