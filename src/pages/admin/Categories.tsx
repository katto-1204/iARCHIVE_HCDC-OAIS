import * as React from "react";
import { AdminLayout } from "@/components/layout";
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from "@/components/ui-components";
import { Plus, Edit, Trash2, FolderTree, Save, X, Search, ChevronRight, ChevronDown, PlusCircle } from "lucide-react";
import { useGetCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CategoryNode {
  id: string;
  name: string;
  description?: string;
  level: string;
  parentId?: string;
  children: CategoryNode[];
}

export default function AdminCategories() {
  const { data: categories, isLoading, refetch } = useGetCategories();
  const { mutate: create } = useCreateCategory();
  const { mutate: update } = useUpdateCategory();
  const { mutate: remove } = useDeleteCategory();
  const { toast } = useToast();

  const [search, setSearch] = React.useState("");
  
  // Create / Edit State
  const [isAdding, setIsAdding] = React.useState(false);
  const [addParentId, setAddParentId] = React.useState<string | undefined>(undefined);
  const [addLevel, setAddLevel] = React.useState<string>("fonds");
  const [newName, setNewName] = React.useState("");
  const [newDesc, setNewDesc] = React.useState("");
  
  const [editingId, setEditingId] = React.useState<string | null>(null);

  // Tree Expansion State
  const [expandedNodes, setExpandedNodes] = React.useState<Set<string>>(new Set());

  const toggleNode = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Build Tree
  const categoryTree = React.useMemo(() => {
    if (!categories) return [];
    
    const nodeMap = new Map<string, CategoryNode>();
    const roots: CategoryNode[] = [];
    
    categories.forEach(c => {
      nodeMap.set(c.id, { ...c, children: [] });
    });
    
    categories.forEach(c => {
      const node = nodeMap.get(c.id)!;
      if (c.parentId && nodeMap.has(c.parentId)) {
        nodeMap.get(c.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });
    
    return roots;
  }, [categories]);

  const handleCreate = () => {
    if (!newName.trim()) return;
    create(
      { data: { name: newName.trim(), description: newDesc.trim() || undefined, level: addLevel as any, parentId: addParentId } },
      {
        onSuccess: () => {
          toast({ title: "Series Created", description: `"${newName}" has been placed in the hierarchy.` });
          setNewName(""); setNewDesc(""); setIsAdding(false); setAddParentId(undefined);
          if (addParentId) toggleNode(addParentId); // Auto-expand parent
          refetch();
        },
        onError: () => toast({ title: "Error", description: "Failed to create series.", variant: "destructive" })
      }
    );
  };

  const handleUpdate = (id: string, updatedName: string, updatedDesc: string) => {
    if (!updatedName.trim()) return;
    update(
      { id, data: { name: updatedName.trim(), description: updatedDesc.trim() || undefined } },
      {
        onSuccess: () => {
          toast({ title: "Updated", description: "Category saved." });
          setEditingId(null);
          refetch();
        },
        onError: () => toast({ title: "Error", description: "Failed to update series.", variant: "destructive" })
      }
    );
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete '${name}'? This will also remove or orphan nested children.`)) {
      remove({ id }, {
        onSuccess: () => { toast({ title: "Deleted", description: "Category removed." }); refetch(); },
        onError: () => toast({ title: "Error", description: "Failed to delete.", variant: "destructive" })
      });
    }
  };

  const openAddForm = (parentId?: string, targetLevel?: string) => {
    setAddParentId(parentId);
    setAddLevel(targetLevel || "fonds");
    setNewName("");
    setNewDesc("");
    setIsAdding(true);
    if (parentId) setExpandedNodes(prev => new Set(prev).add(parentId));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderTree = (nodes: CategoryNode[], depth: number = 0) => {
    if (nodes.length === 0) return null;
    return (
      <div className="w-full">
        {nodes.map(node => {
          const isExpanded = expandedNodes.has(node.id);
          const hasChildren = node.children.length > 0;
          const isEditing = editingId === node.id;

          // Next proper level logic
          const nextLevel = 
            node.level === 'fonds' ? 'subfonds' : 
            node.level === 'subfonds' ? 'series' : 
            node.level === 'series' ? 'subseries' : 
            node.level === 'subseries' ? 'file' : 'item';

          return (
            <div key={node.id} className="border-b last:border-b-0 border-border/40">
              <div 
                className={cn(
                  "flex items-center group transition-colors py-3 pr-4 hover:bg-muted/10",
                  isExpanded && hasChildren ? "bg-muted/5" : ""
                )}
                style={{ paddingLeft: `${Math.max(16, depth * 32 + 16)}px` }}
              >
                {/* Expander Icon */}
                <button 
                  className={cn(
                    "w-6 h-6 flex items-center justify-center shrink-0 mr-2 rounded hover:bg-muted-foreground/10 transition-colors",
                    !hasChildren && "opacity-0 cursor-default"
                  )}
                  onClick={(e) => hasChildren && toggleNode(node.id, e)}
                  disabled={!hasChildren}
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                </button>

                {/* Level Badge */}
                <Badge variant="outline" className={cn(
                  "mr-3 px-2 py-0 text-[10px] w-20 justify-center uppercase shrink-0 font-bold",
                  node.level === 'fonds' ? "bg-blue-50 text-blue-700 border-blue-200" :
                  node.level === 'subfonds' ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                  node.level === 'series' ? "bg-purple-50 text-purple-700 border-purple-200" :
                  node.level === 'subseries' ? "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200" :
                  node.level === 'file' ? "bg-slate-100 text-slate-700" : "bg-neutral-100"
                )}>
                  {node.level}
                </Badge>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-4">
                  {isEditing ? (
                    <div className="flex gap-2 max-w-lg items-center">
                      <Input defaultValue={node.name} className="h-8" onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdate(node.id, e.currentTarget.value, node.description || "");
                        if (e.key === 'Escape') setEditingId(null);
                      }} id={`edit-name-${node.id}`} />
                      <Input defaultValue={node.description} className="h-8" id={`edit-desc-${node.id}`} placeholder="Scope explanation..." />
                    </div>
                  ) : (
                    <div className="flex flex-col cursor-pointer" onClick={() => toggleNode(node.id)}>
                      <span className="font-bold text-[#0a1628] truncate">{node.name}</span>
                      <span className="text-xs text-muted-foreground truncate opacity-80 mt-0.5">
                        {node.description || <span className="italic opacity-50">No scope explanation</span>}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="shrink-0 flex items-center gap-1">
                  {isEditing ? (
                    <>
                      <Button size="sm" className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700" onClick={() => {
                        const n = (document.getElementById(`edit-name-${node.id}`) as HTMLInputElement).value;
                        const d = (document.getElementById(`edit-desc-${node.id}`) as HTMLInputElement).value;
                        handleUpdate(node.id, n, d);
                      }}>Save</Button>
                      <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditingId(null)}>Cancel</Button>
                    </>
                  ) : (
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {node.level !== 'item' && (
                        <Button size="sm" variant="ghost" className="h-8 px-2 text-primary hover:text-primary hover:bg-primary/10 gap-1 text-[11px]" onClick={() => openAddForm(node.id, nextLevel)}>
                          <PlusCircle className="w-3.5 h-3.5" /> Add {nextLevel}
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => setEditingId(node.id)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(node.id, node.name)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Children recursive render */}
              {isExpanded && hasChildren && (
                <div className="animate-in slide-in-from-top-2 fade-in duration-200 border-t border-border/20 bg-muted/3">
                  {renderTree(node.children, depth + 1)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-[#0a1628]">Collection Series</h1>
          <p className="text-muted-foreground">Establish the folder system of fonds. The fonds folder is a dropdown for sub-fonds, revealing series and files.</p>
        </div>
        <Button onClick={() => openAddForm(undefined, "fonds")} className="shrink-0 shadow-lg gap-2 w-full sm:w-auto">
          <Plus className="w-4 h-4" /> New Top-Level Fonds
        </Button>
      </div>

      {isAdding && (
        <Card className="mb-6 border-primary/30 shadow-md animate-in fade-in slide-in-from-top-4 duration-300">
          <CardHeader className="border-b border-border/50 pb-4 bg-muted/5">
            <CardTitle className="text-lg flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-primary" /> Create New {addLevel}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <div>
                <label className="text-sm font-semibold mb-1.5 block">Category Name <span className="text-destructive">*</span></label>
                <Input placeholder="e.g., Reports, HCDC Sub-fonds" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreate()} autoFocus className="bg-white" />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1.5 block">Short Explanation (Scope)</label>
                <Input placeholder="Explanation of what this folder contains..." value={newDesc} onChange={e => setNewDesc(e.target.value)} className="bg-white" />
              </div>
              
              <div className="col-span-1 md:col-span-2">
                <label className="text-sm font-semibold mb-1.5 block">Hierarchy Level</label>
                <Select value={addLevel} onValueChange={setAddLevel}>
                  <SelectTrigger className="bg-white max-w-sm"><SelectValue placeholder="Select level" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fonds"><span className="font-semibold">Fonds:</span> Highest level creator (e.g. HCDC)</SelectItem>
                    <SelectItem value="subfonds"><span className="font-semibold">Sub-fonds:</span> Subdivisions (e.g. CET)</SelectItem>
                    <SelectItem value="series"><span className="font-semibold">Series:</span> Specific function/topic (e.g. Reports)</SelectItem>
                    <SelectItem value="subseries"><span className="font-semibold">Sub-series:</span> Grouping within series</SelectItem>
                    <SelectItem value="file"><span className="font-semibold">File:</span> Logical folder (e.g. 2023 Annual Report)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">
                  <span className="font-semibold text-primary">Note:</span> Items (the actual documents) are created dynamically when ingested in the Materials tab.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button onClick={handleCreate} disabled={!newName.trim()} className="gap-2 sm:w-auto w-full px-6">
                <Save className="w-4 h-4" /> Save {addLevel}
              </Button>
              <Button variant="ghost" onClick={() => setIsAdding(false)} className="sm:w-auto w-full">
                <X className="w-4 h-4 mr-1" /> Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Root Node Container */}
      <Card className="shadow-sm border-border/50 bg-white overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between bg-muted/5 gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input className="pl-9 bg-white" placeholder="Search hierarchy nodes (Fonds, Series...)" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {isLoading ? (
          <div className="h-32 flex items-center justify-center text-muted-foreground">Loading structural data...</div>
        ) : categoryTree.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 rounded-3xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <FolderTree className="w-8 h-8 opacity-40" />
            </div>
            <h3 className="text-lg font-semibold text-foreground/80 mb-1">Empty Repository</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">Establish the core Fonds to begin organizing archival items.</p>
          </div>
        ) : (
          <div className="w-full flex-col flex overflow-x-auto">
            <div className="min-w-[700px] divide-y divide-border/0 pb-4">
               {renderTree(categoryTree)}
            </div>
          </div>
        )}
      </Card>
    </AdminLayout>
  );
}
