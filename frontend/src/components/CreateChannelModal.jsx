import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { AlertCircleIcon, HashIcon, LockIcon, SparklesIcon, UsersIcon, XIcon } from "lucide-react";
import { getChannelNameSuggestions } from "@/lib/api";

const CreateChannelModal = ({ isOpen, onClose, chatClient, setActiveChannel, setSearchParams, onChannelCreated }) => {
  const [channelName, setChannelName] = useState("");
  const [channelType, setChannelType] = useState("public");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiHint, setAiHint] = useState("");

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

  useEffect(() => {
    if (channelType === "public") {
      setSelectedMembers(users.map((u) => u.id));
    } else {
      setSelectedMembers([]);
    }
  }, [channelType, users]);

  useEffect(() => {
    if (!isOpen) {
      setAiSuggestions([]);
      setAiHint("");
      setIsSuggesting(false);
    }
  }, [isOpen]);

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

  const handleSuggestNames = async () => {
    const prompt = channelName.trim();
    const nextDescription = description.trim();

    if (!prompt && !nextDescription) {
      setAiHint("Add a rough idea or short description first.");
      return;
    }

    setIsSuggesting(true);
    setAiHint("");

    try {
      const response = await getChannelNameSuggestions({
        prompt,
        description: nextDescription,
        channelType,
      });

      const nextSuggestions = response?.suggestions || [];
      setAiSuggestions(nextSuggestions);
      setAiHint(
        response?.source === "openai"
          ? "AI suggestions are ready."
          : response?.meta?.message || "Showing smart fallback suggestions right now."
      );
    } catch (requestError) {
      console.error("Failed to get channel suggestions:", requestError);
      setAiSuggestions([]);
      setAiHint(requestError?.response?.data?.message || "Could not generate suggestions right now.");
    } finally {
      setIsSuggesting(false);
    }
  };

  const applySuggestion = (suggestion) => {
    setChannelName(suggestion.name);
    setDescription(suggestion.description || "");
    setError(validateChannelName(suggestion.name));
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
      if (onChannelCreated) {
        await onChannelCreated(channel);
      }

      toast.success(`Channel "${channelName}" created successfully!`);
      setChannelName("");
      setDescription("");
      setChannelType("public");
      setSelectedMembers([]);
      setAiSuggestions([]);
      setAiHint("");
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
        <div className="flex items-center justify-between p-6 border-b border-neutral-800/50 sticky top-0 bg-neutral-900">
          <h2 className="text-lg font-bold text-neutral-100">Create a Channel</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-100 transition-colors p-1 cursor-pointer"
          >
            <XIcon size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg animate-slide-down">
              <AlertCircleIcon size={18} className="text-red-400 shrink-0" />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-medium text-neutral-300">Channel Name</label>
              <button
                type="button"
                onClick={handleSuggestNames}
                disabled={isSuggesting}
                className="inline-flex items-center gap-2 rounded-lg border border-neutral-700/60 bg-neutral-800/60 px-3 py-1.5 text-xs font-medium text-neutral-200 transition-all hover:border-neutral-500 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <SparklesIcon size={14} />
                {isSuggesting ? "Thinking..." : "Suggest with AI"}
              </button>
            </div>
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
            {aiHint ? <p className="text-xs text-neutral-500">{aiHint}</p> : null}
            {aiSuggestions.length > 0 && (
              <div className="space-y-2 rounded-xl border border-neutral-800/60 bg-neutral-950/60 p-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  <SparklesIcon size={14} />
                  Suggested Names
                </div>
                <div className="space-y-2">
                  {aiSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.slug}
                      type="button"
                      onClick={() => applySuggestion(suggestion)}
                      className="w-full rounded-xl border border-neutral-800/70 bg-neutral-900/70 px-3 py-3 text-left transition-all hover:border-neutral-600 hover:bg-neutral-900"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-neutral-100">{suggestion.name}</p>
                          <p className="text-xs text-neutral-500">#{suggestion.slug}</p>
                        </div>
                        <span className="rounded-full bg-neutral-800 px-2 py-1 text-[11px] text-neutral-300">
                          Use
                        </span>
                      </div>
                      {suggestion.reason ? (
                        <p className="mt-2 text-xs leading-5 text-neutral-400">{suggestion.reason}</p>
                      ) : null}
                      {suggestion.description ? (
                        <p className="mt-2 text-xs leading-5 text-neutral-500">
                          Description: {suggestion.description}
                        </p>
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

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
