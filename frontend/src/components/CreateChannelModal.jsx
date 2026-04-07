import { useEffect, useState } from "react";
import { useChatContext } from "stream-chat-react";
import toast from "react-hot-toast";
import { AlertCircleIcon, HashIcon, LockIcon, UsersIcon, XIcon } from "lucide-react";

const CreateChannelModal = ({ isOpen, onClose, chatClient, setActiveChannel, setSearchParams }) => {
  const [channelName, setChannelName] = useState("");
  const [channelType, setChannelType] = useState("public");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [_, setSearchParamsLocal] = useState(null);

  // Fetch users for member selection
  useEffect(() => {
    const fetchUsers = async () => {
      if (!chatClient?.user) return;
      setLoadingUsers(true);

      try {
        const response = await chatClient.queryUsers(
          { id: { $ne: chatClient.user.id } },
          { name: 1 },
          { limit: 100 }
        );

        const usersOnly = response.users.filter((user) => !user.id.startsWith("recording-"));
        setUsers(usersOnly || []);
      } catch (error) {
        console.error("Error fetching users:", error);
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [chatClient]);

  // Auto-select all users for public channels
  useEffect(() => {
    if (channelType === "public") {
      setSelectedMembers(users.map((u) => u.id));
    } else {
      setSelectedMembers([]);
    }
  }, [channelType, users]);

  if (!isOpen) return null;

  const validateChannelName = (name) => {
    if (!name.trim()) return "Channel name is required";
    if (name.length < 3) return "Channel name must be at least 3 characters";
    if (name.length > 22) return "Channel name must be less than 22 characters";
    return "";
  };

  const handleChannelNameChange = (e) => {
    const value = e.target.value;
    setChannelName(value);
    setError(validateChannelName(value));
  };

  const handleMemberToggle = (id) => {
    if (selectedMembers.includes(id)) {
      setSelectedMembers(selectedMembers.filter((uid) => uid !== id));
    } else {
      setSelectedMembers([...selectedMembers, id]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateChannelName(channelName);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (isCreating) return;

    if (!chatClient?.user) {
      console.error("Stream Chat client not ready");
      setError("Chat connection not ready. Please wait...");
      return;
    }

    setIsCreating(true);
    setError("");

    try {
      const channelId = channelName
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-_]/g, "")
        .slice(0, 20);

      const channelData = {
        name: channelName.trim(),
        created_by_id: chatClient.user.id,
        members: [chatClient.user.id, ...selectedMembers],
      };

      if (description) channelData.description = description;

      if (channelType === "private") {
        channelData.private = true;
        channelData.visibility = "private";
      } else {
        channelData.visibility = "public";
        channelData.discoverable = true;
      }

      const channel = chatClient.channel("messaging", channelId, channelData);
      await channel.watch();

      if (setActiveChannel) {
        setActiveChannel(channel);
      }
      if (setSearchParams) {
        setSearchParams({ channel: channelId });
      }

      toast.success(`Channel "${channelName}" created successfully!`);
      setChannelName("");
      setDescription("");
      setChannelType("public");
      setSelectedMembers([]);
      onClose();
    } catch (error) {
      console.error("Error creating channel:", error);
      setError(error.message || "Failed to create channel");
      toast.error("Failed to create channel");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-800/50 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-down">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800/50 sticky top-0 bg-neutral-900">
          <h2 className="text-lg font-bold text-neutral-100">Create a Channel</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-100 transition-colors p-1 cursor-pointer"
          >
            <XIcon size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg animate-slide-down">
              <AlertCircleIcon size={18} className="text-red-400 shrink-0" />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}

          {/* Channel Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300">Channel Name</label>
            <div className="flex items-center gap-3 px-4 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg focus-within:border-neutral-600 transition-all duration-200">
              <HashIcon size={18} className="text-neutral-500" />
              <input
                type="text"
                value={channelName}
                onChange={handleChannelNameChange}
                placeholder="e.g. marketing"
                maxLength={22}
                autoFocus
                className="flex-1 bg-transparent text-neutral-100 placeholder:text-neutral-600 focus:outline-none"
              />
            </div>
            {channelName && (
              <p className="text-xs text-neutral-500">
                Channel ID: #{channelName
                  .toLowerCase()
                  .replace(/\s+/g, "-")
                  .replace(/[^a-z0-9-_]/g, "")}
              </p>
            )}
          </div>

          {/* Channel Type */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-neutral-300">Channel Type</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 bg-neutral-800/30 border border-neutral-700/50 rounded-lg hover:border-neutral-600/50 cursor-pointer transition-all duration-200 group">
                <input
                  type="radio"
                  value="public"
                  checked={channelType === "public"}
                  onChange={(e) => setChannelType(e.target.value)}
                  className="w-4 h-4 accent-neutral-100"
                />
                <div className="flex items-center gap-2 flex-1">
                  <HashIcon size={16} className="text-neutral-400 group-hover:text-neutral-300" />
                  <div>
                    <div className="text-sm font-medium text-neutral-200">Public</div>
                    <div className="text-xs text-neutral-500">Anyone can join</div>
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-neutral-800/30 border border-neutral-700/50 rounded-lg hover:border-neutral-600/50 cursor-pointer transition-all duration-200 group">
                <input
                  type="radio"
                  value="private"
                  checked={channelType === "private"}
                  onChange={(e) => setChannelType(e.target.value)}
                  className="w-4 h-4 accent-neutral-100"
                />
                <div className="flex items-center gap-2 flex-1">
                  <LockIcon size={16} className="text-neutral-400 group-hover:text-neutral-300" />
                  <div>
                    <div className="text-sm font-medium text-neutral-200">Private</div>
                    <div className="text-xs text-neutral-500">Only invited members</div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Add Members (for Private Channels) */}
          {channelType === "private" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-neutral-300">Add Members</label>
                <span className="text-xs text-neutral-500">{selectedMembers.length} selected</span>
              </div>
              
              <button
                type="button"
                onClick={() => setSelectedMembers(users.map((u) => u.id))}
                disabled={loadingUsers || users.length === 0}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-neutral-800/50 hover:bg-neutral-800 text-neutral-300 rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
              >
                <UsersIcon size={16} />
                Select Everyone
              </button>

              <div className="space-y-2 max-h-48 overflow-y-auto bg-neutral-800/20 border border-neutral-700/50 rounded-lg p-3">
                {loadingUsers ? (
                  <p className="text-center text-neutral-500 text-sm py-4">Loading users...</p>
                ) : users.length === 0 ? (
                  <p className="text-center text-neutral-500 text-sm py-4">No users found</p>
                ) : (
                  users.map((user) => (
                    <label
                      key={user.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-700/30 cursor-pointer transition-colors group"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(user.id)}
                        onChange={() => handleMemberToggle(user.id)}
                        className="w-4 h-4 accent-neutral-100 cursor-pointer"
                      />
                      {user.image ? (
                        <img
                          src={user.image}
                          alt={user.name || user.id}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-xs font-bold text-neutral-300">
                          {(user.name || user.id).charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-sm text-neutral-300 group-hover:text-neutral-100 flex-1">
                        {user.name || user.id}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this channel about?"
              rows={3}
              maxLength={200}
              className="w-full px-4 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition-all duration-200 resize-none"
            />
            <p className="text-xs text-neutral-600">{description.length}/200</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!channelName.trim() || isCreating}
              className="flex-1 px-4 py-2 bg-neutral-100 hover:bg-white text-neutral-950 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isCreating ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideDown {
          from { 
            opacity: 0; 
            transform: translateY(-20px);
          }
          to { 
            opacity: 1; 
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-slide-down {
          animation: slideDown 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </div>
  );
};

export default CreateChannelModal;