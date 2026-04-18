import { useState } from "react";
import { useListCompanies, useGetQuarterlySummary, useGenerateQuarterlySummary, QuarterlySummary } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, TrendingUp, AlertTriangle, Lightbulb, FileText, ChevronRight } from "lucide-react";
import { SentimentBadge, RoleBadge } from "@/components/badges";
import { ExpandedNoteView } from "@/components/expanded-note";

export default function QuarterlyPage() {
  const currentYear = new Date().getFullYear();
  const currentQuarter = Math.floor((new Date().getMonth() + 3) / 3);

  const [companyId, setCompanyId] = useState<string>("");
  const [year, setYear] = useState<number>(currentYear);
  const [quarter, setQuarter] = useState<number>(currentQuarter);
  
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);

  const { data: companies } = useListCompanies();
  
  const { data: quarterlyView, isLoading, refetch } = useGetQuarterlySummary(
    companyId, 
    year, 
    quarter,
    { query: { enabled: !!companyId, queryKey: [`/api/companies/${companyId}/quarterly`, year, quarter] } }
  );

  const generateSummary = useGenerateQuarterlySummary();

  const handleGenerate = () => {
    if (!companyId) return;
    generateSummary.mutate(
      { companyId, year, quarter },
      { onSuccess: () => refetch() }
    );
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-8rem)]">
      {/* Sidebar Controls */}
      <div className="w-full md:w-64 flex-shrink-0 space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight mb-4">Quarterly Reviews</h1>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Company</label>
              <Select value={companyId} onValueChange={setCompanyId}>
                <SelectTrigger className="bg-card">
                  <SelectValue placeholder="Select company..." />
                </SelectTrigger>
                <SelectContent>
                  {companies?.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Time Period</label>
              <div className="flex gap-2">
                <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
                  <SelectTrigger className="bg-card flex-1">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {[currentYear, currentYear - 1, currentYear - 2].map(y => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={quarter.toString()} onValueChange={(v) => setQuarter(parseInt(v))}>
                  <SelectTrigger className="bg-card flex-1">
                    <SelectValue placeholder="Q" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4].map(q => (
                      <SelectItem key={q} value={q.toString()}>Q{q}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Panel */}
      <div className="flex-1 border border-border rounded-lg bg-card shadow-sm overflow-hidden flex flex-col h-full">
        {!companyId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
            <TrendingUp className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium text-foreground">Select a company</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Choose a company and time period from the sidebar to view or generate its quarterly intelligence summary.
            </p>
          </div>
        ) : isLoading ? (
          <div className="p-8 space-y-6">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-24" />
            <div className="space-y-2 pt-6">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-border bg-muted/20">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold tracking-tight">
                  {quarterlyView?.company.name} <span className="text-muted-foreground font-normal">Q{quarter} {year}</span>
                </h2>
                {quarterlyView?.summary && (
                  <SentimentBadge sentiment={quarterlyView.summary.overallSentiment} />
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                {!quarterlyView?.summary ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-lg bg-background">
                    <FileText className="h-10 w-10 text-muted-foreground/50 mb-3" />
                    <h3 className="text-lg font-medium mb-1">No summary generated yet</h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-md">
                      There are {quarterlyView?.notes.length || 0} notes available for this quarter. 
                      Generate an AI summary to synthesize the key themes and risks.
                    </p>
                    <Button 
                      onClick={handleGenerate} 
                      disabled={generateSummary.isPending || !quarterlyView?.notes.length}
                    >
                      {generateSummary.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Generate AI Summary
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed">
                      <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                        {quarterlyView.summary.summaryText}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-border">
                      {quarterlyView.summary.keyThemes && quarterlyView.summary.keyThemes.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                            <Lightbulb className="h-4 w-4" /> Core Themes
                          </h4>
                          <ul className="space-y-2">
                            {quarterlyView.summary.keyThemes.map((theme, i) => (
                              <li key={i} className="text-sm p-3 rounded-md bg-primary/10 text-primary border border-primary/20">
                                {theme}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {quarterlyView.summary.risks && quarterlyView.summary.risks.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" /> Identified Risks
                          </h4>
                          <ul className="space-y-2">
                            {quarterlyView.summary.risks.map((risk, i) => (
                              <li key={i} className="text-sm p-3 rounded-md bg-red-500/10 text-red-500 border border-red-500/20">
                                {risk}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-xs text-muted-foreground pt-4 border-t border-border">
                      Generated via AI on {format(new Date(quarterlyView.summary.generatedAt), "MMM d, yyyy HH:mm")}
                    </div>
                  </div>
                )}
              </div>

              {/* Underlying Notes */}
              {quarterlyView?.notes && quarterlyView.notes.length > 0 && (
                <div className="border-t border-border bg-muted/10">
                  <div className="p-4 border-b border-border bg-background">
                    <h3 className="text-sm font-semibold text-foreground">Underlying Notes ({quarterlyView.notes.length})</h3>
                  </div>
                  <div className="divide-y divide-border">
                    {quarterlyView.notes.map(note => (
                      <div key={note.id} className="flex flex-col group">
                        <div 
                          className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${expandedNoteId === note.id ? 'bg-muted/50' : ''}`}
                          onClick={() => setExpandedNoteId(expandedNoteId === note.id ? null : note.id)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-medium">{format(new Date(note.noteDate), "MMM d, yyyy")}</span>
                              {note.aiResult && <SentimentBadge sentiment={note.aiResult.sentiment} />}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium">{note.user?.fullName}</span>
                              {note.user?.role && <RoleBadge role={note.user.role} />}
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground line-clamp-2">
                            {note.content}
                          </div>
                        </div>

                        {expandedNoteId === note.id && (
                          <div className="h-[400px] border-y border-border bg-background shadow-inner">
                            <ExpandedNoteView note={note} onCollapse={() => setExpandedNoteId(null)} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
