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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, ExternalLink, Edit, Trash2 } from "lucide-react";
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
};

export default function AdminMaterials() {
  const [search, setSearch] = React.useState("");
  const { data, isLoading, refetch } = useGetMaterials({ params: { search, limit: 50 } });
  const { data: categories } = useGetCategories();

  const { mutate: deleteMat } = useDeleteMaterial();
  const { mutate: create } = useCreateMaterial();
  const { mutate: update } = useUpdateMaterial();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [mode, setMode] = React.useState<"create" | "edit">("create");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<MaterialForm>(emptyForm);

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
    });
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "Ingest New Material" : "Edit Material"}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">
                Title <span className="text-destructive">*</span>
              </label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Material title" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Access</label>
                <Select value={form.access} onValueChange={(v) => setForm({ ...form, access: v as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">public</SelectItem>
                    <SelectItem value="restricted">restricted</SelectItem>
                    <SelectItem value="confidential">confidential</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Category</label>
                <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {(categories ?? []).map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Creator</label>
                <Input value={form.creator} onChange={(e) => setForm({ ...form, creator: e.target.value })} placeholder="Creator / author" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Date</label>
                <Input value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} placeholder="YYYY-MM-DD" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short archival description" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Format</label>
                <Input value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })} placeholder="application/pdf, image/tiff, etc." />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">File Size</label>
                <Input value={form.fileSize} onChange={(e) => setForm({ ...form, fileSize: e.target.value })} placeholder="e.g., 2.4 MB" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Pages</label>
                <Input value={form.pages} onChange={(e) => setForm({ ...form, pages: e.target.value })} placeholder="e.g., 45" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Language</label>
                <Input value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} placeholder="eng, fil, etc." />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Publisher</label>
                <Input value={form.publisher} onChange={(e) => setForm({ ...form, publisher: e.target.value })} placeholder="Publisher / institution" />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={onSave} className="gap-2" disabled={!form.title.trim()}>
              {mode === "create" ? "Create Material" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
