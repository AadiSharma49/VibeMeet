import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { useChatContext } from "stream-chat-react";

import * as Sentry from "@sentry/react";
import { CircleIcon } from "lucide-react";

const UsersList = ({ activeChannel, onSelectChannel }) => {
  const { client } = useChatContext();

  const fetchUsers = useCallback(async () => {
    if (!client?.user) return;

    const response = await client.queryUsers(
      { id: { $ne: client.user.id } },
      { name: 1 },
      { limit: 20 }
    );

    const usersOnly = response.users.filter(
      (user) => !user.id.startsWith("recording-") && user.allow_direct_messages !== false
    );

    return usersOnly;
  }, [client]);

  const {
    data: users = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["users-list", client?.user?.id],
    queryFn: fetchUsers,
    enabled: !!client?.user,
    staleTime: 1000 * 60 * 5,
  });

  const startDirectMessage = async (targetUser) => {
    if (!targetUser || !client?.user) return;

    try {
      const channelId = [client.user.id, targetUser.id].sort().join("-").slice(0, 64);
      const channel = client.channel("messaging", channelId, {
        members: [client.user.id, targetUser.id],
      });
      await channel.watch();
      if (onSelectChannel) {
        onSelectChannel(channel);
      }
    } catch (error) {
      console.log("Error creating DM", error),
        Sentry.captureException(error, {
          tags: { component: "UsersList" },
          extra: {
            context: "create_direct_message",
            targetUserId: targetUser?.id,
          },
        });
    }
  };

  if (isLoading) return <p className="text-sm text-neutral-500 px-2 py-3">Loading users...</p>;
  if (isError) return <p className="text-sm text-neutral-500 px-2 py-3">Failed to load users</p>;
  if (!users.length) return <p className="text-sm text-neutral-500 px-2 py-3">No other users found</p>;

  return (
    <div className="space-y-1">
      {users.map((user) => {
        const channelId = [client.user.id, user.id].sort().join("-").slice(0, 64);
        const channel = client.channel("messaging", channelId, {
          members: [client.user.id, user.id],
        });
        const unreadCount = channel.countUnread();
        const isActive = activeChannel && activeChannel.id === channelId;

        return (
          <button
            key={user.id}
            onClick={() => startDirectMessage(user)}
            className={`w-full flex items-center gap-3 text-left px-3 py-2 rounded-lg transition-all duration-200 text-sm cursor-pointer ${
              isActive
                ? "bg-neutral-700 text-neutral-100 border border-neutral-600/50"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50"
            }`}
          >
            <div className="flex items-center gap-3 w-full min-w-0">
              <div className="relative">
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.name || user.id}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center">
                    <span className="text-xs font-semibold text-neutral-100">
                      {(user.name || user.id).charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}

                <CircleIcon
                  className={`w-2 h-2 absolute -bottom-0.5 -right-0.5 ${
                    user.online ? "text-green-500 fill-green-500" : "text-gray-400 fill-gray-400"
                  }`}
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{user.name || user.id}</p>
                <p className="text-xs text-neutral-500 truncate">
                  {user.online ? "Online" : "Offline"}
                </p>
              </div>

              {unreadCount > 0 && (
                <span className="flex items-center justify-center ml-2 min-w-5 h-5 px-1 text-[11px] rounded-full bg-red-500 text-white">
                  {unreadCount}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default UsersList;
