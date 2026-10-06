import { Clock3, Trash2, X } from "lucide-react";
import type { ResearchReport } from "@workspace/api-client-react";

type HistoryPanelProps = {
  open: boolean;
  lang: "hi" | "en";
  reports: ResearchReport[];
  storageUnavailable: boolean;
  onClose: () => void;
  onSelect: (report: ResearchReport) => void;
  onDelete: (reportId: string) => void;
};

export function HistoryPanel({
  open,
  lang,
  reports,
  storageUnavailable,
  onClose,
  onSelect,
  onDelete,
}: HistoryPanelProps) {
  if (!open) return null;

  const copy =
    lang === "hi"
      ? {
          title: "हाल की reports",
          privacy:
            "ये reports सिर्फ़ इसी browser और device पर सेव होती हैं। Browser data मिटाने पर history भी हट जाएगी।",
          empty: "अभी कोई saved report नहीं है।",
          unavailable: "इस browser में report history सेव नहीं हो पा रही है।",
          close: "History बंद करें",
          delete: "यह report हटाएँ",
          open: "यह report खोलें",
        }
      : {
          title: "Recent reports",
          privacy:
            "Reports are saved only in this browser on this device. Clearing browser data also removes this history.",
          empty: "No saved reports yet.",
          unavailable: "Report history could not be saved in this browser.",
          close: "Close history",
          delete: "Delete this report",
          open: "Open this report",
        };

  return (
    <section
      id="report-history"
      aria-label={copy.title}
      className="mx-auto mb-8 max-w-[1180px] rounded-2xl border border-panel-border bg-card p-5 shadow-sm sm:p-6"
      data-testid="panel-report-history"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold">
            <Clock3 size={17} className="text-primary" />
            {copy.title}
            <span className="rounded-full bg-surface-soft px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
              {reports.length}
            </span>
          </h2>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-muted-foreground">
            {copy.privacy}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={copy.close}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          data-testid="button-close-history"
        >
          <X size={16} />
        </button>
      </div>

      {storageUnavailable && (
        <p
          role="status"
          className="mt-4 rounded-lg border border-risk-border bg-surface-risk px-3 py-2 text-xs text-risk-ink"
        >
          {copy.unavailable}
        </p>
      )}

      {reports.length === 0 ? (
        <p className="mt-5 rounded-xl bg-surface-soft px-4 py-5 text-sm text-muted-foreground">
          {copy.empty}
        </p>
      ) : (
        <ul className="mt-5 grid max-h-[380px] gap-2 overflow-y-auto sm:grid-cols-2">
          {reports.map((report) => {
            const date = new Date(report.generatedAt);
            const dateLabel = Number.isNaN(date.getTime())
              ? ""
              : date.toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                });

            return (
              <li
                key={report.id}
                className="flex min-w-0 items-stretch rounded-xl border border-panel-border bg-panel-card"
              >
                <button
                  type="button"
                  onClick={() => onSelect(report)}
                  aria-label={`${copy.open}: ${report.subject}`}
                  className="min-w-0 flex-1 rounded-l-xl p-4 text-left transition-colors hover:bg-surface-soft"
                  data-testid={`button-open-history-report-${report.id}`}
                >
                  <span className="block truncate text-sm font-bold">
                    {report.subject}
                  </span>
                  <span className="mt-1 block truncate text-[11px] text-muted-foreground">
                    {report.country}
                    {dateLabel ? ` · ${dateLabel}` : ""}
                  </span>
                  <span className="mt-2 line-clamp-2 block text-xs leading-5 text-muted-foreground">
                    {report.summary}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(report.id)}
                  aria-label={`${copy.delete}: ${report.subject}`}
                  className="grid w-11 shrink-0 place-items-center rounded-r-xl border-l border-panel-border text-muted-foreground transition-colors hover:bg-surface-risk hover:text-risk-ink"
                  data-testid={`button-delete-history-report-${report.id}`}
                >
                  <Trash2 size={15} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
