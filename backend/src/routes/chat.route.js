import express from "express";
import { getStreamToken, joinChannelByPasscode } from "../controllers/chat.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/token", protectRoute, getStreamToken);
router.post("/join-by-passcode", protectRoute, joinChannelByPasscode);

export default router;
