import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getCurrentUserProfile, updateCurrentUserProfile } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/me", protectRoute, getCurrentUserProfile);
router.patch("/me", protectRoute, updateCurrentUserProfile);

export default router;
