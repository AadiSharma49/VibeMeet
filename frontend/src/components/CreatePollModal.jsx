import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";

const CreatePollModal = ({ isOpen, onClose, onCreatePoll, isSubmitting }) => {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);

  if (!isOpen) return null;

  const updateOption = (index, value) => {
    setOptions((current) => current.map((option, optionIndex) => (optionIndex === index ? value : option)));
  };

  const addOption = () => {
    setOptions((current) => [...current, ""]);
  };

  const removeOption = (index) => {
    setOptions((current) => current.filter((_, optionIndex) => optionIndex !== index));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedQuestion = question.trim();
    const trimmedOptions = options.map((option) => option.trim()).filter(Boolean);

    if (!trimmedQuestion || trimmedOptions.length < 2) return;

    await onCreatePoll({
      question: trimmedQuestion,
      options: trimmedOptions,
    });

    setQuestion("");
    setOptions(["", ""]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-neutral-800/80 bg-neutral-900/95 shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-800/70 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">Poll</p>
            <h2 className="mt-1 text-xl font-semibold text-neutral-100">Create a poll</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-neutral-100"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300">Question</label>
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="What should we ship first?"
              className="w-full rounded-2xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-700 focus:outline-none"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-neutral-300">Options</label>
              <button
                type="button"
                onClick={addOption}
                className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-neutral-300 transition hover:border-neutral-700 hover:text-neutral-100"
              >
                <Plus size={12} />
                Add option
              </button>
            </div>

            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={`poll-option-${index}`} className="flex items-center gap-2">
                  <input
                    value={option}
                    onChange={(event) => updateOption(index, event.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1 rounded-2xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-700 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    disabled={options.length <= 2}
                    className="rounded-xl border border-neutral-800 bg-neutral-950 p-3 text-neutral-400 transition hover:border-neutral-700 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-neutral-800 bg-neutral-950 px-4 py-2 text-sm font-semibold text-neutral-300 transition hover:border-neutral-700 hover:text-neutral-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-2xl bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Creating..." : "Send Poll"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePollModal;
