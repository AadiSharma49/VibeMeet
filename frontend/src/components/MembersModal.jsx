import { XIcon, ShieldCheck, Crown } from "lucide-react";

function MembersModal({ members, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-3xl border border-neutral-800/70 bg-neutral-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-800/60 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-neutral-100">Channel Members</h2>
            <p className="mt-1 text-sm text-neutral-500">{members.length} people in this conversation</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-neutral-400 hover:text-neutral-100">
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 max-h-96 overflow-y-auto space-y-3">
          {members.map((member) => {
            const memberUser = member.user || {};
            const role = member.role || member.channel_role;
            const isOwner = role === "owner" || role === "channel_owner";

            return (
              <div
                key={memberUser.id}
                className="flex items-center gap-3 rounded-2xl border border-neutral-800/70 bg-neutral-950/70 px-4 py-3"
              >
                {memberUser?.image ? (
                  <img
                    src={memberUser.image}
                    alt={memberUser.name || memberUser.id}
                    className="size-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="size-10 rounded-full bg-neutral-700 flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {(memberUser.name || memberUser.id).charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-100">
                    {memberUser.name || memberUser.id}
                  </p>
                  <p className="truncate text-xs text-neutral-500">
                    {memberUser.online ? "Online now" : memberUser.id}
                  </p>
                </div>

                <div className="shrink-0">
                  {isOwner ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-300">
                      <Crown size={12} />
                      Owner
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-neutral-800 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                      <ShieldCheck size={12} />
                      Member
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default MembersModal;
