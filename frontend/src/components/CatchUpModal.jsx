import { useEffect, useState } from "react";
import { CheckCircle2, HelpCircle, Loader2, Sparkles, X } from "lucide-react";
import { getChannelCatchUp } from "@/lib/api";

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

const CatchUpModal = ({ isOpen, onClose, channel, messages = [] }) => {
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const loadCatchUp = async () => {
      setIsLoading(true);

      try {
        const response = await getChannelCatchUp({
          channel: serializeChannel(channel),
          messages: serializeMessages(messages),
        });

        setResult(response);
      } catch (error) {
        setResult({
          summary: error?.response?.data?.message || "Failed to generate catch up.",
          decisions: [],
          actionItems: [],
          unansweredQuestions: [],
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadCatchUp();
  }, [isOpen, channel, messages]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-3xl border border-neutral-800/80 bg-neutral-900/95 shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-800/70 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">Catch Up</p>
            <h2 className="mt-1 text-xl font-semibold text-neutral-100">
              Recent summary for {channel?.data?.name || channel?.name || channel?.id || "this channel"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-neutral-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-neutral-400">
              <Loader2 size={20} className="mr-3 animate-spin" />
              Building your catch up...
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-3xl border border-neutral-800/70 bg-neutral-950/80 p-5">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                  <Sparkles size={14} />
                  Summary
                </div>
                <p className="text-sm leading-6 text-neutral-200 whitespace-pre-wrap">{result?.summary}</p>
                {result?.meta?.message ? <p className="mt-3 text-xs text-neutral-500">{result.meta.message}</p> : null}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-neutral-800/70 bg-neutral-950/70 p-5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Decisions</p>
                  <div className="space-y-3">
                    {result?.decisions?.length ? (
                      result.decisions.map((decision, index) => (
                        <div key={`${decision.title}-${index}`} className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-3">
                          <p className="text-sm text-neutral-100">{decision.title}</p>
                          <p className="mt-1 text-xs text-neutral-500">Confidence: {decision.confidence}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-neutral-500">No clear decisions detected yet.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-3xl border border-neutral-800/70 bg-neutral-950/70 p-5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Action Items</p>
                  <div className="space-y-3">
                    {result?.actionItems?.length ? (
                      result.actionItems.map((item, index) => (
                        <div key={`${item.task}-${index}`} className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-3">
                          <p className="text-sm text-neutral-100">{item.task}</p>
                          <p className="mt-1 text-xs text-neutral-500">
                            Owner: {item.owner || "TBD"} • Status: {item.status || "open"}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-neutral-500">No action items surfaced yet.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-neutral-800/70 bg-neutral-950/70 p-5">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                  <HelpCircle size={14} />
                  Unanswered Questions
                </div>
                <div className="space-y-2">
                  {result?.unansweredQuestions?.length ? (
                    result.unansweredQuestions.map((question, index) => (
                      <div key={`${question}-${index}`} className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-3 text-sm text-neutral-200">
                        {question}
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-neutral-400">
                      <CheckCircle2 size={16} className="text-emerald-400" />
                      Nothing urgent looks unanswered right now.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CatchUpModal;
