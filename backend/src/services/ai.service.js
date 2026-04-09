import { ENV } from "../config/env.js";

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "for",
  "from",
  "how",
  "in",
  "into",
  "is",
  "it",
  "of",
  "on",
  "or",
  "our",
  "that",
  "the",
  "this",
  "to",
  "we",
  "with",
]);

const clamp = (value = "", limit = 280) => String(value || "").trim().slice(0, limit);

const normalizeChannelId = (value = "") =>
  value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 22);

const titleCase = (value = "") =>
  value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const buildReason = ({ typeLabel, keywords, description }) => {
  if (description) {
    return `Fits this ${typeLabel} channel because it reflects ${description.toLowerCase()}.`;
  }

  if (keywords.length >= 2) {
    return `Fits this ${typeLabel} channel because it combines ${keywords[0]} and ${keywords[1]}.`;
  }

  if (keywords.length === 1) {
    return `Fits this ${typeLabel} channel because it centers the conversation on ${keywords[0]}.`;
  }

  return `Fits this ${typeLabel} channel because it is clear and easy for teammates to understand.`;
};

const buildDescription = ({ slug = "", keywords, description, channelType = "public" }) => {
  if (description) {
    return description.slice(0, 120);
  }

  const readableName = titleCase(slug).toLowerCase();

  if (keywords.length >= 2) {
    return `Use this ${channelType} channel for ${keywords[0]}, ${keywords[1]}, and related updates.`;
  }

  if (keywords.length === 1) {
    return `Use this ${channelType} channel for ${keywords[0]} conversations and updates.`;
  }

  return `Use this ${channelType} channel for ${readableName || "team"} conversations and quick coordination.`;
};

const extractKeywords = ({ prompt = "", description = "" }) => {
  const source = `${prompt} ${description}`.toLowerCase();

  const words = source
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 3 && !STOP_WORDS.has(word));

  return [...new Set(words)].slice(0, 6);
};

const dedupeSuggestions = (suggestions = []) => {
  const seen = new Set();

  return suggestions.filter((suggestion) => {
    if (!suggestion?.name || !suggestion?.slug) return false;
    if (seen.has(suggestion.slug)) return false;
    seen.add(suggestion.slug);
    return true;
  });
};

const getAIErrorMeta = (error) => {
  const message = String(error?.message || "");

  if (message.includes("insufficient_quota")) {
    return {
      code: "insufficient_quota",
      message: "OpenAI quota is exhausted. Using fallback results for now.",
    };
  }

  if (message.includes("429")) {
    return {
      code: "rate_limited",
      message: "OpenAI is rate limiting requests right now. Using fallback results.",
    };
  }

  return {
    code: "ai_unavailable",
    message: "AI is temporarily unavailable. Using fallback results.",
  };
};

const baseMeta = {
  ok: { code: "ok", message: "OpenAI completed successfully." },
  missingApiKey: {
    code: "missing_api_key",
    message: "OpenAI API key is not configured. Using fallback results.",
  },
};

const shapeMessages = (messages = []) =>
  messages
    .filter(Boolean)
    .slice(-40)
    .map((message) => ({
      user: clamp(message.user || message.userName || "Unknown user", 40),
      text: clamp(message.text || "", 600),
      createdAt: clamp(message.createdAt || message.created_at || "", 40),
    }))
    .filter((message) => message.text);

const serializeMessages = (messages = []) => {
  const shapedMessages = shapeMessages(messages);

  if (!shapedMessages.length) {
    return "No recent messages were provided.";
  }

  return shapedMessages
    .map((message, index) => `${index + 1}. [${message.createdAt || "unknown"}] ${message.user}: ${message.text}`)
    .join("\n");
};

const summarizeRecentMessages = (messages = [], limit = 6) =>
  shapeMessages(messages)
    .slice(-limit)
    .map((message) => `${message.user}: ${message.text}`)
    .join(" ");

const extractQuestions = (messages = []) =>
  shapeMessages(messages)
    .filter((message) => message.text.includes("?"))
    .slice(-4)
    .map((message) => message.text)
    .filter(Boolean);

const extractActionItemsFallback = (messages = []) =>
  shapeMessages(messages)
    .filter((message) => /\b(todo|follow up|follow-up|action item|need to|should)\b/i.test(message.text))
    .slice(-4)
    .map((message) => ({
      task: clamp(message.text, 120),
      owner: message.user,
      status: "open",
    }));

const extractDecisionFallback = (messages = []) =>
  shapeMessages(messages)
    .filter((message) => /\b(decided|decision|ship it|let's go with|we will|final)\b/i.test(message.text))
    .slice(-3)
    .map((message) => ({
      title: clamp(message.text, 120),
      confidence: "medium",
    }));

const buildFallbackSuggestions = ({ prompt = "", description = "", channelType = "public" }) => {
  const typeLabel = channelType === "private" ? "private" : "public";
  const keywords = extractKeywords({ prompt, description });
  const seedWords = keywords.length ? keywords : ["team", "focus", "updates"];

  const combos = [
    seedWords.slice(0, 2).join("-"),
    [seedWords[0], "hub"].filter(Boolean).join("-"),
    [seedWords[0], "sync"].filter(Boolean).join("-"),
    [seedWords[0], seedWords[1], "room"].filter(Boolean).join("-"),
    [seedWords[0], typeLabel === "private" ? "circle" : "space"].filter(Boolean).join("-"),
  ];

  const suggestions = combos
    .map((slug) => normalizeChannelId(slug))
    .filter(Boolean)
    .map((slug) => ({
      name: titleCase(slug),
      slug,
      reason: buildReason({ typeLabel, keywords, description }),
      description: buildDescription({ slug, keywords, description, channelType }),
    }));

  return dedupeSuggestions(suggestions).slice(0, 4);
};

const buildFallbackAssistant = ({ question = "", messages = [], channelName = "this channel" }) => {
  const recent = summarizeRecentMessages(messages, 5);

  return {
    answer: recent
      ? `From ${channelName}, here is the quick read: ${clamp(recent, 420)}`
      : `I do not have enough recent context yet for ${channelName}. Try again after a few messages.`,
    suggestedReplies: [
      "Sounds good. I'll take the next step.",
      "Can you confirm the deadline and owner?",
      "Let's capture this as an action item.",
    ],
    question: clamp(question, 160),
  };
};

const buildFallbackCatchUp = ({ messages = [], channelName = "this channel" }) => ({
  summary: summarizeRecentMessages(messages, 8) || `No recent updates found in ${channelName}.`,
  decisions: extractDecisionFallback(messages),
  actionItems: extractActionItemsFallback(messages),
  unansweredQuestions: extractQuestions(messages),
});

const buildFallbackRewrite = ({ draft = "", mode = "clearer" }) => {
  const trimmedDraft = clamp(draft, 1000);

  if (!trimmedDraft) {
    return { text: "" };
  }

  if (mode === "shorter") {
    return { text: trimmedDraft.split(/[.!?]/)[0]?.trim() || trimmedDraft };
  }

  if (mode === "professional") {
    return { text: `Hi team, ${trimmedDraft.charAt(0).toLowerCase()}${trimmedDraft.slice(1)}` };
  }

  if (mode === "announcement") {
    return { text: `Announcement: ${trimmedDraft}` };
  }

  return { text: trimmedDraft };
};

const buildFallbackInsights = ({ messages = [] }) => ({
  decisions: extractDecisionFallback(messages),
  actionItems: extractActionItemsFallback(messages),
  risks: extractQuestions(messages).slice(0, 3),
});

const buildFallbackCallRecap = ({ callId = "", notes = "" }) => ({
  summary: clamp(notes || `Discussion recap for call ${callId}.`, 500),
  actionItems: notes
    ? notes
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(0, 5)
        .map((line) => ({ task: clamp(line, 120), owner: "TBD", status: "open" }))
    : [],
  followUpMessage: `Call recap for ${callId}: ${clamp(notes || "No notes were provided.", 280)}`,
});

const extractOutputText = (responseBody) => {
  if (typeof responseBody?.output_text === "string" && responseBody.output_text.trim()) {
    return responseBody.output_text.trim();
  }

  const content = responseBody?.output
    ?.flatMap((item) => item?.content || [])
    ?.find((entry) => entry?.type === "output_text" && entry?.text);

  return content?.text?.trim() || "";
};

const requestOpenAIJson = async ({ instruction, payload, schemaName, schema, maxOutputTokens = 450 }) => {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ENV.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: ENV.OPENAI_MODEL,
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: instruction }],
        },
        {
          role: "user",
          content: [{ type: "input_text", text: JSON.stringify(payload) }],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: schemaName,
          strict: true,
          schema,
        },
      },
      max_output_tokens: maxOutputTokens,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${errorText}`);
  }

  const responseBody = await response.json();
  const outputText = extractOutputText(responseBody);

  if (!outputText) {
    throw new Error("OpenAI returned an empty response");
  }

  return JSON.parse(outputText);
};

const withAIFallback = async ({ fallbackData, run }) => {
  if (!ENV.OPENAI_API_KEY) {
    return {
      ...fallbackData,
      source: "fallback",
      meta: baseMeta.missingApiKey,
    };
  }

  try {
    const aiData = await run();

    return {
      ...aiData,
      source: "openai",
      meta: baseMeta.ok,
    };
  } catch (error) {
    const meta = getAIErrorMeta(error);
    console.warn(`[ai] fallback: ${meta.code}`);

    return {
      ...fallbackData,
      source: "fallback",
      meta,
    };
  }
};

export const generateChannelSuggestions = async ({ prompt = "", description = "", channelType = "public" }) => {
  const fallbackSuggestions = buildFallbackSuggestions({ prompt, description, channelType });

  return withAIFallback({
    fallbackData: { suggestions: fallbackSuggestions },
    run: async () => {
      const parsed = await requestOpenAIJson({
        instruction:
          "You generate channel naming suggestions for a team collaboration app. Return practical, memorable names and short descriptions. JSON only.",
        payload: {
          task: "Suggest channel names",
          channelType,
          prompt,
          description,
        },
        schemaName: "channel_name_suggestions",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            suggestions: {
              type: "array",
              minItems: 1,
              maxItems: 4,
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  name: { type: "string" },
                  slug: { type: "string" },
                  reason: { type: "string" },
                  description: { type: "string" },
                },
                required: ["name", "slug", "reason", "description"],
              },
            },
          },
          required: ["suggestions"],
        },
        maxOutputTokens: 260,
      });

      return {
        suggestions: dedupeSuggestions(
          (parsed?.suggestions || []).map((suggestion) => ({
            name: clamp(suggestion.name, 22),
            slug: normalizeChannelId(suggestion.slug || suggestion.name || ""),
            reason: clamp(suggestion.reason, 140),
            description: clamp(suggestion.description, 160),
          }))
        ).slice(0, 4),
      };
    },
  });
};

export const askChannelAssistant = async ({ channel = {}, messages = [], question = "" }) => {
  const fallback = buildFallbackAssistant({
    question,
    messages,
    channelName: channel?.name || channel?.id || "this channel",
  });

  return withAIFallback({
    fallbackData: fallback,
    run: async () =>
      requestOpenAIJson({
        instruction:
          "You are an AI assistant inside a team chat product. Answer using only the supplied channel context. Be concise, helpful, and actionable. JSON only.",
        payload: {
          channel,
          question,
          transcript: serializeMessages(messages),
        },
        schemaName: "channel_assistant_answer",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            answer: { type: "string" },
            suggestedReplies: {
              type: "array",
              maxItems: 3,
              items: { type: "string" },
            },
          },
          required: ["answer", "suggestedReplies"],
        },
      }),
  });
};

export const getChannelCatchUp = async ({ channel = {}, messages = [] }) => {
  const fallback = buildFallbackCatchUp({
    messages,
    channelName: channel?.name || channel?.id || "this channel",
  });

  return withAIFallback({
    fallbackData: fallback,
    run: async () =>
      requestOpenAIJson({
        instruction:
          "You summarize recent team chat activity. Return a compact catch-up with summary, decisions, action items, and unanswered questions. JSON only.",
        payload: {
          channel,
          transcript: serializeMessages(messages),
        },
        schemaName: "channel_catch_up",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            summary: { type: "string" },
            decisions: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  title: { type: "string" },
                  confidence: { type: "string" },
                },
                required: ["title", "confidence"],
              },
            },
            actionItems: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  task: { type: "string" },
                  owner: { type: "string" },
                  status: { type: "string" },
                },
                required: ["task", "owner", "status"],
              },
            },
            unansweredQuestions: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["summary", "decisions", "actionItems", "unansweredQuestions"],
        },
      }),
  });
};

export const rewriteChannelMessage = async ({ channel = {}, messages = [], draft = "", mode = "clearer" }) => {
  const fallback = buildFallbackRewrite({ draft, mode });

  return withAIFallback({
    fallbackData: fallback,
    run: async () =>
      requestOpenAIJson({
        instruction:
          "Rewrite a draft message for a team chat. Keep the meaning, improve clarity for the requested mode, and keep it ready to send. JSON only.",
        payload: {
          channel,
          mode,
          draft,
          transcript: serializeMessages(messages.slice(-10)),
        },
        schemaName: "rewritten_message",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            text: { type: "string" },
          },
          required: ["text"],
        },
        maxOutputTokens: 220,
      }),
  });
};

export const extractChannelInsights = async ({ channel = {}, messages = [] }) => {
  const fallback = buildFallbackInsights({ messages });

  return withAIFallback({
    fallbackData: fallback,
    run: async () =>
      requestOpenAIJson({
        instruction:
          "Extract important collaboration signals from a chat transcript. Focus on decisions, action items, and risks. JSON only.",
        payload: {
          channel,
          transcript: serializeMessages(messages),
        },
        schemaName: "channel_insights",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            decisions: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  title: { type: "string" },
                  confidence: { type: "string" },
                },
                required: ["title", "confidence"],
              },
            },
            actionItems: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  task: { type: "string" },
                  owner: { type: "string" },
                  status: { type: "string" },
                },
                required: ["task", "owner", "status"],
              },
            },
            risks: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["decisions", "actionItems", "risks"],
        },
      }),
  });
};

export const generateCallRecap = async ({ callId = "", channelName = "", notes = "" }) => {
  const fallback = buildFallbackCallRecap({ callId, notes });

  return withAIFallback({
    fallbackData: fallback,
    run: async () =>
      requestOpenAIJson({
        instruction:
          "Turn call notes into a concise team recap with summary, action items, and a follow-up message to post in chat. JSON only.",
        payload: {
          callId,
          channelName,
          notes,
        },
        schemaName: "call_recap",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            summary: { type: "string" },
            actionItems: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  task: { type: "string" },
                  owner: { type: "string" },
                  status: { type: "string" },
                },
                required: ["task", "owner", "status"],
              },
            },
            followUpMessage: { type: "string" },
          },
          required: ["summary", "actionItems", "followUpMessage"],
        },
      }),
  });
};
