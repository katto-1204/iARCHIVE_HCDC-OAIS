import * as React from "react";
import { AdminLayout } from "@/components/layout";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Button, Input, Card, CardHeader, CardTitle, CardContent } from "@/components/ui-components";
import { Plus, Edit, Trash2, FolderTree, Save, X } from "lucide-react";
import { useGetCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EditingState {
  id: string;
  name: string;
  description: string;
  level: any;
}

export default function AdminCategories() {
  const { data: categories, isLoading, refetch } = useGetCategories();
  const { mutate: create } = useCreateCategory();
  const { mutate: update } = useUpdateCategory();
  const { mutate: remove } = useDeleteCategory();
  const { toast } = useToast();

  const [newName, setNewName] = React.useState("");
  const [newDesc, setNewDesc] = React.useState("");
  const [newLevel, setNewLevel] = React.useState<any>("fonds");
  const [editing, setEditing] = React.useState<EditingState | null>(null);
  const [isAdding, setIsAdding] = React.useState(false);

  const handleCreate = () => {
    if (!newName.trim()) return;
    create(
      { data: { name: newName.trim(), description: newDesc.trim() || undefined, level: newLevel as any, parentId: undefined } },
      {
        onSuccess: () => {
          toast({ title: "Category Created", description: `"${newName}" has been added.` });
          setNewName("");
          setNewDesc("");
          setNewLevel("fonds");
          setIsAdding(false);
          refetch();
        },
        onError: () => toast({ title: "Error", description: "Failed to create category.", variant: "destructive" })
      }
    );
  };

  const handleUpdate = () => {
    if (!editing || !editing.name.trim()) return;
    update(
      { id: editing.id, data: { name: editing.name.trim(), description: editing.description.trim() || undefined, level: editing.level as any, parentId: undefined } },
      {
        onSuccess: () => {
          toast({ title: "Updated", description: "Category has been updated." });
          setEditing(null);
          refetch();
        },
        onError: () => toast({ title: "Error", description: "Failed to update category.", variant: "destructive" })
      }
    );
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete category "${name}"? Materials in this category will become uncategorized.`)) {
      remove(
        { id },
        {
          onSuccess: () => {
            toast({ title: "Deleted", description: "Category removed." });
            refetch();
          },
          onError: () => toast({ title: "Error", description: "Failed to delete category.", variant: "destructive" })
        }
      );
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-primary">Collection Series</h1>
          <p className="text-muted-foreground">Manage archival series and sub-fonds used to classify materials.</p>
        </div>
        <Button onClick={() => setIsAdding(true)} className="shrink-0 shadow-lg gap-2">
          <Plus className="w-4 h-4" /> New Category
        </Button>
      </div>

      {isAdding && (
        <Card className="mb-6 border-primary/30 shadow-md">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-primary" />
              New Archival Series
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Category Name <span className="text-destructive">*</span></label>
                <Input
                  placeholder="e.g., Faculty Publications"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Description</label>
                <Input
                  placeholder="Brief description of this collection series..."
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-1 block">
                  Level <span className="text-destructive">*</span>
                </label>
                <Select value={newLevel} onValueChange={setNewLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fonds">fonds</SelectItem>
                    <SelectItem value="subfonds">subfonds</SelectItem>
                    <SelectItem value="series">series</SelectItem>
                    <SelectItem value="file">file</SelectItem>
                    <SelectItem value="item">item</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleCreate} disabled={!newName.trim() || !newLevel} className="gap-2">
                <Save className="w-4 h-4" /> Create Category
              </Button>
              <Button variant="ghost" onClick={() => { setIsAdding(false); setNewName(""); setNewDesc(""); setNewLevel("fonds"); }}>
                <X className="w-4 h-4 mr-1" /> Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">#</TableHead>
              <TableHead>Category Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Level</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">Loading categories...</TableCell></TableRow>
            ) : (categories?.length ?? 0) === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <FolderTree className="w-10 h-10 opacity-20" />
                    <p>No categories yet. Create one above.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              categories?.map((cat, idx) => (
                <TableRow key={cat.id} className="group">
                  <TableCell className="text-muted-foreground text-sm font-mono">{String(idx + 1).padStart(2, '0')}</TableCell>
                  <TableCell>
                    {editing?.id === cat.id ? (
                      <Input
                        value={editing.name}
                        onChange={e => setEditing({ ...editing, name: e.target.value })}
                        className="h-8 max-w-[200px]"
                        autoFocus
                      />
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FolderTree className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-semibold">{cat.name}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {editing?.id === cat.id ? (
                      <Input
                        value={editing.description}
                        onChange={e => setEditing({ ...editing, description: e.target.value })}
                        className="h-8"
                        placeholder="Description..."
                      />
                    ) : (
                      <span className="text-sm text-muted-foreground">{cat.description || <span className="italic opacity-40">No description</span>}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editing?.id === cat.id ? (
                      <Select value={editing.level} onValueChange={(v) => setEditing({ ...editing, level: v })}>
                        <SelectTrigger className="h-8 w-[170px]">
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fonds">fonds</SelectItem>
                          <SelectItem value="subfonds">subfonds</SelectItem>
                          <SelectItem value="series">series</SelectItem>
                          <SelectItem value="file">file</SelectItem>
                          <SelectItem value="item">item</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-sm text-muted-foreground capitalize">{cat.level}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editing?.id === cat.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" onClick={handleUpdate} className="gap-1">
                          <Save className="w-3.5 h-3.5" /> Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                          <X className="w-3.5 h-3.5" /> Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => setEditing({ id: cat.id, name: cat.name, description: cat.description || "", level: cat.level })}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(cat.id, cat.name)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
}
