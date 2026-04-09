import { BotIcon, HashIcon, LockIcon, SparklesIcon, UsersIcon, PinIcon, VideoIcon, UserPlus2Icon } from "lucide-react";
import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import MembersModal from "@/components/MembersModal";
import PinnedMessagesModal from "@/components/PinnedMessagesModal";
import InviteModal from "@/components/InviteModal";
import AskAIModal from "@/components/AskAIModal";
import CatchUpModal from "@/components/CatchUpModal";

const CustomChannelHeader = ({ channel, messages = [] }) => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [showPinnedMessages, setShowPinnedMessages] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [showMembers, setShowMembers] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showAskAI, setShowAskAI] = useState(false);
  const [showCatchUp, setShowCatchUp] = useState(false);
  
  if (!channel) return null;

  const memberCount = Object.keys(channel.state?.members || {}).length;
  const members = Object.values(channel.state?.members || {});

  const otherUser = Object.values(channel.state?.members || {}).find(
    (member) => member.user?.id !== user?.id
  );

  const isDM = memberCount === 2 && !channel.data?.name;

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
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMembers(true)}
            className="flex items-center gap-2 px-2 py-1 rounded-lg 
                     text-neutral-400 hover:text-neutral-100 
                     hover:bg-neutral-800/60 transition-all"
          >
            <UsersIcon className="size-5" />
            <span className="text-sm">{memberCount}</span>
          </button>

          {!isDM && (
            <button
              onClick={() => setShowInvite(true)}
              className="p-2 rounded-lg text-neutral-400 
                     hover:text-emerald-400 hover:bg-neutral-800/60 
                     transition-all"
              title="Invite Members"
            >
              <UserPlus2Icon className="size-5" />
            </button>
          )}

          <button
            onClick={() => setShowAskAI(true)}
            className="rounded-lg p-2 text-neutral-400 transition-all hover:bg-neutral-800/60 hover:text-violet-300"
            title="Ask AI"
          >
            <BotIcon className="size-5" />
          </button>

          <button
            onClick={() => setShowCatchUp(true)}
            className="rounded-lg p-2 text-neutral-400 transition-all hover:bg-neutral-800/60 hover:text-cyan-300"
            title="Catch Up"
          >
            <SparklesIcon className="size-5" />
          </button>

          <button
            onClick={handleVideoCall}
            className="p-2 rounded-lg text-neutral-400 
                     hover:text-blue-400 hover:bg-neutral-800/60 
                     transition-all"
            title="Start Video Call"
          >
            <VideoIcon className="size-5" />
          </button>

          <button
            onClick={handleShowPinned}
            className="p-2 rounded-lg text-neutral-400 
                     hover:text-yellow-400 hover:bg-neutral-800/60 
                     transition-all"
          >
            <PinIcon className="size-4" />
          </button>
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
    </>
  );
};

export default CustomChannelHeader;
