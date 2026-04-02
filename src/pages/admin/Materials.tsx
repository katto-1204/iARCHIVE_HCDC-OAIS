import * as React from "react";
import { AdminLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Input } from "@/components/ui-components";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format as formatDate } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Search, Plus, Edit, Trash2, FileText, Calendar as CalendarIcon,
  ChevronRight, Upload, FolderTree, ShieldCheck, CheckCircle2,
  ExternalLink, MoreHorizontal, Layers, Settings2,
} from "lucide-react";
import { Link } from "wouter";
import { ArchivalTree } from "@/components/ArchivalTree";
import { MetadataChecklist } from "@/components/MetadataChecklist";
import { Barcode } from "@/components/Barcode";
import { CompletionRing } from "@/components/CompletionRing";
import {
  SAMPLE_MATERIALS, SAMPLE_HIERARCHY, COMBINED_FIELDS, LEVEL_LABELS,
  type ArchivalMaterial,
} from "@/data/sampleData";
import {
  computeCompletion, computeISADGCompletion, computeDCCompletion,
  getCompletionColor, checkOAISCompliance, getEssentialFieldsStatus,
  getAllFieldValues,
} from "@/data/metadataUtils";
import { useToast } from "@/hooks/use-toast";

type ViewMode = "table" | "detail";

export default function AdminMaterials() {
  const [search, setSearch] = React.useState("");
  const [selectedHierarchyItem, setSelectedHierarchyItem] = React.useState<string | null>(null);
  const [viewMode, setViewMode] = React.useState<ViewMode>("table");

  // Material detail
  const [selectedMaterial, setSelectedMaterial] = React.useState<ArchivalMaterial | null>(null);
  const [editField, setEditField] = React.useState<{ key: string; value: string } | null>(null);

  // Upload dialog
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [checklistOpen, setChecklistOpen] = React.useState(false);
  const [selectedChecklistFields, setSelectedChecklistFields] = React.useState<Set<string>>(new Set());

  // Upload form
  const [uploadForm, setUploadForm] = React.useState({
    title: "", creator: "", date: "", format: "", description: "",
    levelOfDescription: "Item", extentAndMedium: "", access: "public" as const,
    hierarchyPath: "",
  });

  const { toast } = useToast();

  // Filter materials
  const filteredMaterials = React.useMemo(() => {
    let result = [...SAMPLE_MATERIALS];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(m =>
        m.title?.toLowerCase().includes(s) ||
        m.uniqueId.toLowerCase().includes(s) ||
        m.creator?.toLowerCase().includes(s)
      );
    }
    if (selectedHierarchyItem) {
      result = result.filter(m => m.uniqueId === selectedHierarchyItem);
    }
    return result;
  }, [search, selectedHierarchyItem]);

  const handleHierarchySelect = (materialId: string) => {
    setSelectedHierarchyItem(prev => prev === materialId ? null : materialId);
    const mat = SAMPLE_MATERIALS.find(m => m.uniqueId === materialId);
    if (mat) setSelectedMaterial(mat);
  };

  const openMaterialDetail = (mat: ArchivalMaterial) => {
    setSelectedMaterial(mat);
    setViewMode("detail");
  };

  const handleInlineEdit = (mat: ArchivalMaterial, fieldKey: string, value: string) => {
    // In a real app this would call an API
    toast({ title: "Field Updated", description: `${fieldKey} updated to "${value}"` });
    setEditField(null);
  };

  const handleUpload = () => {
    if (!uploadForm.title) return;
    toast({ title: "Material Uploaded", description: `"${uploadForm.title}" has been ingested into the archive.` });
    setUploadOpen(false);
    // Open checklist after upload
    setChecklistOpen(true);
  };

  const handleChecklistToggle = (fieldKey: string) => {
    setSelectedChecklistFields(prev => {
      const next = new Set(prev);
      if (next.has(fieldKey)) next.delete(fieldKey);
      else next.add(fieldKey);
      return next;
    });
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-[#0a1628]">Archival Materials</h1>
          <p className="text-muted-foreground">Browse hierarchy, manage metadata, and catalog items using ISAD(G) standards.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setChecklistOpen(true)}>
            <Settings2 className="w-4 h-4" /> Metadata Checklist
          </Button>
          <Button className="shrink-0 shadow-lg gap-2" onClick={() => setUploadOpen(true)}>
            <Plus className="w-4 h-4" /> Ingest Material
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* ═══ Left: Archival Hierarchy Tree ═══ */}
        <div className="lg:col-span-1">
          <Card className="shadow-sm border-border/50 bg-white sticky top-20">
            <CardHeader className="border-b border-border/50 pb-3 px-4 pt-4">
              <CardTitle className="text-sm font-bold text-[#0a1628] flex items-center gap-2 uppercase tracking-wider">
                <FolderTree className="w-4 h-4 text-[#4169E1]" /> Archival Hierarchy
              </CardTitle>
              <p className="text-[10px] text-muted-foreground mt-1">ISAD(G) structure: Fonds → Items</p>
            </CardHeader>
            <CardContent className="p-2 max-h-[550px] overflow-y-auto">
              <ArchivalTree
                node={SAMPLE_HIERARCHY}
                selectedId={selectedHierarchyItem}
                onSelectItem={handleHierarchySelect}
              />
            </CardContent>
            {selectedHierarchyItem && (
              <div className="px-4 py-2 border-t border-border/50 bg-primary/5">
                <button
                  className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                  onClick={() => { setSelectedHierarchyItem(null); setSelectedMaterial(null); }}
                >
                  ✕ Clear selection
                </button>
              </div>
            )}
          </Card>

          {/* Drag and drop zone */}
          <div className="mt-4 border-2 border-dashed border-border/50 rounded-xl p-6 text-center hover:bg-muted/20 hover:border-primary/30 transition-all cursor-pointer group">
            <Upload className="w-6 h-6 text-muted-foreground/40 mx-auto mb-2 group-hover:text-primary/60 transition-colors" />
            <p className="text-xs font-semibold text-muted-foreground/60 group-hover:text-primary/60 transition-colors">
              Drag & drop files here
            </p>
            <p className="text-[10px] text-muted-foreground/40 mt-1">PDF, TIFF, JPEG, PNG</p>
          </div>
        </div>

        {/* ═══ Right: Materials List / Detail ═══ */}
        <div className="lg:col-span-3">
          {viewMode === "detail" && selectedMaterial ? (
            <MaterialDetailView
              material={selectedMaterial}
              onBack={() => setViewMode("table")}
              editField={editField}
              onEditField={setEditField}
              onSaveField={handleInlineEdit}
            />
          ) : (
            <Card className="shadow-sm border-border/50 bg-white">
              {/* Search bar */}
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
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  {filteredMaterials.length} material{filteredMaterials.length === 1 ? "" : "s"}
                </div>
              </div>

              {/* Materials Table */}
              <div className="divide-y divide-border/40">
                {/* Header */}
                <div className="grid grid-cols-[120px_60px_1fr_100px_70px_80px_60px] gap-2 px-4 py-2.5 bg-muted/30 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  <span>Unique ID</span>
                  <span>Barcode</span>
                  <span>Title</span>
                  <span>Progress</span>
                  <span className="text-right">%</span>
                  <span className="text-center">Status</span>
                  <span></span>
                </div>

                {filteredMaterials.length === 0 ? (
                  <div className="py-16 text-center text-muted-foreground">
                    <FileText className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="font-semibold">No materials found.</p>
                    <p className="text-sm mt-1">Try adjusting your search or hierarchy selection.</p>
                  </div>
                ) : (
                  filteredMaterials.map(mat => {
                    const pct = computeCompletion(mat);
                    const color = getCompletionColor(pct);
                    const isOAIS = checkOAISCompliance(mat);

                    return (
                      <div
                        key={mat.uniqueId}
                        className="grid grid-cols-[120px_60px_1fr_100px_70px_80px_60px] gap-2 px-4 py-3 items-center hover:bg-muted/10 transition-colors group"
                      >
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                          <span className="font-mono text-[11px] font-bold text-[#0a1628]">{mat.uniqueId}</span>
                        </div>
                        <Barcode value={mat.uniqueId} width={50} height={16} />
                        <div className="min-w-0">
                          <button
                            className="text-sm font-semibold text-[#0a1628] hover:text-primary truncate block text-left transition-colors"
                            onClick={() => openMaterialDetail(mat)}
                          >
                            {mat.title}
                          </button>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-muted-foreground truncate">{mat.creator}</span>
                            {isOAIS && (
                              <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded-full inline-flex items-center gap-0.5">
                                <ShieldCheck className="w-2 h-2" /> OAIS
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="h-1.5 bg-muted/60 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, backgroundColor: color }}
                          />
                        </div>
                        <span className="text-right text-xs font-bold" style={{ color }}>{pct}%</span>
                        <div className="text-center">
                          <Badge
                            variant={pct >= 100 ? "success" : pct >= 50 ? "accent" : "default"}
                            className="text-[9px] capitalize"
                          >
                            {pct >= 100 ? "Complete" : pct >= 50 ? "Partial" : "Incomplete"}
                          </Badge>
                        </div>
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7"
                            onClick={() => openMaterialDetail(mat)}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* ═══ Upload Dialog ═══ */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ingest New Material</DialogTitle>
            <DialogDescription>
              Upload a new item into the archival hierarchy. After upload, a metadata checklist will appear.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold mb-1.5 block">Title <span className="text-red-500">*</span></label>
                <Input
                  value={uploadForm.title}
                  onChange={e => setUploadForm({ ...uploadForm, title: e.target.value })}
                  placeholder="Archival title"
                />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1.5 block">Creator</label>
                <Input
                  value={uploadForm.creator}
                  onChange={e => setUploadForm({ ...uploadForm, creator: e.target.value })}
                  placeholder="Author or creator"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold mb-1.5 block">Date</label>
                <Input
                  value={uploadForm.date}
                  onChange={e => setUploadForm({ ...uploadForm, date: e.target.value })}
                  placeholder="YYYY-MM-DD"
                  type="date"
                />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1.5 block">Level of Description</label>
                <Select value={uploadForm.levelOfDescription} onValueChange={v => setUploadForm({ ...uploadForm, levelOfDescription: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(LEVEL_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold mb-1.5 block">Format</label>
                <Input
                  value={uploadForm.format}
                  onChange={e => setUploadForm({ ...uploadForm, format: e.target.value })}
                  placeholder="application/pdf, image/tiff"
                />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1.5 block">Extent & Medium</label>
                <Input
                  value={uploadForm.extentAndMedium}
                  onChange={e => setUploadForm({ ...uploadForm, extentAndMedium: e.target.value })}
                  placeholder="e.g. 45 pages; 2.5 MB"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold mb-1.5 block">Description / Scope</label>
              <Textarea
                value={uploadForm.description}
                onChange={e => setUploadForm({ ...uploadForm, description: e.target.value })}
                placeholder="Scope and content summary"
                className="min-h-[80px]"
              />
            </div>
            <div className="bg-muted/30 p-4 rounded-xl border border-dashed border-muted-foreground/20">
              <label className="text-sm font-semibold mb-2 block">File Upload</label>
              <Input type="file" className="bg-white" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setUploadOpen(false)}>Cancel</Button>
            <Button onClick={handleUpload} disabled={!uploadForm.title} className="gap-2">
              <Upload className="w-4 h-4" /> Ingest & Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Metadata Checklist Dialog ═══ */}
      <Dialog open={checklistOpen} onOpenChange={setChecklistOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" /> Metadata Checklist
            </DialogTitle>
            <DialogDescription>
              Select the applicable metadata fields for this series. The system will apply selected fields as structured metadata.
            </DialogDescription>
          </DialogHeader>

          <MetadataChecklist
            selectedFields={selectedChecklistFields}
            onToggle={handleChecklistToggle}
            onSelectAll={() => setSelectedChecklistFields(new Set(COMBINED_FIELDS.map(f => f.fieldKey)))}
            onClearAll={() => setSelectedChecklistFields(new Set())}
          />

          <DialogFooter>
            <Button variant="ghost" onClick={() => setChecklistOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              toast({
                title: "Checklist Saved",
                description: `${selectedChecklistFields.size} metadata fields applied to this series.`,
              });
              setChecklistOpen(false);
            }} className="gap-2">
              <CheckCircle2 className="w-4 h-4" /> Apply Checklist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

// ═══ Material Detail View (inline editing) ═══════════════════════════════════

function MaterialDetailView({
  material,
  onBack,
  editField,
  onEditField,
  onSaveField,
}: {
  material: ArchivalMaterial;
  onBack: () => void;
  editField: { key: string; value: string } | null;
  onEditField: (f: { key: string; value: string } | null) => void;
  onSaveField: (m: ArchivalMaterial, key: string, value: string) => void;
}) {
  const pct = computeCompletion(material);
  const isadgPct = computeISADGCompletion(material);
  const dcPct = computeDCCompletion(material);
  const isOAIS = checkOAISCompliance(material);
  const essentialStatus = getEssentialFieldsStatus(material);
  const allFields = getAllFieldValues(material);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button onClick={onBack} className="text-xs font-semibold text-primary mb-2 hover:text-primary/80 transition-colors flex items-center gap-1">
            ← Back to Materials
          </button>
          <h2 className="text-2xl font-bold text-[#0a1628]">{material.title}</h2>
          <div className="flex items-center gap-3 mt-2">
            <span className="font-mono text-xs text-muted-foreground">{material.uniqueId}</span>
            {isOAIS && (
              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full inline-flex items-center gap-1">
                <ShieldCheck className="w-2.5 h-2.5" /> OAIS Compliant
              </span>
            )}
            <Badge variant={material.access === "public" ? "success" : material.access === "restricted" ? "accent" : "default"} className="text-[9px] capitalize">
              {material.access}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <CompletionRing percentage={pct} size={70} strokeWidth={5} color={getCompletionColor(pct)} label="Overall" />
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <Barcode value={material.uniqueId} width={100} height={28} />
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center justify-center gap-4">
            <CompletionRing percentage={isadgPct} size={60} strokeWidth={4} color="#4169E1" label="ISAD(G)" />
            <CompletionRing percentage={dcPct} size={60} strokeWidth={4} color="#0EA5E9" label="Dublin Core" />
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Essential Fields</h4>
            <div className="space-y-1">
              {essentialStatus.map(({ field, filled }) => (
                <div key={field.code} className="flex items-center gap-1.5 text-[11px]">
                  {filled ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <span className="w-3 h-3 rounded-full bg-red-100 flex items-center justify-center text-red-500 text-[8px] font-bold">✘</span>}
                  <span className={filled ? "text-foreground/70" : "text-red-600 font-semibold"}>{field.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hierarchy path */}
      {material.hierarchyPath && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
          <FolderTree className="w-3.5 h-3.5 text-primary shrink-0" />
          {material.hierarchyPath.split(" > ").map((segment, i, arr) => (
            <React.Fragment key={i}>
              <span className={i === arr.length - 1 ? "font-semibold text-foreground" : ""}>{segment}</span>
              {i < arr.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground/40" />}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Terms of Use */}
      {material.termsOfUse && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <h4 className="text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-1">Terms of Use</h4>
          <p className="text-xs text-amber-700">{material.termsOfUse}</p>
        </div>
      )}

      {/* Full Metadata Table with inline editing */}
      <Card className="shadow-sm border-border/50">
        <CardHeader className="border-b border-border/50 pb-3">
          <CardTitle className="text-sm font-bold text-[#0a1628] flex items-center gap-2 uppercase tracking-wider">
            <FileText className="w-4 h-4 text-muted-foreground" />
            Full Metadata ({allFields.filter(f => f.filled).length}/{allFields.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/30">
            {allFields.map(({ field, value, filled }) => {
              const isEditing = editField?.key === field.fieldKey;
              return (
                <div key={field.code} className="grid grid-cols-[100px_1fr_80px_50px_40px] gap-2 px-4 py-2 items-center hover:bg-muted/10 transition-colors group">
                  <span className="font-mono text-[10px] text-muted-foreground">{field.code}</span>
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-foreground/80">
                      {field.name}
                      {field.isEssential && <span className="text-red-500 ml-0.5">*</span>}
                    </span>
                  </div>
                  <div>
                    {field.standard === "Both" ? (
                      <Badge variant="accent" className="text-[8px] bg-purple-50 text-purple-700 border-purple-200 px-1 py-0">Both</Badge>
                    ) : field.standard === "ISAD(G)" ? (
                      <Badge variant="default" className="text-[8px] bg-blue-50 text-blue-700 border-blue-200 px-1 py-0">ISAD(G)</Badge>
                    ) : (
                      <Badge variant="success" className="text-[8px] bg-sky-50 text-sky-700 border-sky-200 px-1 py-0">DC</Badge>
                    )}
                  </div>
                  <div className="text-center">
                    {filled ? <span className="text-emerald-500 font-bold text-xs">✔</span> : <span className="text-red-400 font-bold text-xs">✘</span>}
                  </div>
                  <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="p-1 rounded hover:bg-muted transition-colors"
                      onClick={() => onEditField({ key: field.fieldKey, value: value || "" })}
                    >
                      <Edit className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </div>
                  {/* Value row */}
                  {isEditing ? (
                    <div className="col-span-5 pb-1">
                      <div className="flex gap-2">
                        <Input
                          className="text-xs h-8"
                          value={editField.value}
                          onChange={e => onEditField({ ...editField, value: e.target.value })}
                          autoFocus
                        />
                        <Button size="sm" className="h-8 text-xs px-3" onClick={() => onSaveField(material, field.fieldKey, editField.value)}>Save</Button>
                        <Button size="sm" variant="ghost" className="h-8 text-xs px-3" onClick={() => onEditField(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : value ? (
                    <div className="col-span-5 pl-[100px]">
                      <p className="text-[11px] text-foreground/60 truncate">{value}</p>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
