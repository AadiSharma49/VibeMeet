import { useStreamChat } from "@/hooks/useStreamChat"
import { UserButton } from "@clerk/clerk-react"
import { useEffect, useState } from "react"
import { useSearchParams } from "react-router"
import { Menu, X, Plus, Send } from "lucide-react"
import CreateChannelModal from "@/components/CreateChannelModal"

const HomePage = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [activeChannel, setActiveChannel] = useState(null)
  const [channels, setChannels] = useState([
    { id: "general", name: "general" },
    { id: "announcements", name: "announcements" },
    { id: "random", name: "random" }
  ])
  const [messages, setMessages] = useState([])
  const [messageText, setMessageText] = useState("")
  const [searchParams, setSearchParams] = useSearchParams()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [loadingTimeout, setLoadingTimeout] = useState(false)
  const { chatClient, error, isLoading } = useStreamChat()

  // Timeout for loading state
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isLoading])

  useEffect(() => {
    if (chatClient) {
      const channelId = searchParams.get("channel")
      if (channelId) {
        const channel = chatClient.channel("messaging", channelId)
        setActiveChannel(channel)
      } else if (!activeChannel && channels.length > 0) {
        // Auto-select first channel if none selected
        setActiveChannel(channels[0])
      }
    }
  }, [chatClient, searchParams, activeChannel, channels])

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

  // Show loading only if Query is still fetching token
  if (isLoading || !chatClient) {
    return (
      <div className="min-h-screen w-full bg-neutral-950 flex items-center justify-center overflow-hidden">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-neutral-800 border-t-neutral-100 rounded-full animate-spin"></div>
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex gap-2">
            <div className="w-2 h-2 bg-neutral-500 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-neutral-500 rounded-full animate-pulse" style={{animationDelay: "0.2s"}}></div>
            <div className="w-2 h-2 bg-neutral-500 rounded-full animate-pulse" style={{animationDelay: "0.4s"}}></div>
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
    <div className="min-h-screen w-full bg-neutral-950 flex overflow-hidden">
      {/* Sidebar */}
      <div
        className={`fixed lg:relative top-0 left-0 h-full w-64 bg-linear-to-b from-neutral-900 to-neutral-950 border-r border-neutral-800/50 flex flex-col transition-all duration-300 z-40 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* Header */}
        <div className="p-4 border-b border-neutral-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/vibemeet_logo.png" alt="VibeMeet Logo" className="w-8 h-8" />
            <span className="text-lg font-bold text-neutral-100">VibeMeet</span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-neutral-400 hover:text-neutral-100 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Section */}
        <div className="p-4 border-b border-neutral-800/50 flex items-center justify-between">
          <span className="text-sm text-neutral-400">Account</span>
          <UserButton />
        </div>

        {/* Create Channel Button */}
        <div className="p-4">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-neutral-100 hover:bg-white text-neutral-950 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Plus size={18} />
            New Channel
          </button>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <p className="text-xs text-neutral-600 font-semibold px-2 py-2 uppercase">Channels</p>
          <div className="space-y-1">
            {channels.length === 0 ? (
              <p className="text-sm text-neutral-500 px-2 py-3">No channels yet</p>
            ) : (
              channels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => {
                    setActiveChannel(channel)
                    setIsSidebarOpen(false)
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium cursor-pointer ${
                    activeChannel?.id === channel.id
                      ? "bg-neutral-700 text-neutral-100 border border-neutral-600/50"
                      : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50"
                  }`}
                >
                  # {channel.name}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800/50">
          <p className="text-xs text-neutral-600">VibeMeet Chat v1.0</p>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-neutral-800 border-t-neutral-100 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-neutral-400 text-sm">Connecting to chat...</p>
            </div>
          </div>
        )}

        {/* Top Bar */}
        <div className="h-16 bg-linear-to-r from-neutral-900 to-neutral-950 border-b border-neutral-800/50 flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden text-neutral-400 hover:text-neutral-100 transition-colors cursor-pointer"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-lg font-bold text-neutral-100">
              {activeChannel ? `# ${activeChannel.name}` : "VibeMeet Chat"}
            </h1>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto bg-neutral-950 p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center">
              <div>
                <p className="text-neutral-100 text-lg font-semibold">Welcome to VibeMeet</p>
                <p className="text-neutral-400 text-base mt-2">Select a channel to start messaging</p>
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className="bg-neutral-900/60 border border-neutral-800/50 rounded-lg p-3 backdrop-blur-sm hover:border-neutral-700/50 transition-all duration-200"
              >
                <p className="text-neutral-300 text-sm font-medium">{msg.user}</p>
                <p className="text-neutral-400 text-sm mt-1">{msg.text}</p>
              </div>
            ))
          )}
        </div>

        {/* Message Input */}
        <div className="h-20 bg-neutral-900/50 border-t border-neutral-800/50 p-4 flex items-center gap-2">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && messageText.trim()) {
                setMessages([...messages, { user: "You", text: messageText }])
                setMessageText("")
              }
            }}
            placeholder="Type your message..."
            className="flex-1 bg-neutral-800/50 border border-neutral-700/50 rounded-lg px-4 py-2 text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-700/50 transition-all duration-200"
          />
          <button
            onClick={() => {
              if (messageText.trim()) {
                setMessages([...messages, { user: "You", text: messageText }])
                setMessageText("")
              }
            }}
            className="bg-neutral-100 hover:bg-white text-neutral-950 rounded-lg p-2 transition-all duration-300 transform hover:scale-110 active:scale-95 cursor-pointer"
          >
            <Send size={20} />
          </button>
        </div>
      </div>

      <style>{`
        * {
          transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
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

        /* Scrollbar Styling */
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(23, 23, 23, 0.5);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(115, 115, 115, 0.5);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(115, 115, 115, 0.7);
        }
      `}</style>

      <CreateChannelModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        chatClient={chatClient}
        setActiveChannel={setActiveChannel}
        setSearchParams={setSearchParams}
      />
    </div>
  )
}

export default HomePage 
