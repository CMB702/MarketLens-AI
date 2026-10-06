import { useCallback, useEffect, useRef, useState } from "react";
import type { ResearchReport } from "@workspace/api-client-react";

const STORAGE_KEY = "marketlens:report-history:v1";
const MAX_REPORTS = 20;

type HistoryState = {
  reports: ResearchReport[];
  storageUnavailable: boolean;
};

function isResearchReport(value: unknown): value is ResearchReport {
  if (!value || typeof value !== "object") return false;
  const report = value as Partial<ResearchReport>;
  return (
    typeof report.id === "string" &&
    typeof report.subject === "string" &&
    typeof report.country === "string" &&
    typeof report.generatedAt === "string" &&
    Array.isArray(report.sources) &&
    Array.isArray(report.validationPlan)
  );
}

function loadHistory(): HistoryState {
  if (typeof window === "undefined") {
    return { reports: [], storageUnavailable: false };
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return { reports: [], storageUnavailable: false };

    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return { reports: [], storageUnavailable: true };
    }

    return {
      reports: parsed.filter(isResearchReport).slice(0, MAX_REPORTS),
      storageUnavailable: false,
    };
  } catch {
    return { reports: [], storageUnavailable: true };
  }
}

export function useReportHistory() {
  const [state, setState] = useState<HistoryState>(loadHistory);
  const skipInitialWrite = useRef(true);

  useEffect(() => {
    if (skipInitialWrite.current) {
      skipInitialWrite.current = false;
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.reports));
      setState((current) =>
        current.storageUnavailable
          ? { ...current, storageUnavailable: false }
          : current,
      );
    } catch {
      setState((current) =>
        current.storageUnavailable
          ? current
          : { ...current, storageUnavailable: true },
      );
    }
  }, [state.reports]);

  const saveReport = useCallback((report: ResearchReport) => {
    setState((current) => ({
      ...current,
      reports: [
        report,
        ...current.reports.filter((saved) => saved.id !== report.id),
      ].slice(0, MAX_REPORTS),
    }));
  }, []);

  const removeReport = useCallback((reportId: string) => {
    setState((current) => ({
      ...current,
      reports: current.reports.filter((report) => report.id !== reportId),
    }));
  }, []);

  return {
    history: state.reports,
    storageUnavailable: state.storageUnavailable,
    saveReport,
    removeReport,
  };
}
