import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { useCreateNote, useListCompanies, useListUsers, CreateNoteBodyCategory, CreateNoteBodyStageAtTimeOfNote } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  userId: z.string().min(1, "User is required"),
  category: z.nativeEnum(CreateNoteBodyCategory),
  companyId: z.string().optional().nullable(),
  stageAtTimeOfNote: z.nativeEnum(CreateNoteBodyStageAtTimeOfNote).optional().nullable(),
  noteDate: z.date(),
  content: z.string().min(10, "Note content must be at least 10 characters"),
  includeInWeekly: z.boolean()
}).superRefine((data, ctx) => {
  if (data.category !== "generic" && !data.companyId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Company is required for pipeline and portfolio notes",
      path: ["companyId"],
    });
  }
});

export default function NewNotePage() {
  const [, setLocation] = useLocation();
  const createNote = useCreateNote();
  const { data: companies } = useListCompanies();
  const { data: users } = useListUsers();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: "pipeline",
      includeInWeekly: false,
      noteDate: new Date(),
      content: "",
      userId: "",
      companyId: null,
      stageAtTimeOfNote: null,
    },
  });

  const category = form.watch("category");
  const isGeneric = category === "generic";

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createNote.mutate({
      data: {
        userId: values.userId,
        category: values.category,
        companyId: isGeneric ? null : values.companyId,
        stageAtTimeOfNote: isGeneric ? null : values.stageAtTimeOfNote,
        noteDate: values.noteDate.toISOString(),
        content: values.content,
        includeInWeekly: values.includeInWeekly
      }
    }, {
      onSuccess: () => {
        toast.success("Note created successfully");
        setLocation("/notes");
      },
      onError: (error) => {
        toast.error("Failed to create note", { description: error.message });
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">New Intelligence Note</h1>
        <p className="text-muted-foreground text-sm mt-1">Log deal updates, portfolio developments, or market intelligence.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card p-6 border border-card-border rounded-lg shadow-sm">
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Author</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select author" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users?.map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="noteDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="mt-2 mb-1">Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal bg-background",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pipeline">Pipeline</SelectItem>
                      <SelectItem value="portfolio">Portfolio</SelectItem>
                      <SelectItem value="generic">Generic (Market/Other)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="companyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company {isGeneric && <span className="text-muted-foreground font-normal">(Optional)</span>}</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value || undefined}
                    disabled={isGeneric}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isGeneric ? "Not applicable" : "Select company"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {companies?.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="stageAtTimeOfNote"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deal Stage {isGeneric && <span className="text-muted-foreground font-normal">(Optional)</span>}</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value || undefined}
                    disabled={isGeneric}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isGeneric ? "Not applicable" : "Select stage"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="initial">Initial</SelectItem>
                      <SelectItem value="final">Final</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="includeInWeekly"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-3 shadow-sm mt-8">
                  <div className="space-y-0.5">
                    <FormLabel>Include in Weekly Agenda</FormLabel>
                    <div className="text-xs text-muted-foreground">
                      Flag this note for Monday morning discussion
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className="bg-card p-6 border border-card-border rounded-lg shadow-sm">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Intelligence</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Detailed notes, meeting takeaways, or analysis..." 
                      className="min-h-[250px] font-mono text-sm leading-relaxed resize-y bg-background"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end gap-4">
            <Button variant="outline" type="button" onClick={() => setLocation("/notes")}>
              Cancel
            </Button>
            <Button type="submit" disabled={createNote.isPending} className="min-w-[120px]">
              {createNote.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Note
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
