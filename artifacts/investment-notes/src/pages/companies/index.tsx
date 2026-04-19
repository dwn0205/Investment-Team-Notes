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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { CompanyTypeBadge } from "@/components/badges";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  active:  { label: "Active",   className: "bg-primary text-primary-foreground" },
  exited:  { label: "Exited",   className: "bg-secondary text-secondary-foreground" },
  dropped: { label: "Inactive", className: "bg-muted text-muted-foreground border border-border" },
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
  currentStatus,
  onSave,
  onToggleStatus,
  isSaving,
  isTogglingStatus,
  mode,
}: {
  open: boolean;
  onClose: () => void;
  initial: CompanyFormValues;
  currentStatus?: string;
  onSave: (values: CompanyFormValues) => void;
  onToggleStatus?: () => void;
  isSaving: boolean;
  isTogglingStatus?: boolean;
  mode: "add" | "edit";
}) {
  const [values, setValues] = useState<CompanyFormValues>(initial);
  const [confirmInactive, setConfirmInactive] = useState(false);
  const isInactive = currentStatus === "dropped";

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) { onClose(); setConfirmInactive(false); }
    else { setValues(initial); setConfirmInactive(false); }
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

          {mode === "edit" && onToggleStatus && (
            <div className="border-t border-border pt-4">
              {isInactive ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-sm"
                  onClick={onToggleStatus}
                  disabled={isTogglingStatus}
                >
                  {isTogglingStatus ? "Restoring…" : "↩ Restore to Active"}
                </Button>
              ) : confirmInactive ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    This will mark the company as <span className="font-medium text-foreground">Inactive</span>. Existing notes stay visible but it won't appear in new note forms.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="destructive" size="sm" className="flex-1" onClick={onToggleStatus} disabled={isTogglingStatus}>
                      {isTogglingStatus ? "Saving…" : "Confirm"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setConfirmInactive(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 w-full justify-start"
                  onClick={() => setConfirmInactive(true)}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                  Mark as Inactive
                </Button>
              )}
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

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/companies"] });

  const createMutation = useCreateCompany({
    mutation: {
      onSuccess: () => { invalidate(); setAddOpen(false); toast({ title: "Company added" }); },
      onError: () => toast({ title: "Failed to add company", variant: "destructive" }),
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
    onSuccess: () => { invalidate(); setEditTarget(null); toast({ title: "Company updated" }); },
    onError: () => toast({ title: "Failed to update company", variant: "destructive" }),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: string }) => {
      const res = await fetch(`/api/companies/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update company status");
      return res.json() as Promise<Company>;
    },
    onSuccess: (_, { newStatus }) => {
      invalidate();
      setEditTarget(null);
      toast({ title: newStatus === "dropped" ? "Company marked as inactive" : "Company restored to active" });
    },
    onError: () => toast({ title: "Failed to update status", variant: "destructive" }),
  });

  const sorted = (companies ?? []).slice().sort((a, b) => {
    if (a.status === "dropped" && b.status !== "dropped") return 1;
    if (a.status !== "dropped" && b.status === "dropped") return -1;
    return a.name.localeCompare(b.name);
  });

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
                <th className="py-2.5 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                <th className="py-2.5 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="py-2.5 px-4" />
              </tr>
            </thead>
            <tbody>
              {sorted.map(c => {
                const s = STATUS_CONFIG[c.status] ?? { label: c.status, className: "bg-muted text-muted-foreground border border-border" };
                return (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 text-sm font-medium text-foreground">{c.name}</td>
                    <td className="py-3 px-4">
                      <CompanyTypeBadge type={c.type} />
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${s.className}`}>
                        {s.label}
                      </span>
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
                );
              })}
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
          currentStatus={editTarget.status}
          mode="edit"
          isSaving={updateMutation.isPending}
          isTogglingStatus={toggleStatusMutation.isPending}
          onSave={values => updateMutation.mutate({ id: editTarget.id, values, existingStatus: editTarget.status })}
          onToggleStatus={() => toggleStatusMutation.mutate({
            id: editTarget.id,
            newStatus: editTarget.status === "dropped" ? "active" : "dropped",
          })}
        />
      )}
    </div>
  );
}
