import { useStreamChat } from "@/hooks/useStreamChat"
import { getChannelInsights, getCurrentUserProfile, rewriteMessageWithAI } from "@/lib/api"
import { UserButton } from "@clerk/clerk-react"
import { useQuery } from "@tanstack/react-query"
import { useCallback, useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router"
import { Link } from "react-router-dom"
import { Menu, X, Plus, Send, Hash, Lock, Users, Paperclip, Image as ImageIcon, FileText, Download, Trash2, Settings, Reply, Forward, Pin, PinOff, BarChart3, LogIn } from "lucide-react"
import { Chat } from "stream-chat-react"
import ChannelInsightsPanel from "@/components/ChannelInsightsPanel"
import CreatePollModal from "@/components/CreatePollModal"
import CreateChannelModal from "@/components/CreateChannelModal"
import CustomChannelHeader from "@/components/CustomChannelHeader"
import JoinChannelModal from "@/components/JoinChannelModal"
import UsersList from "@/components/UsersList"

const isDirectMessageChannel = (channel) => {
  if (!channel) return false
  const members = Object.keys(channel.state?.members || {})
  const hasOnlyTwoMembers = members.length === 2
  const hasCustomName = Boolean(channel.data?.name)
  return hasOnlyTwoMembers && !hasCustomName
}

const getDirectMessageUser = (channel, currentUserId) => {
  if (!channel || !currentUserId) return null
  return Object.values(channel.state?.members || {}).find(
    (member) => member.user?.id !== currentUserId
  )?.user
}

const getChannelDisplayName = (channel, currentUserId) => {
  if (!channel) return "VibeMeet Chat"
  if (isDirectMessageChannel(channel)) {
    const otherUser = getDirectMessageUser(channel, currentUserId)
    return otherUser?.name || otherUser?.id || "Direct Message"
  }
  return channel.data?.name || channel.id
}

const normalizeChannelKey = (value = "") =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "")

const dedupeChannels = (channelList = [], currentUserId) => {
  const uniqueChannels = []
  const seenIds = new Set()
  const seenDisplayNames = new Set()

  channelList.forEach((channel) => {
    if (!channel) return

    const normalizedId = normalizeChannelKey(channel.id || channel.cid)
    const normalizedDisplayName = normalizeChannelKey(getChannelDisplayName(channel, currentUserId))

    if (normalizedId && seenIds.has(normalizedId)) return
    if (normalizedDisplayName && seenDisplayNames.has(normalizedDisplayName)) return

    if (normalizedId) {
      seenIds.add(normalizedId)
    }

    if (normalizedDisplayName) {
      seenDisplayNames.add(normalizedDisplayName)
    }

    uniqueChannels.push(channel)
  })

  return uniqueChannels
}

const isImageFile = (file) => file?.type?.startsWith("image/")

const formatFileSize = (size = 0) => {
  if (!size) return ""
  const units = ["B", "KB", "MB", "GB"]
  let value = size
  let unitIndex = 0
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

const getMessagePreview = (message) => {
  if (!message) return ""
  if (message.text?.trim()) return message.text.trim()

  if (message.attachments?.length) {
    const attachmentNames = message.attachments
      .map((attachment) => attachment.title || attachment.name || (attachment.type === "image" ? "Image" : "File"))
      .join(", ")

    return attachmentNames || "Shared attachment"
  }

  return "Message"
}

const URL_SPLIT_PATTERN = /(https?:\/\/[^\s]+)/g
const URL_MATCH_PATTERN = /^https?:\/\/[^\s]+$/i
const MENTION_MATCH_PATTERN = /^@[\w-]+$/i

const renderTextWithLinks = (text = "", className = "") =>
  String(text)
    .split(URL_SPLIT_PATTERN)
    .map((part, index) =>
      URL_MATCH_PATTERN.test(part) ? (
        <a
          key={`${part}-${index}`}
          href={part}
          className={`${className} underline underline-offset-4 break-all`}
          target="_self"
          rel="noreferrer"
        >
          {part}
        </a>
      ) : MENTION_MATCH_PATTERN.test(part) ? (
        <span
          key={`${part}-${index}`}
          className={`${className} rounded-full bg-blue-500/15 px-2 py-0.5 font-medium text-blue-300`}
        >
          {part}
        </span>
      ) : (
        <span key={`${part}-${index}`}>
          {part.split(/(\s+)/).map((token, tokenIndex) =>
            MENTION_MATCH_PATTERN.test(token) ? (
              <span
                key={`${token}-${tokenIndex}`}
                className={`${className} rounded-full bg-blue-500/15 px-2 py-0.5 font-medium text-blue-300`}
              >
                {token}
              </span>
            ) : (
              <span key={`${token}-${tokenIndex}`}>{token}</span>
            )
          )}
        </span>
      )
    )

const buildAIChannelContext = (channel) => ({
  id: channel?.id || "",
  name: channel?.data?.name || channel?.id || "",
  type: channel?.data?.private ? "private" : "public",
})

const buildAIMessageContext = (messages = []) =>
  messages.slice(-30).map((message) => ({
    user: message.user?.name || message.user?.id || "Unknown user",
    text: message.text || "",
    createdAt: message.created_at || "",
  }))

const HomePage = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)
  const [activeChannel, setActiveChannel] = useState(null)
  const [channels, setChannels] = useState([])
  const [messages, setMessages] = useState([])
  const [messageText, setMessageText] = useState("")
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isCreatePollOpen, setIsCreatePollOpen] = useState(false)
  const [loadingTimeout, setLoadingTimeout] = useState(false)
  const [isChannelsLoading, setIsChannelsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isPollSubmitting, setIsPollSubmitting] = useState(false)
  const [pendingAttachments, setPendingAttachments] = useState([])
  const [hoveredMessageId, setHoveredMessageId] = useState(null)
  const [replyTarget, setReplyTarget] = useState(null)
  const [mentionSuggestions, setMentionSuggestions] = useState([])
  const [activeMentionQuery, setActiveMentionQuery] = useState("")
  const [channelInsights, setChannelInsights] = useState(null)
  const [isInsightsLoading, setIsInsightsLoading] = useState(false)
  const [rewriteMode, setRewriteMode] = useState("clearer")
  const [isRewriting, setIsRewriting] = useState(false)
  const [isInsightsPanelVisible, setIsInsightsPanelVisible] = useState(true)
  const [searchParams, setSearchParams] = useSearchParams()
  const { chatClient, error, isLoading } = useStreamChat()
  const activeChannelRef = useRef(null)
  const fileInputRef = useRef(null)
  const messageInputRef = useRef(null)
  const chatContainerRef = useRef(null)
  const pendingAttachmentsRef = useRef([])
  const { data: currentUserProfile } = useQuery({
    queryKey: ["current-user-profile"],
    queryFn: getCurrentUserProfile,
    enabled: Boolean(chatClient),
  })

  const syncMessages = useCallback((channel) => {
    if (!channel) {
      setMessages([])
      return
    }

    const nextMessages = [...(channel.state?.messages || [])].filter((message) => !message?.deleted_at)
    setMessages(nextMessages)

    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
      }
    }, 50)
  }, [])

  const loadChannels = useCallback(async () => {
    if (!chatClient?.user?.id) return
    setIsChannelsLoading(true)

    try {
      const queriedChannels = await chatClient.queryChannels(
        {
          type: "messaging",
          members: { $in: [chatClient.user.id] },
        },
        {
          last_message_at: -1,
          updated_at: -1,
          created_at: 1,
        },
        {
          watch: true,
          state: true,
        }
      )
      setChannels(dedupeChannels(queriedChannels, chatClient.user.id))
    } catch (loadError) {
      console.error("Failed to load channels:", loadError)
      setChannels([])
    } finally {
      setIsChannelsLoading(false)
    }
  }, [chatClient])

  const refreshInsights = useCallback(async (channelToInspect = activeChannelRef.current, messagesToInspect = messages) => {
    if (!channelToInspect) {
      setChannelInsights(null)
      return
    }

    setIsInsightsLoading(true)

    try {
      const response = await getChannelInsights({
        channel: buildAIChannelContext(channelToInspect),
        messages: buildAIMessageContext(messagesToInspect),
      })

      setChannelInsights(response)
    } catch (insightsError) {
      console.error("Failed to load channel insights:", insightsError)
      setChannelInsights(null)
    } finally {
      setIsInsightsLoading(false)
    }
  }, [messages])

  const handleRewriteMessage = async (mode) => {
    if (!messageText.trim() || !activeChannel || isRewriting) return

    setRewriteMode(mode)
    setIsRewriting(true)

    try {
      const response = await rewriteMessageWithAI({
        channel: buildAIChannelContext(activeChannel),
        messages: buildAIMessageContext(messages),
        draft: messageText,
        mode,
      })

      if (response?.text) {
        setMessageText(response.text)
      }
    } catch (rewriteError) {
      console.error("Failed to rewrite message:", rewriteError)
    } finally {
      setIsRewriting(false)
    }
  }

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true)
      }, 3000)

      return () => clearTimeout(timer)
    }

    setLoadingTimeout(false)
  }, [isLoading])

  useEffect(() => {
    if (!chatClient) return
    loadChannels()
  }, [chatClient, loadChannels])

  useEffect(() => {
    if (!chatClient) return

    const refreshSidebar = () => {
      loadChannels()
    }

    const subscription = chatClient.on((event) => {
      if (
        event.type === "channel.created" ||
        event.type === "channel.updated" ||
        event.type === "channel.deleted" ||
        event.type === "notification.added_to_channel" ||
        event.type === "notification.removed_from_channel"
      ) {
        refreshSidebar()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [chatClient, loadChannels])

  useEffect(() => {
    if (!channels.length) {
      setActiveChannel(null)
      return
    }

    const selectedChannelId = searchParams.get("channel")
    
    // Only set channel if it exists in user's channels
    const nextChannel = selectedChannelId 
      ? channels.find((channel) => channel.id === selectedChannelId)
      : null

    // Do NOT auto-select first channel, leave empty welcome screen
    if (!nextChannel) {
      setActiveChannel(null)
      setSearchParams({}, { replace: true })
      return
    }

    if (activeChannelRef.current?.id !== nextChannel.id) {
      activeChannelRef.current = nextChannel
      setActiveChannel(nextChannel)
    }
  }, [channels, searchParams, setSearchParams])

  useEffect(() => {
    if (!activeChannel) {
      setMessages([])
      setChannelInsights(null)
      return
    }

    activeChannelRef.current = activeChannel
    let isMounted = true

    const watchChannel = async () => {
      try {
        await activeChannel.watch()
        if (isMounted) {
          syncMessages(activeChannel)
        }
      } catch (channelError) {
        console.error("Failed to watch active channel:", channelError)
      }
    }

    watchChannel()

    const subscription = activeChannel.on((event) => {
      if (
        event.type === "message.new" ||
        event.type === "message.updated" ||
        event.type === "message.deleted" ||
        event.type === "message.undeleted"
      ) {
        syncMessages(activeChannel)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [activeChannel, syncMessages])

  useEffect(() => {
    if (!activeChannel) return
    refreshInsights(activeChannel, messages)
  }, [activeChannel, messages, refreshInsights])

  const handleChannelSelect = (channel) => {
    setActiveChannel(channel)
    activeChannelRef.current = channel
    setSearchParams({ channel: channel.id })
    setIsSidebarOpen(false)
    setReplyTarget(null)
  }

  const handleChannelDeleted = async (deletedChannel) => {
    const nextChannels = channels.filter((channel) => channel.id !== deletedChannel.id)
    setChannels(nextChannels)

    if (activeChannelRef.current?.id === deletedChannel.id) {
      const fallbackChannel = nextChannels[0] || null
      setActiveChannel(fallbackChannel)
      activeChannelRef.current = fallbackChannel

      if (fallbackChannel) {
        setSearchParams({ channel: fallbackChannel.id }, { replace: true })
      } else {
        setSearchParams({}, { replace: true })
      }
    }

    await loadChannels()
  }

  const handleReplyMessage = (message) => {
    setReplyTarget(message)
    messageInputRef.current?.focus()
  }

  const handleForwardMessage = (message) => {
    const forwardedParts = [
      `Fwd from ${message.user?.name || message.user?.id || "Unknown user"}:`,
      getMessagePreview(message),
    ]

    if (message.attachments?.length) {
      const attachmentLinks = message.attachments
        .map((attachment) => attachment.image_url || attachment.asset_url)
        .filter(Boolean)

      if (attachmentLinks.length) {
        forwardedParts.push("", ...attachmentLinks)
      }
    }

    setMessageText((current) => {
      const nextValue = forwardedParts.join("\n")
      return current.trim() ? `${current.trim()}\n\n${nextValue}` : nextValue
    })
    messageInputRef.current?.focus()
  }

  const handleTogglePin = async (message) => {
    if (!chatClient || !message?.id) return

    try {
      if (message.pinned) {
        await chatClient.unpinMessage(message.id)
      } else {
        await chatClient.pinMessage(message.id)
      }

      if (activeChannelRef.current) {
        await activeChannelRef.current.watch()
        syncMessages(activeChannelRef.current)
      }
    } catch (pinError) {
      console.error("Failed to toggle pin state:", pinError)
    }
  }

  const handleSendMessage = async () => {
    if (!activeChannel || isSending) return

    const trimmedMessage = messageText.trim()
    if (!trimmedMessage && pendingAttachments.length === 0) return

    setIsSending(true)

    try {
      const uploadedAttachments = []

      for (const attachment of pendingAttachments) {
        const response = isImageFile(attachment.file)
          ? await activeChannel.sendImage(attachment.file, attachment.file.name)
          : await activeChannel.sendFile(attachment.file, attachment.file.name)

        uploadedAttachments.push(
          isImageFile(attachment.file)
            ? {
                type: "image",
                image_url: response.file,
                asset_url: response.file,
                fallback: attachment.file.name,
                file_size: attachment.file.size,
                mime_type: attachment.file.type,
                title: attachment.file.name,
              }
            : {
                type: "file",
                asset_url: response.file,
                file_size: attachment.file.size,
                mime_type: attachment.file.type,
                title: attachment.file.name,
              }
        )
      }

      await activeChannel.sendMessage({
        text: trimmedMessage,
        attachments: uploadedAttachments,
        quoted_message_id: replyTarget?.id,
        mentioned_users: Object.values(activeChannel.state?.members || {})
          .map((member) => member.user?.id)
          .filter((id) => id && new RegExp(`(^|\\s)@${id}(?=\\s|$)`).test(trimmedMessage)),
      })

      setMessageText("")
      setReplyTarget(null)
      setMentionSuggestions([])
      setActiveMentionQuery("")
      pendingAttachments.forEach((attachment) => {
        if (attachment.previewUrl) {
          URL.revokeObjectURL(attachment.previewUrl)
        }
      })
      setPendingAttachments([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      syncMessages(activeChannel)
    } catch (sendError) {
      console.error("Failed to send message:", sendError)
    } finally {
      setIsSending(false)
    }
  }

  const handleCreatePoll = async ({ question, options }) => {
    if (!activeChannel || isPollSubmitting) return

    setIsPollSubmitting(true)

    try {
      await activeChannel.sendMessage({
        text: `Poll: ${question}`,
        poll: {
          question,
          options: options.map((option, index) => ({
            id: `option-${index + 1}`,
            text: option,
            votes: [],
          })),
          created_by: chatClient.user?.id || "",
        },
      })

      setIsCreatePollOpen(false)
      syncMessages(activeChannel)
    } catch (pollError) {
      console.error("Failed to create poll:", pollError)
    } finally {
      setIsPollSubmitting(false)
    }
  }

  const handleVotePoll = async (message, optionId) => {
    if (!chatClient || !message?.id || !message?.poll || !chatClient.user?.id) return

    const currentUserId = chatClient.user.id
    const updatedOptions = (message.poll.options || []).map((option) => {
      const nextVotes = (option.votes || []).filter((vote) => vote !== currentUserId)

      if (option.id === optionId) {
        nextVotes.push(currentUserId)
      }

      return {
        ...option,
        votes: Array.from(new Set(nextVotes)),
      }
    })

    try {
      await chatClient.updateMessage({
        ...message,
        poll: {
          ...message.poll,
          options: updatedOptions,
        },
      })

      if (activeChannelRef.current) {
        await activeChannelRef.current.watch()
        syncMessages(activeChannelRef.current)
      }
    } catch (voteError) {
      console.error("Failed to update poll vote:", voteError)
    }
  }

  const handleAttachmentPick = (event) => {
    const selectedFiles = Array.from(event.target.files || [])
    if (!selectedFiles.length) return

    const nextAttachments = selectedFiles.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      previewUrl: isImageFile(file) ? URL.createObjectURL(file) : "",
    }))

    setPendingAttachments((current) => [...current, ...nextAttachments])
  }

  const removePendingAttachment = (attachmentId) => {
    setPendingAttachments((current) => {
      const attachmentToRemove = current.find((attachment) => attachment.id === attachmentId)
      if (attachmentToRemove?.previewUrl) {
        URL.revokeObjectURL(attachmentToRemove.previewUrl)
      }
      return current.filter((attachment) => attachment.id !== attachmentId)
    })

    if (fileInputRef.current && pendingAttachments.length <= 1) {
      fileInputRef.current.value = ""
    }
  }

  useEffect(() => {
    pendingAttachmentsRef.current = pendingAttachments
  }, [pendingAttachments])

  useEffect(() => {
    const match = messageText.match(/(?:^|\s)@([\w-]*)$/)

    if (!match || !activeChannel) {
      setMentionSuggestions([])
      setActiveMentionQuery("")
      return
    }

    const query = match[1].toLowerCase()
    const members = Object.values(activeChannel.state?.members || {})
      .map((member) => member.user)
      .filter((member) => member?.id && member.id !== chatClient?.user?.id)
      .filter((member) => {
        const id = member.id.toLowerCase()
        const name = (member.name || "").toLowerCase()
        return !query || id.includes(query) || name.includes(query)
      })
      .slice(0, 5)

    setActiveMentionQuery(query)
    setMentionSuggestions(members)
  }, [activeChannel, chatClient?.user?.id, messageText])

  useEffect(() => {
    return () => {
      pendingAttachmentsRef.current.forEach((attachment) => {
        if (attachment.previewUrl) {
          URL.revokeObjectURL(attachment.previewUrl)
        }
      })
    }
  }, [])

  const visibleChannels = dedupeChannels(
    channels.filter((channel) => !isDirectMessageChannel(channel)),
    chatClient?.user?.id
  )
  const activeChannelName = getChannelDisplayName(activeChannel, chatClient?.user?.id)
  const canCreateChannels = currentUserProfile?.user?.allowChannelCreation !== false
  const insertMention = (member) => {
    const nextText = messageText.replace(/(?:^|\s)@([\w-]*)$/, (fullMatch) => {
      const prefix = fullMatch.startsWith(" ") ? " " : ""
      return `${prefix}@${member.id} `
    })

    setMessageText(nextText)
    setMentionSuggestions([])
    setActiveMentionQuery("")
    messageInputRef.current?.focus()
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-neutral-950 flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-red-400 text-lg mb-4">Failed to load chat client</p>
          <p className="text-neutral-500 text-sm">{error.message || String(error)}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-neutral-100 hover:bg-white text-neutral-950 rounded-lg font-medium transition-all duration-300 cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (isLoading || !chatClient) {
    return (
      <div className="min-h-screen w-full bg-neutral-950 flex items-center justify-center overflow-hidden">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-neutral-800 border-t-neutral-100 rounded-full animate-spin"></div>
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex gap-2">
            <div className="w-2 h-2 bg-neutral-500 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-neutral-500 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
            <div className="w-2 h-2 bg-neutral-500 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
          </div>
        </div>
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-neutral-500 text-sm animate-pulse">
          Connecting to VibeMeet...
        </div>
        {loadingTimeout && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-neutral-600 text-xs">
            <button
              onClick={() => window.location.reload()}
              className="text-neutral-400 hover:text-neutral-200 underline cursor-pointer"
            >
              Taking too long? Click to refresh
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <Chat client={chatClient}>
      <div className="h-screen w-full bg-neutral-950 flex flex-col lg:flex-row overflow-hidden">
        <div
          className={`fixed lg:static top-0 left-0 h-full w-64 bg-linear-to-b from-neutral-900 to-neutral-950 border-r border-neutral-800/50 flex flex-col transition-all duration-300 z-40 ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0`}
        >
          <div className="p-4 border-b border-neutral-800/50 flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-3 rounded-lg pr-3 transition-opacity duration-200 hover:opacity-90"
            >
              <img
                src="/vibemeet_logo.png"
                alt="VibeMeet Logo"
                className="w-9 h-9 shrink-0 object-contain rounded-xl bg-neutral-800/40 p-1"
              />
              <span className="text-lg font-bold text-neutral-100">VibeMeet</span>
            </Link>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-neutral-400 hover:text-neutral-100 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-4 border-b border-neutral-800/50 flex items-center justify-between">
            <span className="text-sm text-neutral-400">Account</span>
            <div className="flex items-center gap-2">
              <Link
                to="/account"
                className="inline-flex items-center justify-center rounded-lg border border-neutral-800/70 bg-neutral-900/70 p-2 text-neutral-400 transition-colors hover:text-neutral-100"
                title="Edit profile"
              >
                <Settings size={16} />
              </Link>
              <UserButton />
            </div>
          </div>

          <div className="p-4">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              disabled={!canCreateChannels}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-neutral-100 hover:bg-white disabled:bg-neutral-800 disabled:text-neutral-500 disabled:hover:bg-neutral-800 text-neutral-950 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:transform-none disabled:cursor-not-allowed cursor-pointer"
            >
              <Plus size={18} />
              {canCreateChannels ? "New Channel" : "Channel Creation Off"}
            </button>
            {!canCreateChannels && (
              <p className="mt-2 text-xs text-neutral-500">
                Turn channel creation back on from your account page.
              </p>
            )}
            <button
              onClick={() => setIsJoinModalOpen(true)}
              className="mt-3 w-full flex items-center justify-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/70 px-4 py-2 text-sm font-medium text-neutral-300 transition hover:border-neutral-700 hover:text-neutral-100"
            >
              <LogIn size={16} />
              Join With Passcode
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-2">
            <p className="text-xs text-neutral-600 font-semibold px-2 py-2 uppercase">Channels</p>
            <div className="space-y-1">
              {isChannelsLoading ? (
                <p className="text-sm text-neutral-500 px-2 py-3">Loading channels...</p>
              ) : visibleChannels.length === 0 ? (
                <p className="text-sm text-neutral-500 px-2 py-3">No channels yet</p>
              ) : (
                visibleChannels.map((channel) => {
                  const isPrivate = Boolean(channel.data?.private)

                  return (
                    <button
                      key={channel.cid}
                      onClick={() => handleChannelSelect(channel)}
                      className={`w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium cursor-pointer ${
                        activeChannel?.id === channel.id
                          ? "bg-neutral-700 text-neutral-100 border border-neutral-600/50"
                          : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50"
                      }`}
                    >
                      {isPrivate ? <Lock size={14} /> : <Hash size={14} />}
                      <span className="truncate">{channel.data?.name || channel.id}</span>
                    </button>
                  )
                })
              )}
            </div>

            <div className="mt-6">
              <div className="flex items-center gap-2 px-2 py-2">
                <Users size={14} className="text-neutral-600" />
                <p className="text-xs text-neutral-600 font-semibold uppercase">Direct Messages</p>
              </div>
              <UsersList activeChannel={activeChannel} onSelectChannel={handleChannelSelect} />
            </div>
          </div>

          <div className="p-4 border-t border-neutral-800/50">
            <p className="text-xs text-white">VibeMeet Chat v1.0</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col relative min-h-0">
          <div className="h-16 bg-linear-to-r from-neutral-900 to-neutral-950 border-b border-neutral-800/50 flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-4 min-w-0">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden text-neutral-400 hover:text-neutral-100 transition-colors cursor-pointer"
              >
                <Menu size={24} />
              </button>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-neutral-100 leading-tight">VibeMeet Chat</h1>
                <p className="text-xs text-neutral-500 truncate">
                  {activeChannel
                    ? `Connected to ${activeChannelName}`
                    : "Choose a channel or direct message to start chatting"}
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 rounded-full border border-neutral-800/70 bg-neutral-900/80 px-3 py-1 text-xs text-neutral-400">
              <span className="h-2 w-2 rounded-full bg-green-500"></span>
              Live chat
            </div>
          </div>

          {activeChannel ? (
            <>
              <div className="shrink-0">
                <CustomChannelHeader
                  channel={activeChannel}
                  messages={messages}
                  onChannelDeleted={handleChannelDeleted}
                />
                {isInsightsPanelVisible ? (
                  <ChannelInsightsPanel
                    insights={channelInsights}
                    isLoading={isInsightsLoading}
                    onRefresh={() => refreshInsights(activeChannel, messages)}
                    onToggle={() => setIsInsightsPanelVisible(false)}
                  />
                ) : (
                  <div className="border-b border-neutral-800/50 bg-neutral-950/90 px-4 py-2">
                    <button
                      type="button"
                      onClick={() => setIsInsightsPanelVisible(true)}
                      className="w-full rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-300 transition hover:border-neutral-700 hover:text-neutral-100"
                    >
                      Show AI Insights Panel
                    </button>
                  </div>
                )}
              </div>

              <div ref={chatContainerRef} className="flex-1 overflow-y-auto bg-neutral-950 p-4 space-y-4 scroll-smooth min-h-0">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center">
                    <div>
                      <p className="text-neutral-100 text-lg font-semibold">
                        Welcome to {isDirectMessageChannel(activeChannel) ? activeChannelName : `#${activeChannelName}`}
                      </p>
                      <p className="text-neutral-400 text-base mt-2">
                        Start the conversation in this channel
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isCurrentUser = message.user?.id === chatClient.user?.id

                    return (
                      <div
                        key={message.id}
                        className={`group flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                        onMouseEnter={() => setHoveredMessageId(message.id)}
                        onMouseLeave={() => setHoveredMessageId((current) => (current === message.id ? null : current))}
                      >
                        <div className="relative max-w-[85%]">
                          <div
                            className={`absolute -top-3 z-10 flex items-center gap-1 rounded-full border border-neutral-800/70 bg-neutral-950/95 px-2 py-1 shadow-lg transition-all duration-200 ${
                              isCurrentUser ? "right-3" : "left-3"
                            } ${
                              hoveredMessageId === message.id
                                ? "translate-y-0 opacity-100"
                                : "pointer-events-none -translate-y-1 opacity-0"
                            }`}
                          >
                            <button
                              onClick={() => handleReplyMessage(message)}
                              className="rounded-full p-1.5 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-neutral-100 cursor-pointer"
                              title="Reply"
                            >
                              <Reply size={14} />
                            </button>
                            <button
                              onClick={() => handleForwardMessage(message)}
                              className="rounded-full p-1.5 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-neutral-100 cursor-pointer"
                              title="Forward"
                            >
                              <Forward size={14} />
                            </button>
                            <button
                              onClick={() => handleTogglePin(message)}
                              className={`rounded-full p-1.5 transition-colors cursor-pointer ${
                                message.pinned
                                  ? "text-yellow-300 hover:bg-yellow-500/10"
                                  : "text-neutral-400 hover:bg-neutral-800 hover:text-yellow-300"
                              }`}
                              title={message.pinned ? "Unpin message" : "Pin message"}
                            >
                              {message.pinned ? <PinOff size={14} /> : <Pin size={14} />}
                            </button>
                          </div>

                          <div className="flex items-center gap-2 mb-1 px-1">
                            <p className="text-neutral-300 text-sm font-medium">
                              {message.user?.name || message.user?.id || "Unknown user"}
                            </p>
                            {message.created_at && (
                              <span className="text-xs text-neutral-600">
                                {new Date(message.created_at).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            )}
                          </div>
                          <div
                            className={`rounded-2xl px-4 py-3 border backdrop-blur-sm transition-all duration-200 ${
                              isCurrentUser
                                ? "bg-neutral-100 text-neutral-950 border-neutral-200"
                                : "bg-neutral-900/60 border-neutral-800/50 text-neutral-200"
                            }`}
                          >
                            {message.pinned && (
                              <div
                                className={`mb-3 inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                                  isCurrentUser
                                    ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-700"
                                    : "border-yellow-500/20 bg-yellow-500/10 text-yellow-200"
                                }`}
                              >
                                <Pin size={12} />
                                Pinned
                              </div>
                            )}

                            {message.quoted_message && (
                              <div
                                className={`mb-3 rounded-2xl border px-3 py-2 text-sm ${
                                  isCurrentUser
                                    ? "border-neutral-300 bg-neutral-200/70 text-neutral-700"
                                    : "border-neutral-800/70 bg-neutral-950/70 text-neutral-300"
                                }`}
                              >
                                <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
                                  Replying to {message.quoted_message.user?.name || message.quoted_message.user?.id || "Unknown user"}
                                </p>
                                <p className="mt-1 line-clamp-2 break-words">
                                  {getMessagePreview(message.quoted_message)}
                                </p>
                              </div>
                            )}

                            {message.text ? (
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {renderTextWithLinks(
                                  message.text,
                                  isCurrentUser ? "text-neutral-900" : "text-blue-300"
                                )}
                              </p>
                            ) : null}

                            {message.poll ? (
                              <div className={`${message.text ? "mt-3" : ""} rounded-2xl border border-neutral-800/70 bg-neutral-950/70 p-4`}>
                                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                                  <BarChart3 size={14} />
                                  Poll
                                </div>
                                <p className="mt-2 text-sm font-semibold text-neutral-100">{message.poll.question}</p>
                                <div className="mt-3 space-y-2">
                                  {(message.poll.options || []).map((option) => {
                                    const voteCount = option.votes?.length || 0
                                    const hasVoted = option.votes?.includes(chatClient.user?.id)

                                    return (
                                      <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => handleVotePoll(message, option.id)}
                                        className={`flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left transition ${
                                          hasVoted
                                            ? "border-blue-500/40 bg-blue-500/10 text-blue-100"
                                            : "border-neutral-800 bg-neutral-900/80 text-neutral-200 hover:border-neutral-700"
                                        }`}
                                      >
                                        <span className="text-sm">{option.text}</span>
                                        <span className="text-xs text-neutral-400">{voteCount} vote{voteCount === 1 ? "" : "s"}</span>
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
                            ) : null}

                            {message.attachments?.length ? (
                              <div className={`${message.text ? "mt-3" : ""} space-y-3`}>
                                {message.attachments.map((attachment, index) => {
                                  const attachmentKey = `${message.id}-${attachment.asset_url || attachment.image_url || index}`
                                  const isImageAttachment = attachment.type === "image" || Boolean(attachment.image_url)
                                  const attachmentUrl = attachment.image_url || attachment.asset_url

                                  if (isImageAttachment && attachmentUrl) {
                                    return (
                                      <a
                                        key={attachmentKey}
                                        href={attachmentUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="block overflow-hidden rounded-xl border border-black/10 bg-black/5"
                                      >
                                        <img
                                          src={attachmentUrl}
                                          alt={attachment.fallback || attachment.title || "Shared image"}
                                          className="max-h-72 w-full object-cover"
                                        />
                                      </a>
                                    )
                                  }

                                  return (
                                    <a
                                      key={attachmentKey}
                                      href={attachmentUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className={`flex items-center gap-3 rounded-xl border px-3 py-3 ${
                                        isCurrentUser
                                          ? "border-neutral-300 bg-white/70"
                                          : "border-neutral-800/60 bg-neutral-950/70"
                                      }`}
                                    >
                                      <div className="rounded-lg bg-neutral-800/10 p-2">
                                        <FileText size={18} />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">
                                          {attachment.title || attachment.name || "Shared file"}
                                        </p>
                                        <p className="text-xs opacity-70">
                                          {formatFileSize(attachment.file_size)}
                                        </p>
                                      </div>
                                      <Download size={16} />
                                    </a>
                                  )
                                })}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              <div className="shrink-0 bg-neutral-900/50 border-t border-neutral-800/50 p-4">
                {pendingAttachments.length > 0 && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-3">
                      {pendingAttachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="relative flex min-w-40 max-w-56 items-center gap-3 rounded-2xl border border-neutral-800/70 bg-neutral-900/80 px-3 py-3"
                        >
                          {attachment.previewUrl ? (
                            <img
                              src={attachment.previewUrl}
                              alt={attachment.file.name}
                              className="h-12 w-12 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-800 text-neutral-300">
                              {isImageFile(attachment.file) ? <ImageIcon size={18} /> : <FileText size={18} />}
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-neutral-100">{attachment.file.name}</p>
                            <p className="text-xs text-neutral-500">{formatFileSize(attachment.file.size)}</p>
                          </div>

                          <button
                            onClick={() => removePendingAttachment(attachment.id)}
                            className="absolute right-2 top-2 rounded-full p-1 text-neutral-500 transition-colors hover:text-red-400 cursor-pointer"
                            title="Remove attachment"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {replyTarget && (
                  <div className="mb-3 flex items-start justify-between gap-3 rounded-2xl border border-neutral-800/70 bg-neutral-950/70 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Replying to {replyTarget.user?.name || replyTarget.user?.id || "Unknown user"}
                      </p>
                      <p className="mt-1 truncate text-sm text-neutral-200">
                        {getMessagePreview(replyTarget)}
                      </p>
                    </div>
                    <button
                      onClick={() => setReplyTarget(null)}
                      className="rounded-full p-1 text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-neutral-100 cursor-pointer"
                      title="Cancel reply"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatePollOpen(true)}
                    className="rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-300 transition hover:border-neutral-700 hover:text-neutral-100"
                  >
                    Create Poll
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRewriteMessage("clearer")}
                    disabled={!messageText.trim() || isRewriting}
                    className="rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-300 transition hover:border-neutral-700 hover:text-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isRewriting && rewriteMode === "clearer" ? "Rewriting..." : "AI Clearer"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRewriteMessage("shorter")}
                    disabled={!messageText.trim() || isRewriting}
                    className="rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-300 transition hover:border-neutral-700 hover:text-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isRewriting && rewriteMode === "shorter" ? "Shortening..." : "AI Shorter"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRewriteMessage("professional")}
                    disabled={!messageText.trim() || isRewriting}
                    className="rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-300 transition hover:border-neutral-700 hover:text-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isRewriting && rewriteMode === "professional" ? "Polishing..." : "AI Professional"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRewriteMessage("announcement")}
                    disabled={!messageText.trim() || isRewriting}
                    className="rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-300 transition hover:border-neutral-700 hover:text-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isRewriting && rewriteMode === "announcement" ? "Formatting..." : "AI Announcement"}
                  </button>
                </div>

                {mentionSuggestions.length > 0 && (
                  <div className="absolute bottom-[calc(100%-0.75rem)] left-4 right-4 z-20 rounded-2xl border border-neutral-800/80 bg-neutral-950/95 p-2 shadow-2xl backdrop-blur-sm">
                    <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                      Mention someone {activeMentionQuery ? `matching "${activeMentionQuery}"` : ""}
                    </p>
                    <div className="max-h-60 space-y-1 overflow-y-auto">
                      {mentionSuggestions.map((member) => (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => insertMention(member)}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-neutral-900"
                        >
                          {member.image ? (
                            <img
                              src={member.image}
                              alt={member.name || member.id}
                              className="size-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex size-8 items-center justify-center rounded-full bg-neutral-800 text-xs font-semibold text-neutral-200">
                              {(member.name || member.id).charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm text-neutral-100">{member.name || member.id}</p>
                            <p className="truncate text-xs text-neutral-500">@{member.id}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

  <div className="flex items-center gap-2 pb-[env(keyboard-inset-height,0px)]">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={handleAttachmentPick}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="shrink-0 rounded-lg border border-neutral-700/50 bg-neutral-800/50 p-2 text-neutral-300 transition-all duration-200 hover:border-neutral-600 hover:text-neutral-100 cursor-pointer"
                      title="Attach files"
                    >
                      <Paperclip size={18} />
                    </button>
                    <input
                      ref={messageInputRef}
                      type="text"
                      value={messageText}
                      onChange={(event) => setMessageText(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      placeholder={
                        isDirectMessageChannel(activeChannel)
                          ? `Message ${activeChannelName}`
                          : `Message #${activeChannelName}`
                      }
                      className="flex-1 bg-neutral-800/50 border border-neutral-700/50 rounded-lg px-4 py-3 text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-700/50 transition-all duration-200"
                      style={{
                        fontSize: '16px',
                        minHeight: '48px',
                        WebkitAppearance: 'none'
                      }}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={(!messageText.trim() && pendingAttachments.length === 0) || isSending}
                      className="bg-neutral-100 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-neutral-950 rounded-lg p-3 transition-all duration-300 transform hover:scale-110 active:scale-95 cursor-pointer flex-shrink-0"
                    >
                      <Send size={20} />
                    </button>
                  </div>
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto bg-neutral-950 p-4">
                  <div className="h-full flex items-center justify-center text-center">
                    <div>
                      <p className="text-neutral-100 text-lg font-semibold">Welcome to VibeMeet</p>
                      <p className="text-neutral-400 text-base mt-2">Add your friends and vibe with them</p>
                      <p className="text-neutral-500 text-sm mt-2">Select a channel to start messaging</p>
                    </div>
                  </div>
            </div>
          )}
        </div>

        <style>{`
          * {
            transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
            box-sizing: border-box;
          }

          @keyframes pulse {
            0%, 100% { opacity: 0.2; }
            50% { opacity: 1; }
          }

          .animate-pulse {
            animation: pulse 3s cubic-bezier(0.4, 0.0, 0.2, 1) infinite;
          }

          .animate-spin {
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          html, body, #root {
            height: 100vh;
            width: 100vw;
            overflow: hidden;
            margin: 0;
            padding: 0;
          }

          body {
            overflow-x: hidden;
            scrollbar-width: thin;
            scrollbar-color: rgba(115, 115, 115, 0.5) rgba(23, 23, 23, 0.5);
          }

          ::-webkit-scrollbar {
            width: 12px;
            position: fixed;
            right: 0;
            top: 0;
            bottom: 0;
            z-index: 99999;
          }

          ::-webkit-scrollbar-track {
            background: rgba(10, 10, 10, 0.95);
            margin: 0;
          }

          ::-webkit-scrollbar-thumb {
            background: rgba(82, 82, 82, 0.6);
            border-radius: 6px;
            border: 3px solid rgba(10, 10, 10, 0.95);
          }

          ::-webkit-scrollbar-thumb:hover {
            background: rgba(115, 115, 115, 0.8);
          }

          ::-webkit-scrollbar-thumb:active {
            background: rgba(163, 163, 163, 0.9);
          }

          .scroll-smooth {
            scroll-behavior: smooth;
          }
        `}</style>

        <CreateChannelModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          chatClient={chatClient}
          setActiveChannel={handleChannelSelect}
          setSearchParams={setSearchParams}
          onChannelCreated={loadChannels}
        />
        <JoinChannelModal
          isOpen={isJoinModalOpen}
          onClose={() => setIsJoinModalOpen(false)}
          chatClient={chatClient}
          onJoinedChannel={async (channelId) => {
            await loadChannels()
            const nextChannel = activeChannelRef.current?.id === channelId
              ? activeChannelRef.current
              : (await chatClient.queryChannels(
                  {
                    type: "messaging",
                    id: channelId,
                    members: { $in: [chatClient.user.id] },
                  },
                  {},
                  {
                    watch: true,
                    state: true,
                    limit: 1,
                  }
                ))[0]

            if (nextChannel) {
              handleChannelSelect(nextChannel)
            }
          }}
        />
        <CreatePollModal
          isOpen={isCreatePollOpen}
          onClose={() => setIsCreatePollOpen(false)}
          onCreatePoll={handleCreatePoll}
          isSubmitting={isPollSubmitting}
        />
      </div>
    </Chat>
  )
}

export default HomePage