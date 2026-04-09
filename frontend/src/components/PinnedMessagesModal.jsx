import { XIcon, PinIcon } from "lucide-react";

function PinnedMessagesModal({ pinnedMessages, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-neutral-800/70 bg-neutral-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-800/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-yellow-500/15 p-2 text-yellow-300">
              <PinIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-neutral-100">Pinned Messages</h2>
              <p className="mt-1 text-sm text-neutral-500">Important messages saved in this channel</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-neutral-400 hover:text-neutral-100">
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto space-y-3">
          {pinnedMessages.map((msg) => (
            <div
              key={msg.id}
              className="rounded-2xl border border-neutral-800/70 bg-neutral-950/70 px-4 py-4"
            >
              <div className="flex items-center gap-3">
                {msg.user?.image ? (
                  <img
                    src={msg.user.image}
                    alt={msg.user.name || msg.user.id}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-neutral-700 flex items-center justify-center text-white text-sm font-semibold">
                    {(msg.user?.name || msg.user?.id || "U").charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-100">
                    {msg.user?.name || msg.user?.id || "Unknown user"}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {msg.created_at
                      ? new Date(msg.created_at).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Pinned message"}
                  </p>
                </div>
              </div>

              <div className="mt-3 text-sm text-neutral-200 whitespace-pre-wrap break-words">
                {msg.text || "Pinned attachment"}
              </div>
            </div>
          ))}

          {pinnedMessages.length === 0 && (
            <div className="rounded-2xl border border-dashed border-neutral-800 px-6 py-10 text-center text-neutral-500">
              No pinned messages yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PinnedMessagesModal;
