import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { CheckIcon, CopyIcon, RefreshCcwIcon, XIcon } from "lucide-react";

const createJoinPasscode = () =>
  Math.random()
    .toString(36)
    .slice(2, 10)
    .toUpperCase();

const ChannelPasscodeModal = ({ channel, onClose }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeRequestId, setActiveRequestId] = useState("");
  const [currentPasscode, setCurrentPasscode] = useState("");
  const passcode = useMemo(() => currentPasscode || channel?.data?.join_passcode || "", [channel, currentPasscode]);

  useEffect(() => {
    setCurrentPasscode(channel?.data?.join_passcode || "");
    setPendingRequests(Array.isArray(channel?.data?.pending_join_requests) ? channel.data.pending_join_requests : []);
  }, [channel]);

  const handleCopy = async () => {
    if (!passcode) return;

    try {
      await navigator.clipboard.writeText(passcode);
      toast.success("Passcode copied");
    } catch (copyError) {
      console.error("Failed to copy passcode:", copyError);
      toast.error("Could not copy the passcode");
    }
  };

  const handleRegenerate = async () => {
    if (!channel) return;

    const confirmed = window.confirm("Generate a new passcode? The old one will stop working.");
    if (!confirmed) return;

    setIsRefreshing(true);

    try {
      const nextPasscode = createJoinPasscode();
      await channel.updatePartial({
        set: {
          join_passcode: nextPasscode,
        },
      });
      await channel.watch();
      setCurrentPasscode(nextPasscode);
      toast.success("Passcode updated");
    } catch (updateError) {
      console.error("Failed to regenerate passcode:", updateError);
      toast.error(updateError?.message || "Failed to update passcode");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleApprove = async (requestUserId) => {
    if (!channel || !requestUserId) return;

    setActiveRequestId(requestUserId);

    try {
      const nextRequests = pendingRequests.filter((request) => request.userId !== requestUserId);
      await channel.addMembers([requestUserId]);
      await channel.updatePartial({
        set: {
          pending_join_requests: nextRequests,
        },
      });
      await channel.watch();
      setPendingRequests(nextRequests);
      toast.success("Join request approved");
    } catch (approvalError) {
      console.error("Failed to approve join request:", approvalError);
      toast.error(approvalError?.message || "Failed to approve request");
    } finally {
      setActiveRequestId("");
    }
  };

  const handleDecline = async (requestUserId) => {
    if (!channel || !requestUserId) return;

    setActiveRequestId(requestUserId);

    try {
      const nextRequests = pendingRequests.filter((request) => request.userId !== requestUserId);
      await channel.updatePartial({
        set: {
          pending_join_requests: nextRequests,
        },
      });
      await channel.watch();
      setPendingRequests(nextRequests);
      toast.success("Join request removed");
    } catch (declineError) {
      console.error("Failed to remove join request:", declineError);
      toast.error(declineError?.message || "Failed to update requests");
    } finally {
      setActiveRequestId("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-neutral-800/80 bg-neutral-900/95 shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-800/70 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">Channel Access</p>
            <h2 className="mt-1 text-xl font-semibold text-neutral-100">Share this passcode</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-neutral-100"
          >
            <XIcon size={18} />
          </button>
        </div>

        <div className="space-y-5 px-6 py-6">
          <div className="rounded-3xl border border-neutral-800 bg-neutral-950 px-5 py-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Join Passcode</p>
            <p className="mt-3 text-3xl font-black tracking-[0.4em] text-neutral-100">{passcode || "--------"}</p>
            <p className="mt-3 text-sm text-neutral-500">
              Share this only with the people who should access {channel?.data?.name || channel?.id}.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-800/70 bg-neutral-950/70 px-4 py-4 text-sm text-neutral-400">
            <p>Public channels: people join instantly with this passcode.</p>
            <p className="mt-2">Private channels: people can send a join request with this passcode, and you approve by inviting them.</p>
          </div>

          {channel?.data?.private ? (
            <div className="rounded-2xl border border-neutral-800/70 bg-neutral-950/70 px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-neutral-100">Pending join requests</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    People who used this passcode for private access will show up here.
                  </p>
                </div>
                <span className="rounded-full bg-neutral-800 px-2.5 py-1 text-xs font-semibold text-neutral-300">
                  {pendingRequests.length}
                </span>
              </div>

              {pendingRequests.length === 0 ? (
                <p className="mt-4 text-sm text-neutral-500">No private join requests yet.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {pendingRequests.map((request) => (
                    <div
                      key={request.userId}
                      className="flex items-center gap-3 rounded-2xl border border-neutral-800 bg-neutral-900/80 px-3 py-3"
                    >
                      {request.image ? (
                        <img
                          src={request.image}
                          alt={request.name || request.userId}
                          className="size-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex size-10 items-center justify-center rounded-full bg-neutral-800 text-sm font-semibold text-neutral-200">
                          {(request.name || request.userId || "?").charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-neutral-100">{request.name || request.userId}</p>
                        <p className="truncate text-xs text-neutral-500">
                          {request.requestedAt ? new Date(request.requestedAt).toLocaleString() : request.userId}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleApprove(request.userId)}
                          disabled={activeRequestId === request.userId}
                          className="inline-flex items-center gap-1 rounded-xl bg-neutral-100 px-3 py-2 text-xs font-semibold text-neutral-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <CheckIcon size={14} />
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDecline(request.userId)}
                          disabled={activeRequestId === request.userId}
                          className="rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-semibold text-neutral-300 transition hover:border-neutral-700 hover:text-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 rounded-2xl border border-neutral-800 bg-neutral-950 px-4 py-2 text-sm font-semibold text-neutral-300 transition hover:border-neutral-700 hover:text-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCcwIcon size={16} />
              {isRefreshing ? "Updating..." : "Regenerate"}
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-2 rounded-2xl bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-white"
            >
              <CopyIcon size={16} />
              Copy Passcode
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChannelPasscodeModal;
