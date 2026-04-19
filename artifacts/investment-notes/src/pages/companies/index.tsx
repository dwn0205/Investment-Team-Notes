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
import { Plus, Pencil, Building2, TrendingUp } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  pipeline: "Pipeline",
  portfolio: "Portfolio",
};

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active:  { label: "Active",  variant: "default" },
  exited:  { label: "Exited",  variant: "secondary" },
  dropped: { label: "Dropped", variant: "outline" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, variant: "outline" as const };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

type CompanyFormValues = {
  name: string;
  type: "pipeline" | "portfolio";
  status: "active" | "exited" | "dropped";
};

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

  function handleOpen(isOpen: boolean) {
    if (!isOpen) onClose();
    else setValues(initial);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
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
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Type</label>
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
          {mode === "edit" && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={values.status} onValueChange={v => setValues(prev => ({ ...prev, status: v as any }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="exited">Exited</SelectItem>
                  <SelectItem value="dropped">Dropped</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Setting status to Dropped or Exited will hide the company from new note forms.
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={() => onSave(values)}
            disabled={isSaving || !values.name.trim()}
          >
            {isSaving ? "Saving…" : mode === "add" ? "Add Company" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CompanyRow({ company, onEdit }: { company: Company; onEdit: (c: Company) => void }) {
  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
      <td className="py-3 px-4 text-sm font-medium text-foreground">{company.name}</td>
      <td className="py-3 px-4">
        <StatusBadge status={company.status} />
      </td>
      <td className="py-3 px-4 text-right">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-muted-foreground hover:text-foreground"
          onClick={() => onEdit(company)}
        >
          <Pencil className="w-3.5 h-3.5 mr-1" />
          Edit
        </Button>
      </td>
    </tr>
  );
}

function CompanyGroup({
  title,
  icon: Icon,
  companies,
  onEdit,
}: {
  title: string;
  icon: React.ElementType;
  companies: Company[];
  onEdit: (c: Company) => void;
}) {
  if (companies.length === 0) return null;
  return (
    <div className="bg-card border border-card-border rounded-lg shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <span className="ml-auto text-xs text-muted-foreground">{companies.length} {companies.length === 1 ? "company" : "companies"}</span>
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="py-2 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
            <th className="py-2 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
            <th className="py-2 px-4" />
          </tr>
        </thead>
        <tbody>
          {companies.map(c => (
            <CompanyRow key={c.id} company={c} onEdit={onEdit} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

const EMPTY_ADD: CompanyFormValues = { name: "", type: "pipeline", status: "active" };

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
    mutationFn: async ({ id, values }: { id: string; values: CompanyFormValues }) => {
      const res = await fetch(`/api/companies/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
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

  const pipeline = (companies ?? []).filter(c => c.type === "pipeline");
  const portfolio = (companies ?? []).filter(c => c.type === "portfolio");

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

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      ) : (
        <div className="space-y-6">
          <CompanyGroup
            title="Pipeline"
            icon={TrendingUp}
            companies={pipeline}
            onEdit={setEditTarget}
          />
          <CompanyGroup
            title="Portfolio"
            icon={Building2}
            companies={portfolio}
            onEdit={setEditTarget}
          />
          {(companies ?? []).length === 0 && (
            <div className="text-center py-16 text-muted-foreground text-sm">
              No companies yet. Add your first one to get started.
            </div>
          )}
        </div>
      )}

      <CompanyDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        initial={EMPTY_ADD}
        mode="add"
        isSaving={createMutation.isPending}
        onSave={values =>
          createMutation.mutate({ data: values })
        }
      />

      {editTarget && (
        <CompanyDialog
          open={true}
          onClose={() => setEditTarget(null)}
          initial={{ name: editTarget.name, type: editTarget.type as any, status: editTarget.status as any }}
          mode="edit"
          isSaving={updateMutation.isPending}
          onSave={values =>
            updateMutation.mutate({ id: editTarget.id, values })
          }
        />
      )}
    </div>
  );
}
