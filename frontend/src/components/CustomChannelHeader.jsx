import { BotIcon, HashIcon, LockIcon, SparklesIcon, Trash2Icon, UsersIcon, PinIcon, VideoIcon, UserPlus2Icon, KeyRoundIcon, SearchIcon } from "lucide-react";
import toast from "react-hot-toast";
import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import MembersModal from "@/components/MembersModal";
import PinnedMessagesModal from "@/components/PinnedMessagesModal";
import InviteModal from "@/components/InviteModal";
import AskAIModal from "@/components/AskAIModal";
import CatchUpModal from "@/components/CatchUpModal";
import ChannelPasscodeModal from "@/components/ChannelPasscodeModal";
import UserSearchModal from "@/components/UserSearchModal";
import PresenceSelector from "@/components/PresenceSelector";

const CustomChannelHeader = ({ channel, messages = [], onChannelDeleted }) => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [showPinnedMessages, setShowPinnedMessages] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [showMembers, setShowMembers] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showAskAI, setShowAskAI] = useState(false);
  const [showCatchUp, setShowCatchUp] = useState(false);
  const [showPasscode, setShowPasscode] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [currentUserPresence, setCurrentUserPresence] = useState("online");
  
  if (!channel) return null;

  const memberCount = Object.keys(channel.state?.members || {}).length;
  const members = Object.values(channel.state?.members || {});

  const otherUser = Object.values(channel.state?.members || {}).find(
    (member) => member.user?.id !== user?.id
  );

  const isDM = memberCount === 2 && !channel.data?.name;
  const createdById = channel.data?.created_by?.id || channel.data?.created_by_id || "";
  const memberRole = channel.state?.members?.[user?.id]?.role || channel.state?.members?.[user?.id]?.channel_role || "";
  const isOwner = createdById === user?.id || memberRole === "owner" || memberRole === "channel_owner";

  const handleShowPinned = async () => {
    const channelState = await channel.query();
    setPinnedMessages(channelState.pinned_messages || []);
    setShowPinnedMessages(true);
  };

  const handleVideoCall = async () => {
    if (channel) {
      const callUrl = `${window.location.origin}/call/${channel.id}`;
      await channel.sendMessage({
        text: `I've started a video call. Join me here: ${callUrl}`,
      });
      navigate(`/call/${channel.id}`);
    }
  };

  const handleDeleteChannel = async () => {
    if (!channel || !isOwner) return;

    const confirmed = window.confirm(`Delete #${channel.data?.name || channel.id}? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await channel.delete();
      toast.success("Channel deleted");
      await onChannelDeleted?.(channel);
    } catch (deleteError) {
      console.error("Failed to delete channel:", deleteError);
      toast.error(deleteError?.message || "Failed to delete channel");
    }
  };

  return (
    <>
      <div className="h-14 flex items-center justify-between px-4 bg-neutral-900 border-b border-neutral-800/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {channel.data?.private ? (
              <LockIcon className="size-4 text-neutral-400" />
            ) : (
              <HashIcon className="size-4 text-neutral-400" />
            )}

            {isDM && otherUser?.user?.image && (
              <img
                src={otherUser.user.image}
                alt={otherUser.user.name || otherUser.user.id}
                className="size-7 rounded-full object-cover"
              />
            )}

            <span className="font-semibold text-neutral-100">
              {isDM
                ? otherUser?.user?.name || otherUser?.user?.id
                : channel.data?.name || channel.id}
            </span>

            {!isDM && isOwner && (
              <button
                onClick={() => setShowPasscode(true)}
                className="sm:hidden ml-2 inline-flex items-center gap-1 rounded-full border border-amber-400/25 bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-200 hover:bg-amber-500/15"
                title="View Join Passcode"
              >
                <KeyRoundIcon className="size-3.5" />
                Passcode
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 max-w-[60vw] overflow-x-auto">
          <button
            onClick={() => setShowMembers(true)}
            className="flex items-center gap-2 px-2 py-1 rounded-lg 
                     text-neutral-400 hover:text-neutral-100 
                     hover:bg-neutral-800/60 transition-all"
          >
            <UsersIcon className="size-5" />
            <span className="text-sm">{memberCount}</span>
          </button>

          {!isDM && isOwner && (
            <button
              onClick={() => setShowPasscode(true)}
              className="hidden sm:inline-flex shrink-0 p-2 rounded-lg text-neutral-400 
                     hover:text-amber-300 hover:bg-neutral-800/60 
                     transition-all"
              title="View Join Passcode"
            >
              <KeyRoundIcon className="size-5" />
            </button>
          )}

          {!isDM && (
            <button
              onClick={() => setShowInvite(true)}
              className="shrink-0 p-2 rounded-lg text-neutral-400 
                     hover:text-emerald-400 hover:bg-neutral-800/60 
                     transition-all"
              title="Invite Members"
            >
              <UserPlus2Icon className="size-5" />
            </button>
          )}

          {!isDM && isOwner && (
            <button
              onClick={handleDeleteChannel}
              className="shrink-0 rounded-lg p-2 text-neutral-400 transition-all hover:bg-neutral-800/60 hover:text-red-300"
              title="Delete Channel"
            >
              <Trash2Icon className="size-5" />
            </button>
          )}

          <button
            onClick={() => setShowAskAI(true)}
            className="shrink-0 rounded-lg p-2 text-neutral-400 transition-all hover:bg-neutral-800/60 hover:text-violet-300"
            title="Ask AI"
          >
            <BotIcon className="size-5" />
          </button>

          <button
            onClick={() => setShowCatchUp(true)}
            className="shrink-0 rounded-lg p-2 text-neutral-400 transition-all hover:bg-neutral-800/60 hover:text-cyan-300"
            title="Catch Up"
          >
            <SparklesIcon className="size-5" />
          </button>

          <button
            onClick={handleVideoCall}
            className="shrink-0 p-2 rounded-lg text-neutral-400 
                     hover:text-blue-400 hover:bg-neutral-800/60 
                     transition-all"
            title="Start Video Call"
          >
            <VideoIcon className="size-5" />
          </button>

          <button
            onClick={() => setShowSearch(true)}
            className="shrink-0 p-2 rounded-lg text-neutral-400 
                     hover:text-cyan-400 hover:bg-neutral-800/60 
                     transition-all"
            title="Search Users"
          >
            <SearchIcon className="size-5" />
          </button>

          <button
            onClick={handleShowPinned}
            className="shrink-0 p-2 rounded-lg text-neutral-400 
                     hover:text-yellow-400 hover:bg-neutral-800/60 
                     transition-all"
          >
            <PinIcon className="size-4" />
          </button>

          <PresenceSelector currentStatus={currentUserPresence} />
        </div>
      </div>
      
      {showPinnedMessages && (
        <PinnedMessagesModal
          pinnedMessages={pinnedMessages}
          onClose={() => setShowPinnedMessages(false)}
        />
      )}

      {showMembers && (
        <MembersModal members={members} onClose={() => setShowMembers(false)} />
      )}

      {showInvite && (
        <InviteModal channel={channel} onClose={() => setShowInvite(false)} />
      )}

      {showPasscode && !isDM && isOwner && (
        <ChannelPasscodeModal channel={channel} onClose={() => setShowPasscode(false)} />
      )}

      {showAskAI && (
        <AskAIModal
          isOpen={showAskAI}
          onClose={() => setShowAskAI(false)}
          channel={channel}
          messages={messages}
        />
      )}

      {showCatchUp && (
        <CatchUpModal
          isOpen={showCatchUp}
          onClose={() => setShowCatchUp(false)}
          channel={channel}
          messages={messages}
        />
      )}

      {showSearch && (
        <UserSearchModal
          isOpen={showSearch}
          onClose={() => setShowSearch(false)}
          onSelectUser={(selectedChannel) => {
            // Handle user selection - this would typically navigate to the DM
            console.log("Selected user channel:", selectedChannel);
            setShowSearch(false);
          }}
        />
      )}
    </>
  );
};

export default CustomChannelHeader;
