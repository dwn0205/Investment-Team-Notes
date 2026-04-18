import { useState, useMemo } from "react";
import { useListCompanies, useGetQuarterlySummary, useGenerateQuarterlySummary } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2, TrendingUp, TrendingDown, Minus, AlertTriangle,
  Lightbulb, FileText, RefreshCw, ChevronDown, ChevronRight, BarChart2,
} from "lucide-react";
import { SentimentBadge, RoleBadge } from "@/components/badges";
import { ExpandedNoteView } from "@/components/expanded-note";

function computePerformanceDirection(notes: any[]): "improving" | "stable" | "deteriorating" {
  const sentiments = notes.map((n) => n.aiResult?.sentiment).filter(Boolean);
  if (!sentiments.length) return "stable";
  const pos = sentiments.filter((s) => s === "positive").length;
  const neg = sentiments.filter((s) => s === "negative").length;
  const total = sentiments.length;
  if (pos / total > 0.6) return "improving";
  if (neg / total > 0.6) return "deteriorating";
  return "stable";
}

const DIRECTION_CONFIG = {
  improving: {
    label: "Improving",
    icon: TrendingUp,
    classes: "bg-green-50 border-green-200 text-green-800",
    iconClass: "text-green-600",
  },
  stable: {
    label: "Stable",
    icon: Minus,
    classes: "bg-gray-50 border-gray-200 text-gray-700",
    iconClass: "text-gray-500",
  },
  deteriorating: {
    label: "Deteriorating",
    icon: TrendingDown,
    classes: "bg-red-50 border-red-200 text-red-800",
    iconClass: "text-red-600",
  },
};

export default function QuarterlyPage() {
  const currentYear = new Date().getFullYear();
  const currentQuarter = Math.floor((new Date().getMonth() + 3) / 3);

  const [companyId, setCompanyId] = useState<string>("");
  const [year, setYear] = useState<number>(currentYear);
  const [quarter, setQuarter] = useState<number>(currentQuarter);
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
  const [notesOpen, setNotesOpen] = useState(true);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const { data: allCompanies } = useListCompanies();
  const portfolioCompanies = useMemo(
    () => (allCompanies ?? []).filter((c: any) => c.type === "portfolio"),
    [allCompanies]
  );

  const { data: quarterlyView, isLoading, refetch } = useGetQuarterlySummary(
    companyId,
    year,
    quarter,
    { query: { enabled: !!companyId, queryKey: [`/api/companies/${companyId}/quarterly`, year, quarter] } }
  );

  const generateSummary = useGenerateQuarterlySummary();

  const handleGenerate = () => {
    if (!companyId) return;
    setGenerateError(null);
    generateSummary.mutate(
      { companyId, year, quarter },
      {
        onSuccess: () => refetch(),
        onError: (err: any) => {
          setGenerateError(err?.message ?? "Failed to generate summary. Please try again.");
        },
      }
    );
  };

  const performanceDirection = useMemo(
    () => computePerformanceDirection(quarterlyView?.notes ?? []),
    [quarterlyView?.notes]
  );

  const dirConfig = DIRECTION_CONFIG[performanceDirection];
  const DirIcon = dirConfig.icon;

  const selectedCompany = portfolioCompanies.find((c) => c.id === companyId);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Quarterly Portfolio View</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Synthesized intelligence per company and quarter. Portfolio companies only.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-end gap-4 p-5 bg-card border border-card-border rounded-lg">
        <div className="flex-1 min-w-[200px] space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Company</label>
          <Select value={companyId} onValueChange={(v) => { setCompanyId(v); setGenerateError(null); }}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select portfolio company..." />
            </SelectTrigger>
            <SelectContent>
              {portfolioCompanies.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Year</label>
          <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
            <SelectTrigger className="bg-background w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Quarter</label>
          <Select value={quarter.toString()} onValueChange={(v) => setQuarter(parseInt(v))}>
            <SelectTrigger className="bg-background w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4].map((q) => (
                <SelectItem key={q} value={q.toString()}>Q{q}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={!companyId || generateSummary.isPending || (!!quarterlyView && !quarterlyView.notes.length)}
          className="gap-2"
        >
          {generateSummary.isPending
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
            : quarterlyView?.summary
              ? <><RefreshCw className="h-4 w-4" /> Regenerate</>
              : "Generate Summary"
          }
        </Button>
      </div>

      {/* Error banner */}
      {generateError && (
        <div className="flex items-center gap-3 p-4 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {generateError}
        </div>
      )}

      {/* Empty state — no company */}
      {!companyId && (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-lg bg-card/30">
          <BarChart2 className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium text-foreground">Select a portfolio company</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Choose a company, year, and quarter to view or generate its quarterly intelligence summary.
          </p>
        </div>
      )}

      {/* Loading */}
      {companyId && isLoading && (
        <div className="space-y-4 p-6 bg-card border border-card-border rounded-lg">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      )}

      {/* Content */}
      {companyId && !isLoading && quarterlyView && (
        <div className="space-y-5">

          {/* Company + period heading */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {selectedCompany?.name}
                <span className="ml-2 text-muted-foreground font-normal text-base">
                  Q{quarter} {year}
                </span>
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {quarterlyView.notes.length} note{quarterlyView.notes.length !== 1 ? "s" : ""} in this quarter
              </p>
            </div>
            {quarterlyView.summary && (
              <SentimentBadge sentiment={quarterlyView.summary.overallSentiment} />
            )}
          </div>

          {/* No summary yet */}
          {!quarterlyView.summary ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-lg bg-card/30">
              <FileText className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <h3 className="text-base font-medium mb-1">No summary generated yet</h3>
              <p className="text-sm text-muted-foreground mb-5 max-w-md">
                {quarterlyView.notes.length
                  ? `${quarterlyView.notes.length} notes available. Click "Generate Summary" above to synthesize key themes and risks.`
                  : "No notes found for this company and quarter."}
              </p>
            </div>
          ) : (
            <div className="space-y-5">

              {/* Performance Direction */}
              <div className={`flex items-center gap-3 px-5 py-4 rounded-lg border ${dirConfig.classes}`}>
                <DirIcon className={`h-5 w-5 shrink-0 ${dirConfig.iconClass}`} />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider opacity-70 mb-0.5">Performance Direction</p>
                  <p className="text-base font-semibold">{dirConfig.label}</p>
                </div>
              </div>

              {/* Summary */}
              <div className="p-5 bg-card border border-card-border rounded-lg space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Executive Summary</h3>
                <div className="space-y-2">
                  {quarterlyView.summary.summaryText
                    .split("\n")
                    .filter((line: string) => line.trim())
                    .map((line: string, i: number) => (
                      <p key={i} className="text-sm leading-relaxed text-foreground">
                        {line.startsWith("•") ? line : `• ${line}`}
                      </p>
                    ))}
                </div>
              </div>

              {/* Risks + Themes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Risks */}
                {quarterlyView.summary.risks?.length > 0 && (
                  <div className="p-5 bg-card border border-card-border rounded-lg space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" /> Key Risks
                    </h3>
                    <ul className="space-y-2">
                      {quarterlyView.summary.risks.slice(0, 5).map((risk: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Themes */}
                {quarterlyView.summary.keyThemes?.length > 0 && (
                  <div className="p-5 bg-card border border-card-border rounded-lg space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-blue-500" /> Key Themes
                    </h3>
                    <ul className="space-y-2">
                      {quarterlyView.summary.keyThemes.map((theme: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
                          {theme}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                Generated {format(new Date(quarterlyView.summary.generatedAt), "MMM d, yyyy 'at' HH:mm")}
              </p>
            </div>
          )}

          {/* Notes Table */}
          {quarterlyView.notes.length > 0 && (
            <div className="border border-card-border rounded-lg bg-card overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-semibold text-foreground hover:bg-muted/40 transition-colors border-b border-card-border"
                onClick={() => setNotesOpen((v) => !v)}
              >
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Underlying Notes ({quarterlyView.notes.length})
                </span>
                {notesOpen
                  ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                }
              </button>

              {notesOpen && (
                <div className="divide-y divide-border">
                  {[...quarterlyView.notes]
                    .sort((a, b) => new Date(a.noteDate).getTime() - new Date(b.noteDate).getTime())
                    .map((note) => (
                      <div key={note.id} className="flex flex-col">
                        <div
                          className={`px-5 py-4 hover:bg-muted/40 cursor-pointer transition-colors ${expandedNoteId === note.id ? "bg-muted/40" : ""}`}
                          onClick={() => setExpandedNoteId(expandedNoteId === note.id ? null : note.id)}
                        >
                          <div className="flex items-center justify-between gap-4 mb-1.5">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-medium text-foreground">
                                {format(new Date(note.noteDate), "MMM d, yyyy")}
                              </span>
                              {note.aiResult && <SentimentBadge sentiment={note.aiResult.sentiment} />}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs text-muted-foreground">{note.user?.fullName}</span>
                              {note.user?.role && <RoleBadge role={note.user.role} />}
                              {expandedNoteId === note.id
                                ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              }
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{note.content}</p>
                        </div>

                        {expandedNoteId === note.id && (
                          <div className="h-[420px] border-t border-card-border bg-background">
                            <ExpandedNoteView note={note} onCollapse={() => setExpandedNoteId(null)} />
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
