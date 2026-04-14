import { useState } from "react";
import { useChatContext } from "stream-chat-react";
import { Search, X, User, MessageSquare } from "lucide-react";
import { searchUsers } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

const UserSearchModal = ({ isOpen, onClose, onSelectUser }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const { client } = useChatContext();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["user-search", searchQuery],
    queryFn: () => searchUsers(searchQuery),
    enabled: searchQuery.length >= 2,
    staleTime: 1000 * 60, // 1 minute
  });
  
  // ✅ FIX: Ensure users is always array
  const safeUsers = Array.isArray(users) ? users : [];

  const handleStartChat = async (targetUser) => {
    if (!targetUser || !client?.user) return;

    try {
      const channelId = [client.user.id, targetUser.id].sort().join("-").slice(0, 64);
      const channel = client.channel("messaging", channelId, {
        members: [client.user.id, targetUser.id],
      });
      await channel.watch();
      if (onSelectUser) {
        onSelectUser(channel);
      }
      onClose();
    } catch (error) {
      console.error("Error creating DM:", error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "online": return "bg-green-500";
      case "dnd": return "bg-red-500";
      case "sleep": return "bg-blue-400";
      case "invisible": return "bg-gray-400";
      default: return "bg-gray-400";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "online": return "Online";
      case "dnd": return "Do Not Disturb";
      case "sleep": return "Sleep";
      case "invisible": return "Invisible";
      default: return "Offline";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-neutral-800/80 bg-neutral-900/95 shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-800/70 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">Search</p>
            <h2 className="mt-1 text-xl font-semibold text-neutral-100">Find Users</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-neutral-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or username..."
              className="w-full rounded-2xl border border-neutral-800 bg-neutral-950 pl-12 pr-4 py-3 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-700 focus:outline-none"
              autoFocus
            />
          </div>

          <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-8 text-neutral-500">Searching...</div>
            ) : searchQuery.length < 2 ? (
              <div className="text-center py-8 text-neutral-500">
                <User className="mx-auto mb-3 opacity-50" size={32} />
                <p className="text-sm">Type at least 2 characters to search</p>
              </div>
            ) : safeUsers.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                <p className="text-sm">No users found</p>
              </div>
            ) : (
              safeUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-2xl border border-neutral-800/70 bg-neutral-950/70 px-4 py-3 hover:border-neutral-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {user.image ? (
                      <img
                        src={user.image}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center">
                        <User size={20} className="text-neutral-300" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-100 truncate max-w-[150px]">
                        {user.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-500">
                          @{user.username || user.id}
                        </span>
                        <span className={`w-2 h-2 rounded-full ${getStatusColor(user.presenceStatus)}`} />
                        <span className="text-[10px] text-neutral-500">
                          {getStatusLabel(user.presenceStatus)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleStartChat(user)}
                    className="shrink-0 p-2 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
                    title="Start conversation"
                  >
                    <MessageSquare size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSearchModal;