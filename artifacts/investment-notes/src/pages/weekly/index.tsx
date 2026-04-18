import { useGetWeeklyAgenda } from "@workspace/api-client-react";
import { format } from "date-fns";
import { CategoryBadge, SentimentBadge, RoleBadge, CompanyTypeBadge } from "@/components/badges";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarX2, Hash } from "lucide-react";
import { ExpandedNoteView } from "@/components/expanded-note";
import { useState } from "react";

export default function WeeklyPage() {
  const { data: agendaGroups, isLoading } = useGetWeeklyAgenda();
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Weekly Agenda</h1>
          <p className="text-muted-foreground text-sm mt-1">Highlighted intelligence from the past 7 days flagged for discussion.</p>
        </div>
        <div className="text-sm font-medium px-3 py-1.5 bg-card border border-card-border rounded-md text-foreground">
          {format(new Date(), "MMMM d, yyyy")}
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
      ) : !agendaGroups || agendaGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-center border border-dashed border-border rounded-lg bg-card/30">
          <CalendarX2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-foreground">No notes flagged for this week</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">
            Notes marked with "Include in Weekly Agenda" created in the last 7 days will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {agendaGroups.map((group) => (
            <div key={group.groupKey} className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                {group.company ? (
                  <>
                    <h2 className="text-lg font-semibold tracking-tight">{group.company.name}</h2>
                    <CompanyTypeBadge type={group.company.type} />
                  </>
                ) : (
                  <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
                    <Hash className="h-5 w-5 text-muted-foreground" />
                    Market / General
                  </h2>
                )}
                <div className="ml-auto">
                  <CategoryBadge category={group.category} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {group.notes.map((note) => (
                  <div key={note.id} className="border border-card-border rounded-lg bg-card shadow-sm overflow-hidden flex flex-col">
                    <div 
                      className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${expandedNoteId === note.id ? 'bg-muted/50' : ''}`}
                      onClick={() => setExpandedNoteId(expandedNoteId === note.id ? null : note.id)}
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-foreground">
                            {format(new Date(note.noteDate), "MMM d, yyyy")}
                          </span>
                          <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded border border-border">
                            {note.stageAtTimeOfNote || "No stage"}
                          </span>
                          {note.aiResult && <SentimentBadge sentiment={note.aiResult.sentiment} />}
                        </div>
                        <div className="flex flex-col items-end gap-1">
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
