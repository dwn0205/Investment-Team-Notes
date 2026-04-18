import { useGetWeeklyAgenda } from "@workspace/api-client-react";
import { format } from "date-fns";
import { SentimentBadge, RoleBadge } from "@/components/badges";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarX2, Hash, LayoutList, User, FileText, Building2, AlertTriangle, TrendingUp, ShieldAlert } from "lucide-react";
import { ExpandedNoteView } from "@/components/expanded-note";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";

type GroupBy = "category" | "user";

const CATEGORY_LABELS: Record<string, string> = {
  pipeline: "Pipeline",
  portfolio: "Portfolio",
  generic: "Generic / Market",
};

export default function WeeklyPage() {
  const { data: agendaGroups, isLoading } = useGetWeeklyAgenda();
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<GroupBy>("category");
  const [showNegativeOnly, setShowNegativeOnly] = useState(false);

  const allNotes = useMemo(
    () => agendaGroups?.flatMap((g) => g.notes) ?? [],
    [agendaGroups]
  );

  const stats = useMemo(() => {
    const noteCount = allNotes.length;
    const companyCount = new Set(allNotes.map((n) => n.companyId).filter(Boolean)).size;

    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
    let totalRisks = 0;

    for (const note of allNotes) {
      const s = note.aiResult?.sentiment;
      if (s === "positive" || s === "neutral" || s === "negative") sentimentCounts[s]++;
      totalRisks += (note.aiResult?.keyExtraction as any)?.risks?.length ?? 0;
    }

    const max = Math.max(...Object.values(sentimentCounts));
    const dominant = Object.entries(sentimentCounts).filter(([, v]) => v === max);
    const sentimentLabel =
      dominant.length > 1 || max === 0
        ? "Mixed"
        : dominant[0][0].charAt(0).toUpperCase() + dominant[0][0].slice(1);

    return { noteCount, companyCount, totalRisks, sentimentLabel, sentimentCounts };
  }, [allNotes]);

  // Collect top risks with company attribution, deduplicated
  const keyRisks = useMemo(() => {
    const seen = new Set<string>();
    const risks: { risk: string; company: string | null }[] = [];
    for (const note of allNotes) {
      const noteRisks: string[] = (note.aiResult?.keyExtraction as any)?.risks ?? [];
      for (const r of noteRisks) {
        const key = r.toLowerCase().trim();
        if (!seen.has(key)) {
          seen.add(key);
          risks.push({ risk: r, company: note.company?.name ?? null });
        }
        if (risks.length >= 5) break;
      }
      if (risks.length >= 5) break;
    }
    return risks;
  }, [allNotes]);

  const negativeNotes = useMemo(
    () => allNotes.filter((n) => n.aiResult?.sentiment === "negative"),
    [allNotes]
  );

  const displayNotes = useMemo(
    () => (showNegativeOnly ? negativeNotes : allNotes),
    [allNotes, negativeNotes, showNegativeOnly]
  );

  const groups = useMemo(() => {
    if (!displayNotes.length) return [];

    if (groupBy === "category") {
      const order = ["pipeline", "portfolio", "generic"];
      const map = new Map<string, typeof displayNotes>();
      for (const note of displayNotes) {
        const key = note.category ?? "generic";
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(note);
      }
      return order
        .filter((k) => map.has(k))
        .map((k) => ({ key: k, label: CATEGORY_LABELS[k] ?? k, notes: map.get(k)! }));
    } else {
      const map = new Map<string, typeof displayNotes>();
      for (const note of displayNotes) {
        const key = note.user?.id ?? "unknown";
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(note);
      }
      return Array.from(map.entries()).map(([, notes]) => ({
        key: notes[0].user?.id ?? "unknown",
        label: notes[0].user?.fullName ?? "Unknown",
        sublabel: notes[0].user?.role,
        notes,
      }));
    }
  }, [displayNotes, groupBy]);

  const NoteCard = ({ note }: { note: typeof allNotes[0] }) => (
    <div key={note.id} className={`border rounded-lg shadow-sm overflow-hidden flex flex-col ${
      note.aiResult?.sentiment === "negative"
        ? "border-red-200 bg-red-50/30"
        : "border-card-border bg-card"
    }`}>
      <div
        className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${expandedNoteId === note.id ? "bg-muted/50" : ""}`}
        onClick={() => setExpandedNoteId(expandedNoteId === note.id ? null : note.id)}
      >
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-foreground">
              {format(new Date(note.noteDate), "MMM d, yyyy")}
            </span>
            {note.company && (
              <span className="text-sm font-medium text-foreground">{note.company.name}</span>
            )}
            {note.aiResult && <SentimentBadge sentiment={note.aiResult.sentiment} />}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="text-sm font-medium">{note.user?.fullName}</span>
            {note.user?.role && <RoleBadge role={note.user.role} />}
          </div>
        </div>
        <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed line-clamp-3">
          {note.content}
        </div>
      </div>
      {expandedNoteId === note.id && (
        <div className="border-t border-card-border bg-background h-[500px]">
          <ExpandedNoteView note={note} onCollapse={() => setExpandedNoteId(null)} />
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Weekly Agenda</h1>
          <p className="text-muted-foreground text-sm mt-1">Highlighted intelligence from the past 7 days flagged for discussion.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {negativeNotes.length > 0 && (
            <Button
              variant={showNegativeOnly ? "destructive" : "outline"}
              size="sm"
              className="h-8 px-3 text-xs gap-1.5"
              onClick={() => setShowNegativeOnly((v) => !v)}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              {showNegativeOnly ? "Showing negative only" : `Needs Attention (${negativeNotes.length})`}
            </Button>
          )}
          <div className="flex items-center gap-1 bg-muted rounded-md p-1 border border-border">
            <Button
              variant={groupBy === "category" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-3 text-xs gap-1.5"
              onClick={() => setGroupBy("category")}
            >
              <LayoutList className="h-3.5 w-3.5" />
              Category
            </Button>
            <Button
              variant={groupBy === "user" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-3 text-xs gap-1.5"
              onClick={() => setGroupBy("user")}
            >
              <User className="h-3.5 w-3.5" />
              User
            </Button>
          </div>
          <div className="text-sm font-medium px-3 py-1.5 bg-card border border-card-border rounded-md text-foreground">
            {format(new Date(), "MMMM d, yyyy")}
          </div>
        </div>
      </div>

      {/* Stats row */}
      {!isLoading && allNotes.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-card border border-card-border rounded-lg px-4 py-3 flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground leading-none mb-1">Notes</p>
              <p className="text-xl font-bold text-foreground leading-none">{stats.noteCount}</p>
            </div>
          </div>
          <div className="bg-card border border-card-border rounded-lg px-4 py-3 flex items-center gap-3">
            <Building2 className="h-5 w-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground leading-none mb-1">Companies</p>
              <p className="text-xl font-bold text-foreground leading-none">{stats.companyCount}</p>
            </div>
          </div>
          <div className={`border rounded-lg px-4 py-3 flex items-center gap-3 ${
            stats.sentimentLabel === "Positive" ? "bg-green-50 border-green-200" :
            stats.sentimentLabel === "Negative" ? "bg-red-50 border-red-200" :
            stats.sentimentLabel === "Neutral"  ? "bg-yellow-50 border-yellow-200" :
            "bg-card border-card-border"
          }`}>
            <TrendingUp className={`h-5 w-5 shrink-0 ${
              stats.sentimentLabel === "Positive" ? "text-green-600" :
              stats.sentimentLabel === "Negative" ? "text-red-600" :
              stats.sentimentLabel === "Neutral"  ? "text-yellow-600" :
              "text-muted-foreground"
            }`} />
            <div>
              <p className="text-xs text-muted-foreground leading-none mb-1">Sentiment</p>
              <p className={`text-base font-semibold leading-none mt-1 ${
                stats.sentimentLabel === "Positive" ? "text-green-700" :
                stats.sentimentLabel === "Negative" ? "text-red-700" :
                stats.sentimentLabel === "Neutral"  ? "text-yellow-700" :
                "text-foreground"
              }`}>{stats.sentimentLabel}</p>
            </div>
          </div>
          <div className="bg-card border border-card-border rounded-lg px-4 py-3 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground leading-none mb-1">Risks Flagged</p>
              <p className="text-xl font-bold text-foreground leading-none">{stats.totalRisks}</p>
            </div>
          </div>
        </div>
      )}

      {/* Key Risks panel */}
      {!isLoading && keyRisks.length > 0 && (
        <div className="border border-amber-200 bg-amber-50 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <h2 className="text-base font-semibold text-amber-900">Key Risks This Week</h2>
          </div>
          <ul className="space-y-2">
            {keyRisks.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-amber-900">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                <span>
                  {r.company && <span className="font-semibold">{r.company} – </span>}
                  {r.risk}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Notes groups */}
      {isLoading ? (
        <div className="space-y-8">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-8 w-64" />
              <div className="space-y-3">
                <Skeleton className="h-32 w-full rounded-md" />
                <Skeleton className="h-32 w-full rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : !allNotes.length ? (
        <div className="flex flex-col items-center justify-center p-16 text-center border border-dashed border-border rounded-lg bg-card/30">
          <CalendarX2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-foreground">No notes flagged for this week</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">
            Notes marked with "Include in Weekly Agenda" created in the last 7 days will appear here.
          </p>
        </div>
      ) : !groups.length ? (
        <div className="flex flex-col items-center justify-center p-10 text-center border border-dashed border-red-200 rounded-lg bg-red-50/30">
          <ShieldAlert className="h-10 w-10 text-red-400 mb-3" />
          <h3 className="text-base font-medium text-foreground">No negative-sentiment notes this week</h3>
        </div>
      ) : (
        <div className="space-y-10">
          {groups.map((group) => (
            <div key={group.key} className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                {groupBy === "category" ? (
                  <>
                    <Hash className="h-5 w-5 text-muted-foreground shrink-0" />
                    <h2 className="text-lg font-semibold tracking-tight">{group.label}</h2>
                    <span className="text-xs text-muted-foreground ml-1">
                      {group.notes.length} {group.notes.length === 1 ? "note" : "notes"}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex flex-col">
                      <h2 className="text-base font-semibold leading-tight">{group.label}</h2>
                      {(group as any).sublabel && (
                        <span className="text-xs text-muted-foreground uppercase tracking-wide">
                          {(group as any).sublabel}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground ml-1">
                      {group.notes.length} {group.notes.length === 1 ? "note" : "notes"}
                    </span>
                  </>
                )}
              </div>
              <div className="grid grid-cols-1 gap-4">
                {group.notes.map((note) => <NoteCard key={note.id} note={note} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
