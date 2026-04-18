import { NoteWithDetails } from "@workspace/api-client-react";
import { format } from "date-fns";
import { useGetNoteAiResult, useRerunNoteAi, useUpdateNote, getGetNoteQueryKey, getListNotesQueryKey, useGetNoteVersions } from "@workspace/api-client-react";
import { useState } from "react";
import { useActiveUser } from "@/contexts/user-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, History, RefreshCw, AlertTriangle, Check, X, Clock, User as UserIcon, CalendarCheck } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import { SentimentBadge } from "@/components/badges";
import { toast } from "sonner";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerDescription } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

export function ExpandedNoteView({ note, onCollapse }: { note: NoteWithDetails, onCollapse: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(note.content);
  const [editReason, setEditReason] = useState("");
  const [includeInWeekly, setIncludeInWeekly] = useState(note.includeInWeekly);
  
  const { activeUser } = useActiveUser();
  const queryClient = useQueryClient();
  const updateNote = useUpdateNote();
  const rerunAi = useRerunNoteAi();
  
  const { data: aiResult, isLoading: aiLoading } = useGetNoteAiResult(note.id, {
    query: { enabled: true, queryKey: [`/api/notes/${note.id}/ai`] }
  });

  const { data: versions } = useGetNoteVersions(note.id, {
    query: { enabled: true, queryKey: [`/api/notes/${note.id}/versions`] }
  });

  const handleSave = () => {
    if (!content.trim()) return;
    updateNote.mutate({ id: note.id, data: { content, includeInWeekly, editReason: editReason || "General update", editedByUserId: activeUser?.id } }, {
      onSuccess: () => {
        toast.success("Note updated successfully");
        setIsEditing(false);
        setEditReason("");
        queryClient.invalidateQueries({ queryKey: [`/api/notes`] });
        queryClient.invalidateQueries({ queryKey: [`/api/notes/${note.id}/versions`] });
      },
      onError: () => toast.error("Failed to update note")
    });
  };

  const handleRerunAi = () => {
    rerunAi.mutate({ id: note.id }, {
      onSuccess: () => {
        toast.success("AI analysis scheduled");
        queryClient.invalidateQueries({ queryKey: [`/api/notes/${note.id}/ai`] });
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 h-full divide-y lg:divide-y-0 lg:divide-x divide-card-border">
      {/* Left: Content Edit/View */}
      <div className="col-span-2 p-6 flex flex-col h-full bg-card/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">Note Content</h3>
            {note.versionCount > 1 && (
              <Drawer>
                <DrawerTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-xs bg-background">
                    <History className="h-3 w-3 mr-1.5" />
                    v{note.versionCount} History
                  </Button>
                </DrawerTrigger>
                <DrawerContent className="h-[85vh]">
                  <DrawerHeader>
                    <DrawerTitle>Version History</DrawerTitle>
                    <DrawerDescription>Changes made to this note over time</DrawerDescription>
                  </DrawerHeader>
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-6 max-w-3xl mx-auto pb-10">
                      {versions?.map((v, i) => (
                        <div key={v.id} className="relative pl-6 pb-6 border-l border-border last:border-0 last:pb-0">
                          <div className="absolute left-[-5px] top-0 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-sm">v{versions.length - i}</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(v.createdAt), "MMM d, yyyy HH:mm")}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <UserIcon className="h-3 w-3 ml-2" />
                              {v.user?.fullName}
                            </span>
                          </div>
                          {v.editReason && (
                            <p className="text-xs font-medium text-primary mb-2">Reason: {v.editReason}</p>
                          )}
                          <div className="p-3 bg-muted/30 rounded-md text-sm font-mono whitespace-pre-wrap border border-border/50">
                            {v.contentSnapshot}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </DrawerContent>
              </Drawer>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>Edit Note</Button>
            ) : (
              <>
                {activeUser && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1 mr-1">
                    <UserIcon className="h-3 w-3" /> {activeUser.fullName}
                  </span>
                )}
                <Button variant="ghost" size="sm" onClick={() => { setIsEditing(false); setContent(note.content); setIncludeInWeekly(note.includeInWeekly); }}>Cancel</Button>
                <Button size="sm" onClick={handleSave} disabled={updateNote.isPending || !content.trim()}>
                  {updateNote.isPending ? <RefreshCw className="h-3 w-3 mr-2 animate-spin" /> : <Check className="h-3 w-3 mr-2" />}
                  Save
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" onClick={onCollapse} className="h-8 w-8 rounded-full"><X className="h-4 w-4"/></Button>
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-3 flex-1 flex flex-col">
            <Textarea 
              value={content}
              onChange={e => setContent(e.target.value)}
              className="flex-1 min-h-[200px] resize-none font-mono text-sm leading-relaxed p-4 bg-background border-input focus-visible:ring-1"
            />
            <Input 
              placeholder="Reason for edit (optional)" 
              value={editReason}
              onChange={e => setEditReason(e.target.value)}
              className="bg-background"
            />
            {activeUser?.role === "director" && (
              <div className="flex items-center gap-2 pt-1">
                <Checkbox
                  id="includeInWeekly"
                  checked={includeInWeekly}
                  onCheckedChange={(v) => setIncludeInWeekly(!!v)}
                />
                <Label htmlFor="includeInWeekly" className="text-sm font-normal cursor-pointer flex items-center gap-1.5">
                  <CalendarCheck className="h-3.5 w-3.5 text-muted-foreground" />
                  Include in Weekly Agenda
                </Label>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 p-4 bg-background rounded-md border border-card-border overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed">
            {note.content}
          </div>
        )}
      </div>

      {/* Right: AI Panel */}
      <div className="p-6 bg-sidebar/20 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Intelligence</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={handleRerunAi} disabled={rerunAi.isPending} className="h-8 text-xs px-2">
            <RefreshCw className={`h-3 w-3 mr-1.5 ${rerunAi.isPending ? 'animate-spin' : ''}`} />
            Re-run
          </Button>
        </div>

        {aiLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : aiResult ? (
          <div className="space-y-6 overflow-y-auto flex-1 pr-2 custom-scrollbar">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Sentiment</h4>
              <SentimentBadge sentiment={aiResult.sentiment} />
            </div>

            {aiResult.keyExtraction.risks && aiResult.keyExtraction.risks.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" /> Key Risks
                </h4>
                <ul className="space-y-2">
                  {aiResult.keyExtraction.risks.map((risk, i) => (
                    <li key={i} className="text-sm p-2 rounded bg-red-50 text-red-700 border border-red-200 leading-snug">
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-border rounded-lg bg-background/50">
            <Sparkles className="h-8 w-8 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No AI analysis available for this note yet.</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={handleRerunAi} disabled={rerunAi.isPending}>
              Generate Analysis
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
