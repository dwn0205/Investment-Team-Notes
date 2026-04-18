import { useGetWeeklyAgenda } from "@workspace/api-client-react";
import { format } from "date-fns";
import { CategoryBadge, SentimentBadge, RoleBadge } from "@/components/badges";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarX2, Hash, LayoutList, User } from "lucide-react";
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

  const allNotes = useMemo(
    () => agendaGroups?.flatMap((g) => g.notes) ?? [],
    [agendaGroups]
  );

  const groups = useMemo(() => {
    if (!allNotes.length) return [];

    if (groupBy === "category") {
      const order = ["pipeline", "portfolio", "generic"];
      const map = new Map<string, typeof allNotes>();
      for (const note of allNotes) {
        const key = note.category ?? "generic";
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(note);
      }
      return order
        .filter((k) => map.has(k))
        .map((k) => ({ key: k, label: CATEGORY_LABELS[k] ?? k, notes: map.get(k)! }));
    } else {
      const map = new Map<string, typeof allNotes>();
      for (const note of allNotes) {
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
  }, [allNotes, groupBy]);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Weekly Agenda</h1>
          <p className="text-muted-foreground text-sm mt-1">Highlighted intelligence from the past 7 days flagged for discussion.</p>
        </div>
        <div className="flex items-center gap-3">
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
      ) : !groups.length ? (
        <div className="flex flex-col items-center justify-center p-16 text-center border border-dashed border-border rounded-lg bg-card/30">
          <CalendarX2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-foreground">No notes flagged for this week</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">
            Notes marked with "Include in Weekly Agenda" created in the last 7 days will appear here.
          </p>
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
                {group.notes.map((note) => (
                  <div key={note.id} className="border border-card-border rounded-lg bg-card shadow-sm overflow-hidden flex flex-col">
                    <div
                      className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${expandedNoteId === note.id ? "bg-muted/50" : ""}`}
                      onClick={() => setExpandedNoteId(expandedNoteId === note.id ? null : note.id)}
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-sm font-medium text-foreground">
                            {format(new Date(note.noteDate), "MMM d, yyyy")}
                          </span>
                          <CategoryBadge category={note.category} />
                          {note.aiResult && <SentimentBadge sentiment={note.aiResult.sentiment} />}
                          {note.company && (
                            <span className="text-xs text-muted-foreground font-medium">{note.company.name}</span>
                          )}
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
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
