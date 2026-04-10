import { useState } from "react";
import { Loader2, Send, Sparkles, X } from "lucide-react";
import { askChannelAI } from "@/lib/api";

const serializeChannel = (channel) => ({
  id: channel?.id || "",
  name: channel?.data?.name || channel?.name || channel?.id || "",
  type: channel?.data?.private ? "private" : "public",
});

const serializeMessages = (messages = []) =>
  messages.slice(-30).map((message) => ({
    user: message.user?.name || message.user?.id || "Unknown user",
    text: message.text || "",
    createdAt: message.created_at || "",
  }));

const AskAIModal = ({ isOpen, onClose, channel, messages = [] }) => {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleAsk = async () => {
    if (!question.trim() || isLoading) return;

    setIsLoading(true);

    try {
      const response = await askChannelAI({
        channel: serializeChannel(channel),
        messages: serializeMessages(messages),
        question,
      });

      setResult(response);
    } catch (error) {
      setResult({
        answer: error?.response?.data?.message || "Failed to get an AI answer.",
        suggestedReplies: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl border border-neutral-800/80 bg-neutral-900/95 shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-800/70 px-6 py-5">
          <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">Ask AI</p>
              <h2 className="mt-1 text-xl font-semibold text-neutral-100">
              Ask about {channel?.data?.name || channel?.name || channel?.id || "this channel"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-neutral-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 px-6 py-6">
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="What happened here, what should I reply, what are the blockers..."
            rows={4}
            className="w-full rounded-2xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-700 focus:outline-none"
          />

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-neutral-500">AI uses the recent messages currently loaded in this channel.</p>
            <button
              onClick={handleAsk}
              disabled={!question.trim() || isLoading}
              className="inline-flex items-center gap-2 rounded-2xl bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {isLoading ? "Thinking..." : "Ask AI"}
            </button>
          </div>

          {result && (
            <div className="space-y-4 rounded-3xl border border-neutral-800/70 bg-neutral-950/80 p-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                <Sparkles size={14} />
                Answer
              </div>
              <p className="text-sm leading-6 text-neutral-200 whitespace-pre-wrap">{result.answer}</p>

              {result.suggestedReplies?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Suggested replies</p>
                  <div className="flex flex-wrap gap-2">
                    {result.suggestedReplies.map((reply) => (
                      <button
                        key={reply}
                        type="button"
                        onClick={() => setQuestion(reply)}
                        className="rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-300 transition hover:border-neutral-700 hover:text-neutral-100"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {result.meta?.message ? (
                <p className="text-xs text-neutral-500">{result.meta.message}</p>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AskAIModal;
