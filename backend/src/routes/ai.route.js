import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getAssistantAnswer,
  getCallRecap,
  getCatchUp,
  getChannelNameSuggestions,
  getInsights,
  getRewrite,
} from "../controllers/ai.controller.js";

const router = express.Router();

router.post("/channel-suggestions", protectRoute, getChannelNameSuggestions);
router.post("/channel-assistant", protectRoute, getAssistantAnswer);
router.post("/catch-up", protectRoute, getCatchUp);
router.post("/rewrite", protectRoute, getRewrite);
router.post("/insights", protectRoute, getInsights);
router.post("/call-recap", protectRoute, getCallRecap);

export default router;
