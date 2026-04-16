import { useState } from "react";
import { MoreVertical, Circle, Moon, Eye, EyeOff } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updatePresenceStatus } from "@/lib/api";
import toast from "react-hot-toast";

const presenceOptions = [
  { value: "online", label: "Online", color: "bg-green-500", icon: Circle },
  { value: "dnd", label: "Do Not Disturb", color: "bg-red-500", icon: MoreVertical },
  { value: "sleep", label: "Sleep", color: "bg-blue-400", icon: Moon },
  { value: "invisible", label: "Invisible", color: "bg-gray-400", icon: EyeOff },
];

const PresenceSelector = ({ currentStatus = "online" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: updatePresenceStatus,
    onSuccess: (data) => {
      queryClient.setQueryData(["current-user-profile"], (old) => ({
        ...old,
        user: { ...old?.user, presenceStatus: data.presenceStatus },
      }));
      toast.success(`Status changed to ${presenceOptions.find(o => o.value === data.presenceStatus)?.label}`);
      setIsOpen(false);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to update status");
    },
  });

  const currentOption = presenceOptions.find(o => o.value === currentStatus) || presenceOptions[0];
  const handleStatusChange = (newStatus) => {
    if (newStatus === currentStatus) {
      setIsOpen(false);
      return;
    }
    mutation.mutate(newStatus);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-neutral-800 bg-neutral-900/80 hover:border-neutral-700 transition-colors"
      >
        <span className={`w-2.5 h-2.5 rounded-full ${currentOption.color}`} />
        <span className="text-xs text-neutral-300 hidden sm:inline">
          {currentOption.label}
        </span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-full left-0 mb-2 w-48 rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl z-50 overflow-hidden">
            <div className="p-2">
              {presenceOptions.map((option) => {
                const isSelected = option.value === currentStatus;
                
                return (
                  <button
                    key={option.value}
                    onClick={() => handleStatusChange(option.value)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                      isSelected 
                        ? "bg-neutral-800 text-neutral-100" 
                        : "text-neutral-300 hover:bg-neutral-800/50 hover:text-neutral-100"
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${option.color}`} />
                    <span className="text-sm">{option.label}</span>
                    {isSelected && (
                      <span className="ml-auto text-xs text-neutral-500">Active</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PresenceSelector;
