const ChannelInsightsPanel = ({ insights, isLoading, onRefresh }) => {
  return (
    <div className="border-b border-neutral-800/50 bg-neutral-950/90 px-4 py-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">AI Insights</p>
          <p className="mt-1 text-sm text-neutral-300">Decisions, action items, and risks from this channel</p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-300 transition hover:border-neutral-700 hover:text-neutral-100 disabled:opacity-60"
        >
          {isLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border border-neutral-800/70 bg-neutral-900/60 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Decisions</p>
          <div className="space-y-2">
            {insights?.decisions?.length ? (
              insights.decisions.slice(0, 3).map((decision, index) => (
                <div key={`${decision.title}-${index}`} className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-2">
                  <p className="text-sm text-neutral-100">{decision.title}</p>
                  <p className="mt-1 text-[11px] text-neutral-500">{decision.confidence}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-neutral-500">No decisions captured yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-800/70 bg-neutral-900/60 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Action Items</p>
          <div className="space-y-2">
            {insights?.actionItems?.length ? (
              insights.actionItems.slice(0, 3).map((item, index) => (
                <div key={`${item.task}-${index}`} className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-2">
                  <p className="text-sm text-neutral-100">{item.task}</p>
                  <p className="mt-1 text-[11px] text-neutral-500">{item.owner || "TBD"} • {item.status || "open"}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-neutral-500">No action items yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-800/70 bg-neutral-900/60 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Risks</p>
          <div className="space-y-2">
            {insights?.risks?.length ? (
              insights.risks.slice(0, 3).map((risk, index) => (
                <div key={`${risk}-${index}`} className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-2 text-sm text-neutral-200">
                  {risk}
                </div>
              ))
            ) : (
              <p className="text-sm text-neutral-500">No major risks flagged right now.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChannelInsightsPanel;
