import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useListCompanies, useCreateCompany } from "@workspace/api-client-react";
import type { Company } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil } from "lucide-react";
import { CategoryBadge } from "@/components/badges";

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  active:  { label: "Active",  variant: "default" },
  exited:  { label: "Exited",  variant: "secondary" },
  dropped: { label: "Dropped", variant: "outline" },
};

type CompanyFormValues = {
  name: string;
  type: "pipeline" | "portfolio";
};

const EMPTY_ADD: CompanyFormValues = { name: "", type: "pipeline" };

function CompanyDialog({
  open,
  onClose,
  initial,
  onSave,
  isSaving,
  mode,
}: {
  open: boolean;
  onClose: () => void;
  initial: CompanyFormValues;
  onSave: (values: CompanyFormValues) => void;
  isSaving: boolean;
  mode: "add" | "edit";
}) {
  const [values, setValues] = useState<CompanyFormValues>(initial);

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) onClose();
    else setValues(initial);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Add Company" : "Edit Company"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Company Name</label>
            <Input
              value={values.name}
              onChange={e => setValues(v => ({ ...v, name: e.target.value }))}
              placeholder="e.g. Acme Corp"
              autoFocus
            />
          </div>
          {mode === "add" && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={values.type} onValueChange={v => setValues(prev => ({ ...prev, type: v as any }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pipeline">Pipeline</SelectItem>
                  <SelectItem value="portfolio">Portfolio</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={() => onSave(values)} disabled={isSaving || !values.name.trim()}>
            {isSaving ? "Saving…" : mode === "add" ? "Add Company" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function CompaniesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: companies, isLoading } = useListCompanies();

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Company | null>(null);

  const createMutation = useCreateCompany({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
        setAddOpen(false);
        toast({ title: "Company added" });
      },
      onError: () => {
        toast({ title: "Failed to add company", variant: "destructive" });
      },
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values, existingStatus }: { id: string; values: CompanyFormValues; existingStatus: string }) => {
      const res = await fetch(`/api/companies/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, status: existingStatus }),
      });
      if (!res.ok) throw new Error("Failed to update company");
      return res.json() as Promise<Company>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      setEditTarget(null);
      toast({ title: "Company updated" });
    },
    onError: () => {
      toast({ title: "Failed to update company", variant: "destructive" });
    },
  });

  const sorted = (companies ?? []).slice().sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Companies</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage pipeline and portfolio companies tracked in the notes app.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Company
        </Button>
      </div>

      <div className="bg-card border border-card-border rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10 w-full rounded" />)}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            No companies yet. Add your first one to get started.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="py-2.5 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                <th className="py-2.5 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</th>
                <th className="py-2.5 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="py-2.5 px-4" />
              </tr>
            </thead>
            <tbody>
              {sorted.map(c => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-foreground">{c.name}</td>
                  <td className="py-3 px-4">
                    <CategoryBadge category={c.type} />
                  </td>
                  <td className="py-3 px-4">
                    {(() => { const s = STATUS_CONFIG[c.status] ?? { label: c.status, variant: "outline" as const }; return <Badge variant={s.variant}>{s.label}</Badge>; })()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-muted-foreground hover:text-foreground"
                      onClick={() => setEditTarget(c)}
                    >
                      <Pencil className="w-3.5 h-3.5 mr-1" />
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <CompanyDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        initial={EMPTY_ADD}
        mode="add"
        isSaving={createMutation.isPending}
        onSave={values => createMutation.mutate({ data: { ...values, status: "active" } })}
      />

      {editTarget && (
        <CompanyDialog
          open={true}
          onClose={() => setEditTarget(null)}
          initial={{ name: editTarget.name, type: editTarget.type as any }}
          mode="edit"
          isSaving={updateMutation.isPending}
          onSave={values => updateMutation.mutate({ id: editTarget.id, values, existingStatus: editTarget.status })}
        />
      )}
    </div>
  );
}
