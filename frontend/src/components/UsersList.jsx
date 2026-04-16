import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { useChatContext } from "stream-chat-react";
import toast from "react-hot-toast";

import * as Sentry from "@sentry/react";
import { CircleIcon } from "lucide-react";

const UsersList = ({ activeChannel, onSelectChannel }) => {
  const { client } = useChatContext();

  const fetchUsers = useCallback(async () => {
    try {
      const response = await client.queryUsers(
        { 
          id: { $ne: client.userID },
          name: { $ne: null }
        },
        { 
          name: 1,
          image: 1,
          online: 1 
        },
        { limit: 40, presence: true }
      );
      return response.users.filter((foundUser) => (
        foundUser.id !== client.userID && foundUser.allow_direct_messages !== false
      ));
    } catch (error) {
      console.error("Failed to fetch users:", error);
      return [];
    }
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

  const fetchDirectChannels = useCallback(async () => {
    if (!client?.user?.id) return [];
    try {
      return await client.queryChannels(
        {
          type: "messaging",
          members: { $in: [client.user.id] },
        },
        { last_message_at: -1 },
        { watch: true, state: true, limit: 100 }
      );
    } catch (error) {
      console.error("Failed to fetch DM channels:", error);
      return [];
    }
  }, [client]);

  const { data: dmChannels = [] } = useQuery({
    queryKey: ["users-dm-channels", client?.user?.id],
    queryFn: fetchDirectChannels,
    enabled: !!client?.user,
    staleTime: 1000 * 15,
    refetchInterval: 1000 * 20,
  });

  const dmChannelByUserId = useMemo(() => {
    const map = new Map();
    dmChannels.forEach((channel) => {
      const members = Object.keys(channel.state?.members || {});
      if (members.length !== 2 || channel.data?.name) return;
      const otherUserId = members.find((memberId) => memberId !== client?.user?.id);
      if (!otherUserId || map.has(otherUserId)) return;
      map.set(otherUserId, channel);
    });
    return map;
  }, [client?.user?.id, dmChannels]);

  const startDirectMessage = async (targetUser) => {
    if (!targetUser || !client?.user) return;
    if (targetUser.allow_direct_messages === false) {
      toast.error(`${targetUser.name || "This user"} is not accepting direct messages right now.`);
      return;
    }

    try {
      const existingChannel = dmChannelByUserId.get(targetUser.id);
      const channel = existingChannel || client.channel("messaging", undefined, {
        members: [client.user.id, targetUser.id],
      });
      await channel.watch();
      await channel.markRead();
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
        const channel = dmChannelByUserId.get(user.id);
        const unreadCount = channel?.countUnread?.() || 0;
        const isActive = activeChannel && activeChannel.id === channel?.id;

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
