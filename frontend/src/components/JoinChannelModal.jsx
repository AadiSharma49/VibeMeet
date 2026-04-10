import { useState } from "react";
import toast from "react-hot-toast";
import { KeyRoundIcon, SendIcon, X } from "lucide-react";
import { joinChannelByPasscode } from "@/lib/api";

const normalizePasscode = (value = "") =>
  String(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);

const JoinChannelModal = ({ isOpen, onClose, chatClient, onJoinedChannel }) => {
  const [passcode, setPasscode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleJoin = async (event) => {
    event.preventDefault();

    const normalizedPasscode = normalizePasscode(passcode);

    if (!normalizedPasscode || !chatClient?.user?.id) {
      setError("Enter a valid join passcode.");
      return;
    }

    setIsJoining(true);
    setError("");

    try {
      const response = await joinChannelByPasscode({
        passcode: normalizedPasscode,
      });

      if (response?.status === "requested") {
        toast.success(`Join request sent for #${response.channelName || response.channelId}`);
        setPasscode("");
        onClose();
        return;
      }

      toast.success(`Joined #${response.channelName || response.channelId}`);
      setPasscode("");
      onClose();
      await onJoinedChannel?.(response.channelId);
    } catch (joinError) {
      console.error("Failed to join channel:", joinError);
      setError(joinError?.response?.data?.message || joinError?.message || "Failed to join with this passcode.");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-neutral-800/80 bg-neutral-900/95 shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-800/70 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">Join Channel</p>
            <h2 className="mt-1 text-xl font-semibold text-neutral-100">Enter join passcode</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-neutral-100"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleJoin} className="space-y-5 px-6 py-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300">Passcode</label>
            <div className="flex items-center gap-3 rounded-2xl border border-neutral-800 bg-neutral-950 px-4 py-3">
              <KeyRoundIcon size={16} className="text-neutral-500" />
              <input
                value={passcode}
                onChange={(event) => {
                  setPasscode(normalizePasscode(event.target.value));
                }}
                placeholder="e.g. A1B2C3D4"
                className="flex-1 bg-transparent text-sm uppercase tracking-[0.25em] text-neutral-100 placeholder:normal-case placeholder:tracking-normal placeholder:text-neutral-600 focus:outline-none"
              />
            </div>
            <p className="text-xs text-neutral-500">
              Public channels let you join instantly. Private channels send a request to the owner for approval.
            </p>
            {error ? <p className="text-xs text-red-400">{error}</p> : null}
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-neutral-800 bg-neutral-950 px-4 py-2 text-sm font-semibold text-neutral-300 transition hover:border-neutral-700 hover:text-neutral-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isJoining}
              className="inline-flex items-center gap-2 rounded-2xl bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <SendIcon size={16} />
              {isJoining ? "Working..." : "Continue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinChannelModal;
