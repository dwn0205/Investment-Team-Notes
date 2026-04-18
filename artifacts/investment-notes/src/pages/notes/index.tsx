import { useListNotes, useListCompanies } from "@workspace/api-client-react";
import { useState } from "react";
import { format } from "date-fns";
import { CategoryBadge, SentimentBadge, RoleBadge } from "@/components/badges";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ChevronDown, ChevronRight, FileText } from "lucide-react";
import { ExpandedNoteView } from "@/components/expanded-note";

export default function NotesPage() {
  const [category, setCategory] = useState<string>("all");
  const [companyId, setCompanyId] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);

  const { data: notes, isLoading } = useListNotes({
    category: category !== "all" ? category as any : undefined,
    companyId: companyId !== "all" ? companyId : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const { data: companies } = useListCompanies();

  const filtered = search.trim()
    ? notes?.filter(n =>
        n.content.toLowerCase().includes(search.toLowerCase()) ||
        n.company?.name.toLowerCase().includes(search.toLowerCase()) ||
        n.user?.fullName.toLowerCase().includes(search.toLowerCase())
      )
    : notes;

  const dateError = dateFrom && dateTo && dateTo < dateFrom
    ? "End date must be after start date"
    : null;

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">All Notes</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Review your recent deal activity and thoughts.</p>
        </div>

        {/* Date range — top right */}
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="h-9 px-3 rounded-md border border-border bg-white text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <span className="text-muted-foreground text-sm">–</span>
            <input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={e => setDateTo(e.target.value)}
              className="h-9 px-3 rounded-md border border-border bg-white text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {(dateFrom || dateTo) && (
              <button
                onClick={() => { setDateFrom(""); setDateTo(""); }}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                Clear
              </button>
            )}
          </div>
          {dateError && (
            <span className="text-xs text-red-500">{dateError}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search companies, authors or content..."
            className="pl-9 bg-white border-border shadow-none h-9 text-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[150px] bg-white border-border h-9 text-sm shadow-none">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="generic">Generic</SelectItem>
            <SelectItem value="pipeline">Pipeline</SelectItem>
            <SelectItem value="portfolio">Portfolio</SelectItem>
          </SelectContent>
        </Select>

        <Select value={companyId} onValueChange={setCompanyId}>
          <SelectTrigger className="w-[160px] bg-white border-border h-9 text-sm shadow-none">
            <SelectValue placeholder="All Companies" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Companies</SelectItem>
            {companies?.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!isLoading && (
        <p className="text-sm text-muted-foreground">{filtered?.length ?? 0} notes</p>
      )}

      <div className="rounded-md border border-border bg-white overflow-hidden">
        <div className="grid grid-cols-[90px_100px_130px_minmax(140px,1.2fr)_140px_80px_minmax(180px,2fr)_32px] gap-3 px-4 py-2.5 border-b border-border bg-gray-50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <div>Date</div>
          <div>Category</div>
          <div>Sentiment</div>
          <div>Company</div>
          <div>Author</div>
          <div>Stage</div>
          <div>Content</div>
          <div />
        </div>

        <div className="divide-y divide-border">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="px-4 py-3 flex gap-4 items-center">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))
          ) : filtered?.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground flex flex-col items-center">
              <FileText className="h-9 w-9 mb-3 text-muted-foreground/40" />
              <h3 className="font-medium text-foreground text-sm">No notes found</h3>
              <p className="text-xs mt-1">Try adjusting your filters or create a new note.</p>
            </div>
          ) : (
            filtered?.map((note) => (
              <div key={note.id} className="flex flex-col">
                <div
                  className={`grid grid-cols-[90px_100px_130px_minmax(140px,1.2fr)_140px_80px_minmax(180px,2fr)_32px] gap-3 px-4 py-3 items-center cursor-pointer transition-colors hover:bg-gray-50 ${expandedNoteId === note.id ? "bg-gray-50" : ""}`}
                  onClick={() => setExpandedNoteId(expandedNoteId === note.id ? null : note.id)}
                >
                  <div className="text-sm text-foreground/80 whitespace-nowrap">
                    {format(new Date(note.noteDate), "MMM d, yyyy")}
                  </div>

                  <div>
                    <CategoryBadge category={note.category} />
                  </div>

                  <div>
                    {note.aiResult ? (
                      <SentimentBadge sentiment={note.aiResult.sentiment} />
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </div>

                  <div className="overflow-hidden">
                    {note.company ? (
                      <span className="text-sm font-medium text-foreground truncate block">
                        {note.company.name}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-0.5 overflow-hidden">
                    <span className="text-sm font-medium text-foreground truncate">{note.user?.fullName}</span>
                    {note.user?.role && <RoleBadge role={note.user.role} />}
                  </div>

                  <div className="text-sm text-foreground/70 capitalize">
                    {note.stageAtTimeOfNote || "—"}
                  </div>

                  <div className="text-sm text-muted-foreground truncate pr-2">
                    {note.content}
                  </div>

                  <div className="text-muted-foreground flex justify-end">
                    {expandedNoteId === note.id
                      ? <ChevronDown className="h-4 w-4" />
                      : <ChevronRight className="h-4 w-4" />}
                  </div>
                </div>

                {expandedNoteId === note.id && (
                  <div className="border-t border-border bg-gray-50/50">
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
