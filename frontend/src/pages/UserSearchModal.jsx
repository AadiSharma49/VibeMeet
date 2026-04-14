import { useState } from "react";
import { useChatContext } from "stream-chat-react";
import { Search, X, User, MessageSquare, Users } from "lucide-react";
import { searchUsers } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";

export default UserSearchModal;

const UserSearchModal = ({ isOpen, onClose, onSelectUser }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const { client } = useChatContext();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["user-search", searchQuery],
    queryFn: () => searchUsers(searchQuery),
    enabled: searchQuery.length >= 2,
    staleTime: 1000 * 60, // 1 minute
  });

  const handleStartChat = async (targetUser) => {
    if (!targetUser || !client?.user) return;

    try {
      toast.loading("Starting chat...");
      
      const channelId = [client.user.id, targetUser.id].sort().join("-").slice(0, 64);
      const channel = client.channel("messaging", channelId, {
        members: [client.user.id, targetUser.id],
      });
      
      await channel.watch();
      
      toast.success("Chat started!");
      
      if (onSelectUser) {
        onSelectUser(channel);
      }
      onClose();
    } catch (error) {
      console.error("Error creating DM:", error);
      toast.error("Failed to start chat");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-neutral-800/80 bg-neutral-900/95 shadow-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between border-b border-neutral-800/70 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">Find People</p>
            <h2 className="mt-1 text-xl font-semibold text-neutral-100">Search Users</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-neutral-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or username..."
              className="w-full rounded-2xl border border-neutral-800 bg-neutral-950 pl-12 pr-4 py-3 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600/30"
              autoFocus
            />
          </div>

          <div className="mt-6 max-h-96 overflow-y-auto space-y-2">
            {isLoading ? (
              <div className="text-center py-12 text-neutral-500 text-sm">Searching...</div>
            ) : searchQuery.length < 2 ? (
              <div className="text-center py-12 text-neutral-500">
                <Users className="mx-auto mb-3 h-12 w-12 opacity-50" />
                <p className="text-sm">Type 2+ characters to find users</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-neutral-500">
                <User className="mx-auto mb-3 h-12 w-12 opacity-50" />
                <p className="text-sm">No users found</p>
              </div>
            ) : (
              users.map((user) => (
                <div
                  key={user._id || user.id}
                  className="group flex items-center justify-between rounded-2xl border border-neutral-800/70 bg-neutral-950/70 px-4 py-3 hover:border-neutral-700 transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    {user.image ? (
                      <img
                        src={user.image}
                        alt={user.name}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-neutral-700"
                      />
                    ) : (
                      <div className="flex w-12 h-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                        <span className="text-sm font-bold text-white">
                          {user.name?.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-white text-sm">
                        {user.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-400">
                          @{user.username || user.id?.slice(-8)}
                        </span>
                        <span 
                          className={`h-2 w-2 rounded-full ${getStatusColor(user.presenceStatus)}`}
                          title={getStatusLabel(user.presenceStatus)}
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleStartChat(user)}
                    className="rounded-full p-2 text-neutral-400 group-hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100"
                    title="Start messaging"
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
