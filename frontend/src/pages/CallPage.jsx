import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { ArrowDownUp, ArrowLeft, Copy, LayoutGrid, Loader2, Monitor, Sparkles, VideoIcon } from "lucide-react";
import {
  CallControls,
  CallingState,
  PaginatedGridLayout,
  SpeakerLayout,
  StreamCall,
  StreamTheme,
  StreamVideo,
  StreamVideoClient,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import { generateCallRecap, getStreamToken } from "@/lib/api";
import "@stream-io/video-react-sdk/dist/css/styles.css";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const CallRoom = ({ callId, onLeave, layoutMode }) => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  if (callingState !== CallingState.JOINED) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center text-neutral-300">
          <div className="mx-auto mb-4 h-10 w-10 rounded-full border-2 border-neutral-700 border-t-neutral-100 animate-spin"></div>
          <p className="text-sm">Joining call {callId}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-neutral-800/70 bg-black/50">
        {layoutMode === "grid" ? <PaginatedGridLayout /> : <SpeakerLayout />}
      </div>
      <div className="mt-3 rounded-2xl border border-neutral-800/70 bg-neutral-900/80 px-2 py-2 sm:mt-4 sm:px-3 sm:py-3">
        <CallControls onLeave={onLeave} />
      </div>
    </div>
  );
};

const CallPage = () => {
  const { id: callId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const clientRef = useRef(null);
  const callRef = useRef(null);

  const [videoClient, setVideoClient] = useState(null);
  const [call, setCall] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState("");
  const [recap, setRecap] = useState(null);
  const [isGeneratingRecap, setIsGeneratingRecap] = useState(false);
  const [layoutMode, setLayoutMode] = useState("speaker");
  const [isRecapFirst, setIsRecapFirst] = useState(false);

  const cleanupClient = async () => {
    const existingCall = callRef.current;
    const existingClient = clientRef.current;

    callRef.current = null;
    clientRef.current = null;
    setCall(null);
    setVideoClient(null);

    if (existingCall) {
      await existingCall.leave().catch(() => {});
    }
    if (existingClient) {
      await existingClient.disconnectUser().catch(() => {});
    }
  };

  useEffect(() => {
    let cancelled = false;

    const initCall = async () => {
      setIsLoading(true);
      setError("");
      await cleanupClient();

      if (!callId) {
        setError("Missing call ID.");
        setIsLoading(false);
        return;
      }
      if (!STREAM_API_KEY) {
        setError("Missing Stream API key.");
        setIsLoading(false);
        return;
      }
      if (!user?.id) {
        setError("User not available.");
        setIsLoading(false);
        return;
      }

      try {
        const tokenResponse = await getStreamToken(user.id);
        if (!tokenResponse?.token) {
          throw new Error("Failed to get Stream token.");
        }

        const client = new StreamVideoClient({
          apiKey: STREAM_API_KEY,
          user: {
            id: user.id,
            name: user.fullName || "Anonymous",
            image: user.imageUrl || "",
          },
          token: tokenResponse.token,
        });

        const nextCall = client.call("default", callId);
        await nextCall.join({ create: true });

        if (cancelled) {
          await nextCall.leave().catch(() => {});
          await client.disconnectUser().catch(() => {});
          return;
        }

        clientRef.current = client;
        callRef.current = nextCall;
        setVideoClient(client);
        setCall(nextCall);
      } catch (initError) {
        setError(initError?.message || "Failed to join call.");
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    initCall();

    return () => {
      cancelled = true;
      cleanupClient();
    };
  }, [callId, user?.fullName, user?.id, user?.imageUrl]);

  const handleLeave = async () => {
    await cleanupClient();
    navigate("/", { replace: true });
  };

  const handleGenerateRecap = async () => {
    if (isGeneratingRecap || (!notes.trim() && !callId)) return;

    setIsGeneratingRecap(true);

    try {
      const response = await generateCallRecap({
        callId,
        channelName: callId,
        notes,
      });

      setRecap(response);
    } catch (recapError) {
      setRecap({
        summary: recapError?.response?.data?.message || "Failed to generate recap.",
        actionItems: [],
        followUpMessage: "",
      });
    } finally {
      setIsGeneratingRecap(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full border-2 border-neutral-700 border-t-neutral-100 animate-spin"></div>
          <p className="text-sm text-neutral-400">Setting up your video room...</p>
        </div>
      </div>
    );
  }

  if (error || !videoClient || !call) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-6">
        <div className="w-full max-w-xl rounded-3xl border border-neutral-800/70 bg-neutral-900/80 p-8 shadow-2xl">
          <div className="mb-6 inline-flex rounded-2xl bg-red-500/10 p-4 text-red-300">
            <VideoIcon className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-semibold">Unable to start call</h1>
          <p className="mt-3 text-sm leading-6 text-neutral-400">{error || "Call could not be initialized."}</p>
          <div className="mt-8">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-2xl bg-neutral-100 px-5 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to chat
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <StreamVideo client={videoClient}>
      <StreamCall call={call}>
        <StreamTheme className="str-video__theme-dark">
          <div className="h-dvh bg-neutral-950 text-neutral-100 flex flex-col">
            <div className="h-14 px-3 sm:h-16 sm:px-4 md:px-6 border-b border-neutral-800/60 bg-neutral-900/80 flex items-center justify-between gap-2">
              <Link
                to="/"
                className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-neutral-800/70 px-2.5 py-1.5 text-xs text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800/60 sm:px-3 sm:py-2 sm:text-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to chat</span>
              </Link>

              <div className="min-w-0 flex items-center gap-2 rounded-full border border-neutral-800/80 bg-neutral-950/90 px-2.5 py-1 text-[11px] text-neutral-300 sm:px-3 sm:text-xs">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                <span className="truncate">Call ID: {callId}</span>
              </div>
            </div>

            <div className="min-h-0 flex-1 p-2 sm:p-3 md:p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-neutral-800/70 bg-neutral-900/70 px-3 py-2">
                <div className="inline-flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-950 px-2 py-1">
                  <button
                    type="button"
                    onClick={() => setLayoutMode("speaker")}
                    className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition ${
                      layoutMode === "speaker" ? "bg-neutral-100 text-neutral-950" : "text-neutral-300 hover:text-neutral-100"
                    }`}
                  >
                    <Monitor size={14} />
                    Speaker
                  </button>
                  <button
                    type="button"
                    onClick={() => setLayoutMode("grid")}
                    className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition ${
                      layoutMode === "grid" ? "bg-neutral-100 text-neutral-950" : "text-neutral-300 hover:text-neutral-100"
                    }`}
                  >
                    <LayoutGrid size={14} />
                    Grid
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsRecapFirst((current) => !current)}
                  className="inline-flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs font-semibold text-neutral-300 transition hover:border-neutral-700 hover:text-neutral-100"
                >
                  <ArrowDownUp size={14} />
                  Move Recap {isRecapFirst ? "Down" : "Up"}
                </button>
              </div>

              <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className={isRecapFirst ? "order-2 xl:order-1" : "order-1"}>
                  <CallRoom callId={callId} onLeave={handleLeave} layoutMode={layoutMode} />
                </div>

                <div className={`flex min-h-0 flex-col gap-4 ${isRecapFirst ? "order-1 xl:order-2" : "order-2"}`}>
                  <div className="rounded-3xl border border-neutral-800/70 bg-neutral-900/80 p-4">
                    <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                      <Sparkles size={14} />
                      AI Call Recap
                    </div>
                    <textarea
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      rows={8}
                      placeholder="Paste quick notes, bullet points, or decisions from the call..."
                      className="w-full rounded-2xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-700 focus:outline-none"
                    />
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-xs text-neutral-500">Use this during or after a call to draft a recap post.</p>
                      <button
                        type="button"
                        onClick={handleGenerateRecap}
                        disabled={isGeneratingRecap || (!notes.trim() && !callId)}
                        className="inline-flex items-center gap-2 rounded-2xl bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isGeneratingRecap ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                        {isGeneratingRecap ? "Generating..." : "Generate Recap"}
                      </button>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto rounded-3xl border border-neutral-800/70 bg-neutral-900/75 p-4">
                    {recap ? (
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Summary</p>
                          <p className="mt-2 text-sm leading-6 text-neutral-200 whitespace-pre-wrap">{recap.summary}</p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Action Items</p>
                          <div className="mt-2 space-y-2">
                            {recap.actionItems?.length ? (
                              recap.actionItems.map((item, index) => (
                                <div key={`${item.task}-${index}`} className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-3">
                                  <p className="text-sm text-neutral-100">{item.task}</p>
                                  <p className="mt-1 text-xs text-neutral-500">
                                    {item.owner || "TBD"} • {item.status || "open"}
                                  </p>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-neutral-500">No action items extracted yet.</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Follow-Up Message</p>
                            {recap.followUpMessage ? (
                              <button
                                type="button"
                                onClick={() => navigator.clipboard?.writeText(recap.followUpMessage)}
                                className="inline-flex items-center gap-1 rounded-full border border-neutral-800 bg-neutral-950 px-3 py-1 text-xs text-neutral-300 transition hover:border-neutral-700 hover:text-neutral-100"
                              >
                                <Copy size={12} />
                                Copy
                              </button>
                            ) : null}
                          </div>
                          <div className="mt-2 rounded-2xl border border-neutral-800 bg-neutral-950/70 p-3 text-sm leading-6 text-neutral-200 whitespace-pre-wrap">
                            {recap.followUpMessage || "No follow-up draft yet."}
                          </div>
                          {recap.meta?.message ? (
                            <p className="mt-2 text-xs text-neutral-500">{recap.meta.message}</p>
                          ) : null}
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center text-center text-neutral-500">
                        Add a few call notes, then let AI turn them into a clean recap.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <style>{`
              .str-video__call-controls {
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
                gap: 8px;
              }

              .str-video__call-controls button {
                min-width: 42px;
                min-height: 42px;
              }

              @media (max-width: 640px) {
                .str-video__speaker-layout__wrapper {
                  height: 100%;
                }

                .str-video__call-controls button {
                  min-width: 38px;
                  min-height: 38px;
                }
              }
            `}</style>
          </div>
        </StreamTheme>
      </StreamCall>
    </StreamVideo>
  );
};

export default CallPage;
