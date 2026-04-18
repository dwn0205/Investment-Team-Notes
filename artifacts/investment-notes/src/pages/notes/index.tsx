import { useListNotes, useListCompanies, useListUsers } from "@workspace/api-client-react";
import { useState } from "react";
import { format } from "date-fns";
import { CategoryBadge, SentimentBadge, RoleBadge, CompanyTypeBadge } from "@/components/badges";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal, ChevronDown, ChevronRight, FileText } from "lucide-react";
import { ExpandedNoteView } from "@/components/expanded-note";

export default function NotesPage() {
  const [category, setCategory] = useState<string>("all");
  const [companyId, setCompanyId] = useState<string>("all");
  const [authorId, setAuthorId] = useState<string>("all");
  
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);

  const { data: notes, isLoading } = useListNotes({
    category: category !== "all" ? category as any : undefined,
    companyId: companyId !== "all" ? companyId : undefined,
    authorId: authorId !== "all" ? authorId : undefined,
  });

  const { data: companies } = useListCompanies();
  const { data: users } = useListUsers();

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">All Notes</h1>
          <p className="text-muted-foreground text-sm mt-1">Intelligence and deal activity across all stages.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search notes..." className="pl-9 bg-card border-card-border focus-visible:ring-primary shadow-sm" />
          </div>
          
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[140px] bg-card border-card-border shadow-sm">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="generic">Generic</SelectItem>
              <SelectItem value="pipeline">Pipeline</SelectItem>
              <SelectItem value="portfolio">Portfolio</SelectItem>
            </SelectContent>
          </Select>

          <Select value={companyId} onValueChange={setCompanyId}>
            <SelectTrigger className="w-[160px] bg-card border-card-border shadow-sm">
              <SelectValue placeholder="Company" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Companies</SelectItem>
              {companies?.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border border-card-border bg-card shadow-sm overflow-hidden">
        <div className="grid grid-cols-[100px_minmax(120px,1fr)_120px_100px_minmax(200px,2fr)_150px_40px] gap-4 p-3 border-b border-card-border bg-muted/30 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <div>Date</div>
          <div>Company</div>
          <div>Category</div>
          <div>Stage</div>
          <div>Content Preview</div>
          <div>Author</div>
          <div className="text-right"></div>
        </div>

        <div className="divide-y divide-card-border">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 flex gap-4 items-center">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))
          ) : notes?.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center">
              <FileText className="h-10 w-10 mb-3 text-muted-foreground/50" />
              <h3 className="font-medium text-foreground">No notes found</h3>
              <p className="text-sm mt-1">Try adjusting your filters or create a new note.</p>
            </div>
          ) : (
            notes?.map((note) => (
              <div key={note.id} className="flex flex-col group">
                <div 
                  className={`grid grid-cols-[100px_minmax(120px,1fr)_120px_100px_minmax(200px,2fr)_150px_40px] gap-4 p-3 items-center hover:bg-muted/50 cursor-pointer transition-colors ${expandedNoteId === note.id ? 'bg-muted/50' : ''}`}
                  onClick={() => setExpandedNoteId(expandedNoteId === note.id ? null : note.id)}
                >
                  <div className="text-sm font-medium whitespace-nowrap text-foreground/80">
                    {format(new Date(note.noteDate), "MMM d, yyyy")}
                  </div>
                  
                  <div className="flex flex-col items-start gap-1 overflow-hidden">
                    {note.company ? (
                      <>
                        <span className="font-medium text-sm truncate w-full text-foreground">{note.company.name}</span>
                        <CompanyTypeBadge type={note.company.type} />
                      </>
                    ) : (
                      <span className="text-muted-foreground text-sm italic">N/A</span>
                    )}
                  </div>
                  
                  <div><CategoryBadge category={note.category} /></div>
                  
                  <div className="text-sm text-muted-foreground capitalize">
                    {note.stageAtTimeOfNote || '-'}
                  </div>
                  
                  <div className="truncate text-sm text-muted-foreground pr-4 flex items-center gap-2">
                    {note.aiResult && <SentimentBadge sentiment={note.aiResult.sentiment} />}
                    <span className="truncate">{note.content}</span>
                  </div>
                  
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-sm truncate w-full">{note.user?.fullName}</span>
                    {note.user?.role && <RoleBadge role={note.user.role} />}
                  </div>

                  <div className="text-right text-muted-foreground">
                    {expandedNoteId === note.id ? <ChevronDown className="h-4 w-4 inline" /> : <ChevronRight className="h-4 w-4 inline" />}
                  </div>
                </div>

                {expandedNoteId === note.id && (
                  <div className="p-0 border-t border-card-border bg-background shadow-inner">
                    <ExpandedNoteView note={note} onCollapse={() => setExpandedNoteId(null)} />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
