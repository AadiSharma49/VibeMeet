import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  LoaderCircle,
  Save,
  ShieldCheck,
  UserRound,
  MessageSquareLock,
  FolderPlus,
} from "lucide-react";
import { getCurrentUserProfile, updateCurrentUserProfile } from "@/lib/api";

const splitName = (fullName = "") => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (!parts.length) {
    return { firstName: "", lastName: "" };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
};

const ToggleCard = ({
  icon,
  title,
  description,
  enabled,
  activeClasses,
  inactiveClasses,
  badgeClasses,
  switchClasses,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-2xl border p-5 text-left transition-all ${enabled ? activeClasses : inactiveClasses}`}
  >
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <div
            className={`rounded-xl p-2 ${
              enabled ? badgeClasses : "bg-neutral-800 text-neutral-400"
            }`}
          >
            {icon}
          </div>
          <div>
            <p className="font-medium text-neutral-100">{title}</p>
            <p className="mt-1 text-sm text-neutral-500">{description}</p>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
            enabled ? badgeClasses : "bg-neutral-800 text-neutral-400"
          }`}
        >
          {enabled ? "On" : "Off"}
        </span>
        <span
          className={`relative h-7 w-12 rounded-full transition-all ${
            enabled ? switchClasses : "bg-neutral-700"
          }`}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
              enabled ? "translate-x-6" : "translate-x-1"
            }`}
          ></span>
        </span>
      </div>
    </div>
  </button>
);

const AccountPage = () => {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const [draft, setDraft] = useState({});

  const { data, isLoading } = useQuery({
    queryKey: ["current-user-profile"],
    queryFn: getCurrentUserProfile,
  });

  const profileDefaults = useMemo(
    () => ({
      name: data?.user?.name || user?.fullName || "",
      username: data?.user?.username || "",
      bio: data?.user?.bio || "",
      status: data?.user?.status || "",
      allowDirectMessages: data?.user?.allowDirectMessages !== false,
      allowChannelCreation: data?.user?.allowChannelCreation !== false,
    }),
    [data, user?.fullName]
  );

  const form = {
    ...profileDefaults,
    ...draft,
  };

  const profileCardName = useMemo(
    () => form.name.trim() || user?.fullName || "Your Name",
    [form.name, user?.fullName]
  );

  const saveProfileMutation = useMutation({
    mutationFn: async (payload) => {
      const trimmedName = payload.name.trim();
      const { firstName, lastName } = splitName(trimmedName);

      if (user) {
        await user.update({
          firstName,
          lastName,
        });
      }

      return updateCurrentUserProfile({
        ...payload,
        name: trimmedName,
      });
    },
    onSuccess: (response) => {
      queryClient.setQueryData(["current-user-profile"], response);
      queryClient.invalidateQueries({ queryKey: ["current-user-profile"] });
      queryClient.invalidateQueries({ queryKey: ["streamToken"] });
      setDraft({});
      toast.success("Profile updated");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to update profile");
    },
  });

  const handleChange = (field, value) => {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    saveProfileMutation.mutate(form);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-neutral-100">
        <LoaderCircle className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 lg:flex-row">
        <div className="w-full lg:w-[420px]">
          <div className="sticky top-8 overflow-hidden rounded-3xl border border-neutral-800/70 bg-linear-to-br from-neutral-900 via-neutral-950 to-black">
            <div className="border-b border-neutral-800/60 p-6">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-sm text-neutral-400 transition-colors hover:text-neutral-100"
              >
                <ArrowLeft size={16} />
                Back to chat
              </Link>
            </div>

            <div className="p-6">
              <div className="mb-6 flex items-center gap-4">
                {user?.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt={profileCardName}
                    className="h-16 w-16 rounded-2xl object-cover ring-1 ring-neutral-700/70"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-800 text-neutral-100 ring-1 ring-neutral-700/70">
                    <UserRound size={24} />
                  </div>
                )}
                <div className="min-w-0">
                  <h1 className="truncate text-2xl font-bold">{profileCardName}</h1>
                  <p className="truncate text-sm text-neutral-400">
                    {form.username ? `@${form.username}` : "No username yet"}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-neutral-800/70 bg-neutral-900/80 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Status</p>
                  <p className="mt-2 text-sm text-neutral-200">
                    {form.status || "No status set"}
                  </p>
                </div>

                <div className="rounded-2xl border border-neutral-800/70 bg-neutral-900/80 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">About</p>
                  <p className="mt-2 text-sm text-neutral-200">
                    {form.bio || "Tell people a little about yourself."}
                  </p>
                </div>

                <div className="rounded-2xl border border-neutral-800/70 bg-neutral-900/80 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                    Permissions Preview
                  </p>
                  <div className="mt-3 space-y-2 text-sm text-neutral-300">
                    <div className="flex items-center gap-2">
                      <MessageSquareLock
                        size={15}
                        className={form.allowDirectMessages ? "text-green-400" : "text-neutral-500"}
                      />
                      <span>
                        {form.allowDirectMessages
                          ? "People can direct message you"
                          : "Direct messages are restricted"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FolderPlus
                        size={15}
                        className={form.allowChannelCreation ? "text-blue-400" : "text-neutral-500"}
                      />
                      <span>
                        {form.allowChannelCreation
                          ? "You can create channels"
                          : "Channel creation is disabled"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1">
          <form
            onSubmit={handleSubmit}
            className="overflow-hidden rounded-3xl border border-neutral-800/70 bg-neutral-900/70 shadow-2xl backdrop-blur"
          >
            <div className="border-b border-neutral-800/60 p-6">
              <div className="flex items-center gap-3">
                <ShieldCheck className="text-neutral-400" size={20} />
                <div>
                  <h2 className="text-xl font-semibold">Profile & Permissions</h2>
                  <p className="mt-1 text-sm text-neutral-400">
                    Keep your identity clean, set chat visibility, and control who can reach you.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 p-6 md:grid-cols-2">
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-neutral-300">Display Name</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => handleChange("name", event.target.value)}
                  placeholder="Your display name"
                  className="w-full rounded-2xl border border-neutral-700/70 bg-neutral-950/70 px-4 py-3 text-sm text-neutral-100 outline-none transition-colors focus:border-neutral-500"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-neutral-300">Username</span>
                <input
                  type="text"
                  value={form.username}
                  onChange={(event) => handleChange("username", event.target.value)}
                  placeholder="your-handle"
                  className="w-full rounded-2xl border border-neutral-700/70 bg-neutral-950/70 px-4 py-3 text-sm text-neutral-100 outline-none transition-colors focus:border-neutral-500"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-neutral-300">Status</span>
                <input
                  type="text"
                  value={form.status}
                  onChange={(event) => handleChange("status", event.target.value)}
                  placeholder="Working, gaming, available..."
                  maxLength={60}
                  className="w-full rounded-2xl border border-neutral-700/70 bg-neutral-950/70 px-4 py-3 text-sm text-neutral-100 outline-none transition-colors focus:border-neutral-500"
                />
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-neutral-300">Bio</span>
                <textarea
                  value={form.bio}
                  onChange={(event) => handleChange("bio", event.target.value)}
                  placeholder="A short intro for your profile"
                  maxLength={160}
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-neutral-700/70 bg-neutral-950/70 px-4 py-3 text-sm text-neutral-100 outline-none transition-colors focus:border-neutral-500"
                />
                <p className="text-xs text-neutral-500">{form.bio.length}/160</p>
              </label>

              <ToggleCard
                icon={<MessageSquareLock size={16} />}
                title="Allow Direct Messages"
                description="When this is off, your profile will not appear in the DM discovery list."
                enabled={form.allowDirectMessages}
                activeClasses="border-green-500/30 bg-green-500/8 hover:border-green-400/50"
                inactiveClasses="border-neutral-800/70 bg-neutral-950/60 hover:border-neutral-700"
                badgeClasses="bg-green-500/15 text-green-300"
                switchClasses="bg-green-500/90"
                onClick={() =>
                  handleChange("allowDirectMessages", !form.allowDirectMessages)
                }
              />

              <ToggleCard
                icon={<FolderPlus size={16} />}
                title="Allow Channel Creation"
                description="Use this if you want to join chats without creating your own channels."
                enabled={form.allowChannelCreation}
                activeClasses="border-blue-500/30 bg-blue-500/8 hover:border-blue-400/50"
                inactiveClasses="border-neutral-800/70 bg-neutral-950/60 hover:border-neutral-700"
                badgeClasses="bg-blue-500/15 text-blue-300"
                switchClasses="bg-blue-500/90"
                onClick={() =>
                  handleChange("allowChannelCreation", !form.allowChannelCreation)
                }
              />
            </div>

            <div className="flex items-center justify-between border-t border-neutral-800/60 bg-neutral-950/50 px-6 py-4">
              <p className="text-sm text-neutral-500">
                Profile updates will be reflected in chat after save.
              </p>
              <button
                type="submit"
                disabled={saveProfileMutation.isPending}
                className="inline-flex items-center gap-2 rounded-2xl bg-neutral-100 px-5 py-3 text-sm font-semibold text-neutral-950 transition-all hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saveProfileMutation.isPending ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
