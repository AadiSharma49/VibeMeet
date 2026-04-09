import { useEffect, useState } from "react";
import { useChatContext } from "stream-chat-react";
import { UserPlus2Icon, XIcon } from "lucide-react";
import toast from "react-hot-toast";

const InviteModal = ({ channel, onClose }) => {
  const { client } = useChatContext();

  const [users, setUsers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [error, setError] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoadingUsers(true);
      setError("");

      try {
        const members = Object.keys(channel.state?.members || {});
        const res = await client.queryUsers(
          { id: { $nin: members } },
          { name: 1 },
          { limit: 30 }
        );

        const availableUsers = res.users.filter((user) => !user.id.startsWith("recording-"));
        setUsers(availableUsers);
      } catch (fetchError) {
        console.log("Error fetching users", fetchError);
        setError("Failed to load users");
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [channel, client]);

  const handleInvite = async () => {
    if (selectedMembers.length === 0) return;

    setIsInviting(true);
    setError("");

    try {
      await channel.addMembers(selectedMembers);
      toast.success("Members invited");
      onClose();
    } catch (inviteError) {
      setError("Failed to invite users");
      console.log("Error inviting users:", inviteError);
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-3xl border border-neutral-800/70 bg-neutral-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-800/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/15 p-2 text-emerald-300">
              <UserPlus2Icon className="size-4" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-neutral-100">Invite Members</h2>
              <p className="mt-1 text-sm text-neutral-500">Add more people to this channel</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-neutral-400 hover:text-neutral-100">
            <XIcon className="size-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {isLoadingUsers && <p className="text-sm text-neutral-500">Loading users...</p>}
          {error && <p className="text-sm text-red-400">{error}</p>}
          {users.length === 0 && !isLoadingUsers && (
            <p className="text-sm text-neutral-500">No available users to invite</p>
          )}

          {users.length > 0 && (
            <div className="max-h-72 overflow-y-auto space-y-2">
              {users.map((user) => {
                const isChecked = selectedMembers.includes(user.id);

                return (
                  <label
                    key={user.id}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 cursor-pointer transition-all ${
                      isChecked
                        ? "border-emerald-500/40 bg-emerald-500/10"
                        : "border-neutral-800/70 bg-neutral-950/70 hover:border-neutral-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="accent-emerald-400"
                      value={user.id}
                      onChange={(event) => {
                        if (event.target.checked) {
                          setSelectedMembers([...selectedMembers, user.id]);
                        } else {
                          setSelectedMembers(selectedMembers.filter((id) => id !== user.id));
                        }
                      }}
                    />

                    {user.image ? (
                      <img
                        src={user.image}
                        alt={user.name || user.id}
                        className="size-9 rounded-full object-cover"
                      />
                    ) : (
                      <div className="size-9 rounded-full bg-neutral-700 flex items-center justify-center text-neutral-100 font-semibold">
                        {(user.name || user.id).charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-neutral-100">
                        {user.name || user.id}
                      </p>
                      <p className="truncate text-xs text-neutral-500">{user.id}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              className="rounded-2xl bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-200 hover:bg-neutral-700"
              onClick={onClose}
              disabled={isInviting}
            >
              Cancel
            </button>
            <button
              className="rounded-2xl bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleInvite}
              disabled={!selectedMembers.length || isInviting}
            >
              {isInviting ? "Inviting..." : "Invite"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteModal;
