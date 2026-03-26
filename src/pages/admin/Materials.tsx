import * as React from "react";
import { AdminLayout } from "@/components/layout";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  Button,
  Input,
} from "@/components/ui-components";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui-components";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format as formatDate } from "date-fns";
import { cn } from "@/lib/utils";
import { Search, Plus, ExternalLink, Edit, Trash2, FileText, Calendar as CalendarIcon } from "lucide-react";
import { Link } from "wouter";
import {
  useGetMaterials,
  useDeleteMaterial,
  useCreateMaterial,
  useUpdateMaterial,
  useGetCategories,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

type MaterialForm = {
  title: string;
  altTitle: string;
  creator: string;
  description: string;
  date: string;
  categoryId: string;
  access: "public" | "restricted" | "confidential";
  format: string;
  fileSize: string;
  pages: string;
  language: string;
  publisher: string;
  fileUrl?: string;
  thumbnailUrl?: string;
};

const emptyForm: MaterialForm = {
  title: "",
  altTitle: "",
  creator: "",
  description: "",
  date: "",
  categoryId: "",
  access: "public",
  format: "",
  fileSize: "",
  pages: "",
  language: "",
  publisher: "",
  fileUrl: "",
  thumbnailUrl: "",
};

export default function AdminMaterials() {
  const [search, setSearch] = React.useState("");
  const { data, isLoading, refetch } = useGetMaterials({ search, limit: 50 });
  const { data: categories } = useGetCategories();

  const { mutate: deleteMat } = useDeleteMaterial();
  const { mutate: create } = useCreateMaterial();
  const { mutate: update } = useUpdateMaterial();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [step, setStep] = React.useState(0);
  const [mode, setMode] = React.useState<"create" | "edit">("create");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<MaterialForm>(emptyForm);

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });

  const materialsCount = data?.materials?.length ?? 0;

  const handleDelete = (id: string) => {
    if (
      confirm(
        "Are you sure you want to permanently delete this material? This cannot be undone."
      )
    ) {
      deleteMat(
        { id },
        {
          onSuccess: () => {
            toast({ title: "Deleted", description: "Material deleted successfully." });
            refetch();
          },
          onError: () =>
            toast({
              title: "Error",
              description: "Failed to delete material.",
              variant: "destructive",
            }),
        },
      );
    }
  };

  const openCreate = () => {
    setMode("create");
    setEditingId(null);
    setForm(emptyForm);
    setStep(0);
    setDialogOpen(true);
  };

  const openEdit = (mat: any) => {
    setMode("edit");
    setEditingId(mat.id);
    setForm({
      title: mat.title ?? "",
      altTitle: mat.altTitle ?? "",
      creator: mat.creator ?? "",
      description: mat.description ?? "",
      date: mat.date ?? "",
      categoryId: mat.categoryId ?? "",
      access: mat.access ?? "public",
      format: mat.format ?? "",
      fileSize: mat.fileSize ?? "",
      pages: mat.pages != null ? String(mat.pages) : "",
      language: mat.language ?? "",
      publisher: mat.publisher ?? "",
      fileUrl: mat.fileUrl ?? "",
      thumbnailUrl: mat.thumbnailUrl ?? "",
    });
    setStep(0);
    setDialogOpen(true);
  };

  const buildPayload = () => {
    const title = form.title.trim();
    const payload: any = {
      title,
      access: form.access,
      categoryId: form.categoryId ? form.categoryId : undefined,
      altTitle: form.altTitle.trim() || undefined,
      creator: form.creator.trim() || undefined,
      description: form.description.trim() || undefined,
      date: form.date.trim() || undefined,
      format: form.format.trim() || undefined,
      fileSize: form.fileSize.trim() || undefined,
      pages: form.pages.trim() ? Number(form.pages.trim()) : undefined,
      language: form.language.trim() || undefined,
      publisher: form.publisher.trim() || undefined,
      fileUrl: form.fileUrl?.trim() ? form.fileUrl.trim() : undefined,
      thumbnailUrl: form.thumbnailUrl?.trim() ? form.thumbnailUrl.trim() : undefined,
    };
    return payload;
  };

  const onSave = () => {
    const title = form.title.trim();
    if (!title) return;

    const payload = buildPayload();

    if (mode === "create") {
      create(
        { data: payload },
        {
          onSuccess: () => {
            toast({ title: "Created", description: "Material created successfully." });
            setDialogOpen(false);
            refetch();
          },
          onError: () =>
            toast({
              title: "Error",
              description: "Failed to create material.",
              variant: "destructive",
            }),
        },
      );
    } else if (editingId) {
      update(
        { id: editingId, data: payload },
        {
          onSuccess: () => {
            toast({ title: "Updated", description: "Material updated successfully." });
            setDialogOpen(false);
            setEditingId(null);
            refetch();
          },
          onError: () =>
            toast({
              title: "Error",
              description: "Failed to update material.",
              variant: "destructive",
            }),
        },
      );
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-primary">Archival Materials</h1>
          <p className="text-muted-foreground">Create, update, and maintain digital objects and metadata.</p>
        </div>
        <Button className="shrink-0 shadow-lg gap-2" onClick={openCreate}>
          <Plus className="w-4 h-4" /> Ingest Material
        </Button>
      </div>

      <div className="bg-card border rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className="p-4 border-b flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              className="pl-9 bg-muted/50"
              placeholder="Search by ID, Title, Creator..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="text-sm text-muted-foreground flex items-center">
            {materialsCount} result{materialsCount === 1 ? "" : "s"}
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[160px]">Reference Code</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Format</TableHead>
              <TableHead>Access</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">
                  Loading...
                </TableCell>
              </TableRow>
            ) : materialsCount === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  No materials found.
                </TableCell>
              </TableRow>
            ) : (
              data?.materials?.map((mat: any) => (
                <TableRow key={mat.id} className="group">
                  <TableCell className="font-mono text-xs">{mat.materialId}</TableCell>
                  <TableCell className="font-medium max-w-[320px] truncate">{mat.title}</TableCell>
                  <TableCell className="text-muted-foreground">{mat.categoryName || "-"}</TableCell>
                  <TableCell className="uppercase text-xs tracking-wider">{mat.format || "-"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        mat.access === "public"
                          ? "success"
                          : mat.access === "restricted"
                            ? "accent"
                            : "default"
                      }
                      className="capitalize"
                    >
                      {mat.access}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/materials/${mat.id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => openEdit(mat)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(mat.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "Ingest New Material" : "Edit Material"}</DialogTitle>
            <DialogDescription className="sr-only">
               Fill in the archival metadata across 5 steps to {mode === "create" ? "ingest" : "update"} a digital material.
            </DialogDescription>
            <div className="flex items-center gap-2 mt-2">
              {[1, 2, 3, 4, 5].map((s, i) => (
                <div key={s} className="flex-1 flex items-center gap-2">
                  <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= i ? "bg-[#4169E1]" : "bg-muted"}`} />
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2 uppercase font-bold tracking-widest">
              Step {step + 1} of 5: {
                ["Identity Statement", "Context & Content", "Access & Structure", "Upload Materials", "Preview & Finalize"][step]
              }
            </p>
          </DialogHeader>

          <div className="min-h-[340px] py-2">
            {step === 0 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-2 duration-300">
                <div>
                  <label className="text-sm font-semibold mb-1.5 block">Title <span className="text-[#960000]">*</span></label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Main archival title" className="h-11 shadow-sm" />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1.5 block">Alternative Title</label>
                  <Input value={form.altTitle} onChange={(e) => setForm({ ...form, altTitle: e.target.value })} placeholder="Parallel or alternative title" className="h-11 shadow-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold mb-1.5 block">Date of Creation</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full h-11 justify-start text-left font-normal shadow-sm",
                            !form.date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {form.date ? formatDate(new Date(form.date), "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={form.date ? new Date(form.date) : undefined}
                          onSelect={(date) => setForm({ ...form, date: date ? date.toISOString() : "" })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1.5 block">Series Category</label>
                    <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                      <SelectTrigger className="h-11 shadow-sm">
                        <SelectValue placeholder="Select series" />
                      </SelectTrigger>
                      <SelectContent>
                        {(categories ?? []).map((c: any) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-2 duration-300">
                <div>
                  <label className="text-sm font-semibold mb-1.5 block">Creator / Author</label>
                  <Input value={form.creator} onChange={(e) => setForm({ ...form, creator: e.target.value })} placeholder="Individual or corporate body" className="h-11 shadow-sm" />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1.5 block">Publisher / Institution</label>
                  <Input value={form.publisher} onChange={(e) => setForm({ ...form, publisher: e.target.value })} placeholder="Publishing body" className="h-11 shadow-sm" />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1.5 block">Language</label>
                  <Input value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} placeholder="English, Filipino, etc." className="h-11 shadow-sm" />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1.5 block">Archive Description</label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Scope and content summary" className="min-h-[100px] shadow-sm" />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-2 duration-300">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold mb-1.5 block">Access Level</label>
                    <Select value={form.access} onValueChange={(v) => setForm({ ...form, access: v as any })}>
                      <SelectTrigger className="h-11 shadow-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="restricted">Restricted</SelectItem>
                        <SelectItem value="confidential">Confidential</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1.5 block">Physical Format</label>
                    <Input value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })} placeholder="application/pdf, image/tiff" className="h-11 shadow-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold mb-1.5 block">File Size</label>
                    <Input value={form.fileSize} onChange={(e) => setForm({ ...form, fileSize: e.target.value })} placeholder="e.g. 2.5 MB" className="h-11 shadow-sm" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1.5 block">Extent (Pages)</label>
                    <Input value={form.pages} onChange={(e) => setForm({ ...form, pages: e.target.value })} placeholder="e.g. 50" className="h-11 shadow-sm" />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
                <div className="bg-muted/30 p-4 rounded-xl border border-dashed border-muted-foreground/30">
                  <label className="text-sm font-semibold mb-2 block">Thumbnail Image</label>
                  <Input type="file" accept="image/*" className="bg-white mb-3" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = await readFileAsDataUrl(file);
                      setForm({ ...form, thumbnailUrl: url });
                    }
                  }} />
                  <Input value={form.thumbnailUrl} onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })} placeholder="Or paste image URL" className="h-11 shadow-sm bg-white" />
                </div>

                <div className="bg-muted/30 p-4 rounded-xl border border-dashed border-muted-foreground/30">
                  <label className="text-sm font-semibold mb-2 block">Material Asset (PDF/Image)</label>
                  <Input type="file" className="bg-white mb-3" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = await readFileAsDataUrl(file);
                      setForm({ ...form, fileUrl: url });
                    }
                  }} />
                  <Input value={form.fileUrl} onChange={(e) => setForm({ ...form, fileUrl: e.target.value })} placeholder="Or paste file URL" className="h-11 shadow-sm bg-white" />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                <div className="bg-[#0a1628] text-white p-5 rounded-2xl shadow-xl flex gap-4 border border-white/10">
                  <div className="w-20 h-24 bg-white/10 rounded-lg flex items-center justify-center shrink-0 border border-white/5">
                    {form.thumbnailUrl ? <img src={form.thumbnailUrl} className="w-full h-full object-cover rounded-lg" /> : <FileText className="w-8 h-8 text-white/20" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-tight mb-1">{form.title || "Untitled Material"}</h3>
                    <p className="text-white/60 text-xs font-mono uppercase tracking-widest">{form.creator || "Unknown Creator"}</p>
                    <div className="flex gap-2 mt-3">
                      <Badge variant="success" className="bg-[#4169E1] text-white border-0 text-[10px] lowercase px-2 h-5 tracking-wide">{form.access}</Badge>
                      <Badge variant="outline" className="text-white/60 border-white/20 text-[10px] uppercase font-bold tracking-widest px-2 h-5">{form.format || "N/A"}</Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-8 gap-y-3 px-2 pt-2">
                  {[
                    { label: "Date", val: form.date },
                    { label: "Category", val: categories?.find(c => c.id === form.categoryId)?.name },
                    { label: "Publisher", val: form.publisher },
                    { label: "Pages", val: form.pages },
                  ].map(f => (
                    <div key={f.label}>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{f.label}</p>
                      <p className="text-sm font-medium border-b border-muted py-1">{f.val || "—"}</p>
                    </div>
                  ))}
                </div>
                
                <div className="px-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Description</p>
                  <p className="text-xs text-muted-foreground line-clamp-3 bg-muted/20 p-3 rounded-lg border italic">
                    {form.description || "No description provided."}
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between border-t pt-4">
            <div className="flex gap-2">
              {step > 0 && (
                <Button variant="ghost" onClick={() => setStep(step - 1)}>
                  Back
                </Button>
              )}
              {step === 0 && (
                <Button variant="ghost" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {step < 4 ? (
                <Button onClick={() => setStep(step + 1)} disabled={step === 0 && !form.title.trim()}>
                  Next Step
                </Button>
              ) : (
                <Button onClick={onSave} className="bg-[#0a1628] hover:bg-[#4169E1] transition-all px-8 shadow-lg shadow-primary/20">
                  {mode === "create" ? "Finalize Ingest" : "Save Changes"}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
