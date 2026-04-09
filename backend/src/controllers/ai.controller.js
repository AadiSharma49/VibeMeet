import {
  askChannelAssistant,
  extractChannelInsights,
  generateCallRecap,
  generateChannelSuggestions,
  getChannelCatchUp,
  rewriteChannelMessage,
} from "../services/ai.service.js";

const sanitizeChannel = (channel = {}) => ({
  id: String(channel?.id || "").trim().slice(0, 60),
  name: String(channel?.name || "").trim().slice(0, 60),
  type: channel?.type === "private" ? "private" : "public",
});

const sanitizeMessages = (messages = []) =>
  Array.isArray(messages)
    ? messages.slice(-40).map((message) => ({
        user: String(message?.user || message?.userName || "Unknown user").trim().slice(0, 40),
        text: String(message?.text || "").trim().slice(0, 800),
        createdAt: String(message?.createdAt || message?.created_at || "").trim().slice(0, 40),
      }))
    : [];

export const getChannelNameSuggestions = async (req, res) => {
  try {
    const prompt = String(req.body?.prompt || "").trim().slice(0, 120);
    const description = String(req.body?.description || "").trim().slice(0, 300);
    const channelType = req.body?.channelType === "private" ? "private" : "public";

    if (!prompt && !description) {
      return res.status(400).json({
        message: "Add a channel idea or description first",
      });
    }

    const result = await generateChannelSuggestions({
      prompt,
      description,
      channelType,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error getting channel suggestions:", error);
    return res.status(500).json({
      message: "Failed to generate channel suggestions",
    });
  }
};

export const getAssistantAnswer = async (req, res) => {
  try {
    const question = String(req.body?.question || "").trim().slice(0, 280);
    const channel = sanitizeChannel(req.body?.channel);
    const messages = sanitizeMessages(req.body?.messages);

    if (!question) {
      return res.status(400).json({ message: "Question is required" });
    }

    const result = await askChannelAssistant({ question, channel, messages });
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error getting assistant answer:", error);
    return res.status(500).json({ message: "Failed to get assistant answer" });
  }
};

export const getCatchUp = async (req, res) => {
  try {
    const channel = sanitizeChannel(req.body?.channel);
    const messages = sanitizeMessages(req.body?.messages);

    const result = await getChannelCatchUp({ channel, messages });
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error getting catch up:", error);
    return res.status(500).json({ message: "Failed to generate catch up" });
  }
};

export const getRewrite = async (req, res) => {
  try {
    const channel = sanitizeChannel(req.body?.channel);
    const messages = sanitizeMessages(req.body?.messages);
    const draft = String(req.body?.draft || "").trim().slice(0, 1600);
    const mode = String(req.body?.mode || "clearer").trim().slice(0, 40);

    if (!draft) {
      return res.status(400).json({ message: "Draft text is required" });
    }

    const result = await rewriteChannelMessage({ channel, messages, draft, mode });
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error rewriting message:", error);
    return res.status(500).json({ message: "Failed to rewrite message" });
  }
};

export const getInsights = async (req, res) => {
  try {
    const channel = sanitizeChannel(req.body?.channel);
    const messages = sanitizeMessages(req.body?.messages);

    const result = await extractChannelInsights({ channel, messages });
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error getting channel insights:", error);
    return res.status(500).json({ message: "Failed to extract channel insights" });
  }
};

export const getCallRecap = async (req, res) => {
  try {
    const callId = String(req.body?.callId || "").trim().slice(0, 100);
    const channelName = String(req.body?.channelName || "").trim().slice(0, 80);
    const notes = String(req.body?.notes || "").trim().slice(0, 4000);

    if (!callId && !notes) {
      return res.status(400).json({ message: "Call details are required" });
    }

    const result = await generateCallRecap({ callId, channelName, notes });
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error generating call recap:", error);
    return res.status(500).json({ message: "Failed to generate call recap" });
  }
};
