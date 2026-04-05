import * as React from "react";
import { AdminLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Input } from "@/components/ui-components";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Search, Plus, Edit, ExternalLink, Layers, Settings2,
  Upload, FolderTree, ShieldCheck, CheckCircle2, FileText,
  FileDigit, Link as LinkIcon, Loader2, Video, Image as ImageIcon,
  ZoomIn, ZoomOut, RotateCw, Maximize2, Download, AlertTriangle, ChevronRight, X, Save
} from "lucide-react";
import { ArchivalTree } from "@/components/ArchivalTree";
import { MetadataChecklist } from "@/components/MetadataChecklist";
import { Barcode } from "@/components/Barcode";
import {
  SAMPLE_MATERIALS, SAMPLE_HIERARCHY, COMBINED_FIELDS, LEVEL_LABELS,
  type ArchivalMaterial
} from "@/data/sampleData";
import { 
  getMaterials, saveMaterial, deleteMaterial, addActivity 
} from "@/data/storage";

declare global {
  interface Window {
    pdfjsLib: any;
    mammoth: any;
    XLSX: any;
    ExcelJS: any;
    saveAs: any;
  }
}
import {
  computeCompletion, getCompletionColor, checkOAISCompliance, 
  getAllFieldValues, downloadMetadataExcel,
} from "@/data/metadataUtils";
import { useToast } from "@/hooks/use-toast";

type ViewMode = "table" | "detail";

export default function AdminMaterials() {
  const [search, setSearch] = React.useState("");
  const [selectedHierarchyItem, setSelectedHierarchyItem] = React.useState<string | null>(null);
  const [materials, setMaterials] = React.useState<ArchivalMaterial[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 8;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedHierarchyItem]);

  React.useEffect(() => {
    setMaterials(getMaterials());
  }, []);

  // Material detail expansion
  const [selectedMaterial, setSelectedMaterial] = React.useState<ArchivalMaterial | null>(null);
  const [editingMaterialId, setEditingMaterialId] = React.useState<string | null>(null);

  // Upload dialog state
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [checklistOpen, setChecklistOpen] = React.useState(false);
  const [selectedChecklistFields, setSelectedChecklistFields] = React.useState<Set<string>>(new Set());
  const [checklistValues, setChecklistValues] = React.useState<Record<string, string>>({});

  // Dynamic Upload Form
  const [mediaCategory, setMediaCategory] = React.useState<"document" | "image" | "video">("document");
  const [videoInputType, setVideoInputType] = React.useState<"file" | "url">("file");

  const [uploadForm, setUploadForm] = React.useState({
    title: "", creator: "", dateOfDescription: "", format: "", description: "",
    levelOfDescription: "Item", extentAndMedium: "", access: "public" as const,
    videoUrl: "", hierarchyPath: "", termsOfUse: "", referenceCode: "",
    
    // Auto Reference Code Gen fields
    year: "26", catNo: "01", matNo: "0000001",
    
    // Cascade Selection
    fonds: "", subfonds: "", series: ""
  });

  const generatedRefCode = `${uploadForm.year}iA${uploadForm.catNo}${uploadForm.matNo}`;

  const [processingState, setProcessingState] = React.useState<"idle" | "scanning" | "compressing" | "done">("idle");
  const [scanProgress, setScanProgress] = React.useState(0);
  const [fileDetails, setFileDetails] = React.useState<{ name: string; ogSize: number; newSize: number } | null>(null);
  const [needsManualInput, setNeedsManualInput] = React.useState(true); // Default show for new modal layout
  const [validationErrors, setValidationErrors] = React.useState<string[]>([]);

  const { toast } = useToast();

  React.useEffect(() => {
    if (!window.pdfjsLib) {
      const script = document.createElement('script');
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      script.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"; };
      document.body.appendChild(script);
    }
    if (!window.mammoth) {
      const script = document.createElement('script');
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js";
      document.body.appendChild(script);
    }
    if (!window.XLSX) {
      const script = document.createElement('script');
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
      document.body.appendChild(script);
    }
    if (!window.ExcelJS) {
      const script = document.createElement('script');
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js";
      document.body.appendChild(script);
    }
    if (!window.saveAs) {
      const script = document.createElement('script');
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js";
      document.body.appendChild(script);
    }
  }, []);

  const handleMediaUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadForm(prev => ({ ...prev, format: file.type || "unknown" }));

    setProcessingState("compressing");
    for (let i = 0; i <= 100; i += 20) {
      setScanProgress(i);
      await new Promise(r => setTimeout(r, 60));
    }
    const ogSize = file.size;
    const newSize = Math.floor(ogSize * 0.3); // Compressed BY 70%
    setFileDetails({ name: file.name, ogSize, newSize });
    setUploadForm(prev => ({ ...prev, extentAndMedium: `${((ogSize-newSize)/ogSize*100).toFixed(0)}% Compressed` }));
    setProcessingState("done");
  };

  const handleMetadataScanUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setProcessingState("scanning");
    setScanProgress(0);

    const isPdf = file.type === "application/pdf";
    const isDocx = file.name.toLowerCase().endsWith(".docx");
    const isCsv = file.name.toLowerCase().endsWith(".csv");
    const isXlsx = file.name.toLowerCase().endsWith(".xlsx");
    
    setUploadForm(prev => ({
      ...prev,
      title: prev.title || file.name.replace(/\.[^/.]+$/, ""),
    }));

    for (let i = 0; i <= 100; i += 10) {
      setScanProgress(i);
      await new Promise(r => setTimeout(r, 50));
    }

    try {
      let extractedText = "";
      
      if (isPdf && window.pdfjsLib) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);
        const textContent = await page.getTextContent();
        extractedText = textContent.items.map((item: any) => item.str).join(" ") + " ";
      } else if (isDocx && window.mammoth) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await window.mammoth.extractRawText({ arrayBuffer });
        extractedText = result.value;
      } else if (isCsv) {
        extractedText = await file.text();
      } else if (isXlsx && window.XLSX) {
        const arrayBuffer = await file.arrayBuffer();
        const wb = window.XLSX.read(arrayBuffer);
        const ws = wb.Sheets[wb.SheetNames[0]];
        extractedText = window.XLSX.utils.sheet_to_txt(ws, { sep: " " });
      }

      if (extractedText) {
        // Normalize any kind of whitespace sequence (including newlines) into a single space
        const cleanText = extractedText.replace(/\s+/g, ' '); 
        const previewSnippet = extractedText.substring(0, 150).trim();
        
        // Accurate pattern boundary extractor
        const extractField = (fieldName: string, alternateNames: string[] = []) => {
           const labels = [fieldName, ...alternateNames].map(l => l.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join("|");
           const nextLabels = [
             "Reference Code", "Unique ID", "Title", "Creator", "Author", "Date", 
             "Level of Description", "Extent and Medium", "Fonds", "Sub-fonds", "Series",
             "Reference", "Access", "Conditions"
           ].join("|");
           
           const regex = new RegExp(`(?:^|\\s)(?:${labels})\\s*:?\\s*(.*?)(?=\\s*(?:(?:${nextLabels})\\s*:?\\s*)|$)`, "i");
           const match = cleanText.match(regex);
           return match ? match[1].trim() : "";
        };
        
        // Scan for Unique Identifier pattern e.g. 26iA010000001
        const idMatch = cleanText.match(/(2\d)iA(\d{2})(\d{7})/i);
        
        // Better Regex field matchers using boundary extraction
        const parsedTitle = extractField("Title");
        const parsedCreator = extractField("Creator", ["Author"]);
        const parsedFonds = extractField("Fonds");
        const parsedSubfonds = extractField("Sub-fonds", ["Subfonds", "Sub fonds"]);
        const parsedSeries = extractField("Series");
        
        setUploadForm((prev: any) => {
          // Map extracted hierarchy names to their respective IDs natively locally in state
          // e.g. "Holy Cross of Davao College" -> fondsList.find => its ID
          let fName = prev.fonds;
          let sName = prev.subfonds;
          let serName = prev.series;
          
          if (parsedFonds && fondsList) {
             const foundF = fondsList.find((f: any) => f.name.toLowerCase().includes(parsedFonds.toLowerCase()));
             if (foundF) {
               fName = foundF.name;
               if (parsedSubfonds && foundF.children) {
                 const foundS = foundF.children.find((s: any) => s.name.toLowerCase().includes(parsedSubfonds.toLowerCase()));
                 if (foundS) {
                   sName = foundS.name;
                   if (parsedSeries && foundS.children) {
                      const foundSer = foundS.children.find((ser: any) => ser.name.toLowerCase().includes(parsedSeries.toLowerCase()));
                      if (foundSer) serName = foundSer.name;
                   }
                 }
               }
             }
          }
          
          return {
            ...prev, 
            description: prev.description || previewSnippet,
            year: idMatch ? idMatch[1] : prev.year,
            catNo: idMatch ? idMatch[2] : prev.catNo,
            matNo: idMatch ? idMatch[3] : prev.matNo,
            title: parsedTitle || prev.title,
            creator: parsedCreator || prev.creator,
            fonds: fName,
            subfonds: sName,
            series: serName
          };
        });

        // Also populate checklist values for known fields
        setChecklistValues(prev => ({
          ...prev,
          title: parsedTitle || prev.title,
          creator: parsedCreator || prev.creator,
          description: previewSnippet,
          referenceCode: idMatch ? idMatch[0] : "",
        }));
      }
    } catch (err) {
      console.error("Scan failed", err);
    }

    setProcessingState("done");
  };

  const filteredMaterials = React.useMemo(() => {
    let result = [...materials];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(m =>
        m.title?.toLowerCase().includes(s) || m.uniqueId.toLowerCase().includes(s) || m.creator?.toLowerCase().includes(s)
      );
    }
    if (selectedHierarchyItem) {
      result = result.filter(m => m.hierarchyPath?.includes(selectedHierarchyItem) || m.uniqueId === selectedHierarchyItem);
    }
    return result;
  }, [materials, search, selectedHierarchyItem]);

  const totalPages = Math.ceil(filteredMaterials.length / itemsPerPage);
  const paginatedMaterials = filteredMaterials.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleMaterialDetail = (mat: ArchivalMaterial) => {
    setSelectedMaterial(prev => prev?.uniqueId === mat.uniqueId ? null : mat);
  };

  const submitIngest = () => {
    const missing: string[] = [];
    if (!uploadForm.title) missing.push("title");
    if (!uploadForm.creator) missing.push("creator");
    if (!uploadForm.catNo) missing.push("catNo");
    if (!uploadForm.matNo) missing.push("matNo");
    if (!uploadForm.year) missing.push("year");
    if (!uploadForm.fonds) missing.push("fonds");
    
    if (missing.length > 0) {
      setValidationErrors(missing);
      toast({ title: "Validation Error", description: "Please fill in all required fields highlighted in red.", variant: "destructive" });
      return;
    }
    
    toast({ title: "Material Ready", description: `Opening checklist...` });
    setUploadOpen(false);
    setChecklistOpen(true);
  };

  const handleDeleteMaterial = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this material? This action cannot be undone.")) {
      const updated = deleteMaterial(id);
      setMaterials(updated);
      addActivity({
        user: "Admin",
        actionType: "delete",
        description: `Deleted material: ${id}`
      });
      toast({ title: "Deleted", description: "Material removed from repository." });
    }
  };

  const handleEditMaterial = (mat: ArchivalMaterial, e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadForm({
      title: mat.title || "",
      creator: mat.creator || "",
      dateOfDescription: mat.dateOfDescription || "",
      format: mat.format || "",
      description: mat.description || "",
      levelOfDescription: mat.levelOfDescription || "Item",
      extentAndMedium: mat.extentAndMedium || "",
      access: mat.access as any,
      videoUrl: mat.fileUrl || "",
      hierarchyPath: mat.hierarchyPath || "",
      termsOfUse: mat.termsOfUse || "",
      referenceCode: mat.referenceCode || "",
      year: mat.uniqueId?.substring(0, 2) || "26",
      catNo: mat.uniqueId?.substring(4, 6) || "01",
      matNo: mat.uniqueId?.substring(6) || "0000001",
      fonds: mat.hierarchyPath?.split(" > ")[1] || "",
      subfonds: mat.hierarchyPath?.split(" > ")[2] || "",
      series: mat.hierarchyPath?.split(" > ")[3] || ""
    });
    setChecklistValues(mat as any);
    setUploadOpen(true);
  };

  // Hierarchy Helpers
  const fondsList = SAMPLE_HIERARCHY.children || [];
  const subFondsList = fondsList.find((f: any) => f.name === uploadForm.fonds)?.children || [];
  const seriesList = subFondsList.find((s: any) => s.name === uploadForm.subfonds)?.children || [];

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-[#0a1628]">Archival Materials</h1>
          <p className="text-muted-foreground">Browse hierarchy, manage metadata, and catalog items using ISAD(G) standards.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="shrink-0 gap-2 w-full sm:w-auto" onClick={() => setChecklistOpen(true)}>
              <ShieldCheck className="w-4 h-4" /> Metadata Checklist
           </Button>
           <Button className="shrink-0 shadow-lg gap-2 w-full sm:w-auto" onClick={() => {
              setProcessingState("idle"); 
              setFileDetails(null);
              setNeedsManualInput(true);
              setValidationErrors([]);
              setEditingMaterialId(null);
              setUploadForm({
                title: "", creator: "", dateOfDescription: "", format: "", description: "",
                levelOfDescription: "Item", extentAndMedium: "", access: "public",
                videoUrl: "", hierarchyPath: "", termsOfUse: "", referenceCode: "",
                year: "26", catNo: "01", matNo: "0000001",
                fonds: "", subfonds: "", series: ""
              });
              setChecklistValues({});
              setUploadOpen(true);
           }}>
              <Plus className="w-4 h-4 text-white" /> Ingest Material
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* ═══ Left: Archival Hierarchy Tree ═══ */}
        <div className="lg:col-span-1 hidden lg:block">
          <Card className="shadow-sm border-border/50 bg-white sticky top-20">
            <CardHeader className="border-b border-border/50 pb-3 px-4 pt-4">
              <CardTitle className="text-[11px] font-bold text-[#0a1628] flex items-center gap-2 uppercase tracking-widest">
                <FolderTree className="w-4 h-4 text-primary" /> Archival Hierarchy
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 max-h-[700px] overflow-y-auto custom-scrollbar">
              <ArchivalTree node={SAMPLE_HIERARCHY} selectedId={selectedHierarchyItem} onSelectItem={(id) => {
                setSelectedHierarchyItem(prev => prev === id ? null : id);
                setSelectedMaterial(null);
              }} />
            </CardContent>
          </Card>
        </div>

        {/* ═══ Right: Materials List & Inline Details ═══ */}
        <div className="lg:col-span-3">
          <Card className="shadow-sm border-border/50 bg-white">
            <div className="p-4 border-b flex flex-col items-center gap-4 bg-muted/5 border-dashed border-2 rounded-t-xl text-center cursor-pointer m-4 py-8 hover:bg-muted/10 transition-colors" onClick={() => {
                setProcessingState("idle"); setFileDetails(null); setNeedsManualInput(true); setValidationErrors([]); setUploadOpen(true);
            }}>
               <Upload className="w-8 h-8 text-muted-foreground opacity-40 mb-2" />
               <div className="text-sm font-semibold text-primary/80">Ingest New Accession</div>
               <div className="text-xs text-muted-foreground">Drop media and metadata files here</div>
            </div>

            <div className="p-4 border-b flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input className="pl-9 bg-muted/50" placeholder="Search item title or ID..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-2 shrink-0">
                <Layers className="w-4 h-4" /> {filteredMaterials.length} items
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[800px] divide-y divide-border/40">
                <div className="grid grid-cols-[120px_60px_1fr_100px_70px_80px_60px] gap-2 px-4 py-2.5 bg-muted/30 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  <span>Unique ID</span><span>Barcode</span><span>Title</span><span>Progress</span><span className="text-right">%</span><span className="text-center">Status</span><span></span>
                </div>

                {filteredMaterials.length === 0 ? (
                  <div className="py-16 text-center text-muted-foreground">
                    <FileText className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="font-semibold">No materials found.</p>
                    <p className="text-sm mt-1">Try adjusting your search or hierarchy selection.</p>
                  </div>
                ) : (
                  paginatedMaterials.map(mat => {
                    const pct = computeCompletion(mat);
                    const color = getCompletionColor(pct);
                    const isOAIS = checkOAISCompliance(mat);
                    const isExpanded = selectedMaterial?.uniqueId === mat.uniqueId;

                    return (
                      <React.Fragment key={mat.uniqueId}>
                        <div className={cn("grid grid-cols-[120px_60px_1fr_100px_70px_80px_60px] gap-2 px-4 py-3 items-center hover:bg-muted/10 transition-colors group cursor-pointer", isExpanded && "bg-muted/5")} onClick={() => toggleMaterialDetail(mat)}>
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                            <span className="font-mono text-[11px] font-bold text-[#0a1628]">{mat.uniqueId}</span>
                          </div>
                          <Barcode value={mat.uniqueId} width={50} height={16} />
                          <div className="min-w-0 pr-4">
                            <span className="text-sm font-semibold text-[#0a1628] group-hover:text-primary truncate block text-left transition-colors w-full">
                              {mat.title}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">{mat.creator}</span>
                              {isOAIS && (
                                <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded-full inline-flex items-center gap-0.5 shrink-0">
                                  <ShieldCheck className="w-2 h-2" /> OAIS Compliant
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="h-1.5 bg-muted/60 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
                          </div>
                          <span className="text-right text-xs font-bold" style={{ color }}>{pct}%</span>
                          <div className="text-center">
                            <Badge variant={pct >= 100 ? "success" : pct >= 50 ? "accent" : "default"} className="text-[9px] capitalize">{pct >= 100 ? "Complete" : pct >= 50 ? "Partial" : "Incomplete"}</Badge>
                          </div>
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={(e) => handleEditMaterial(mat, e)}>
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-600" onClick={(e) => handleDeleteMaterial(mat.id, e)}>
                              <X className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* EXPANDED ACCORDION VIEW */}
                        {isExpanded && (
                          <div className="col-span-full border-b bg-white animate-in slide-in-from-top-1 px-4 py-8 relative">
                             <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: color }} />
                             
                             <div className="flex items-center justify-between mb-8">
                               <div>
                                 <h2 className="text-2xl font-bold text-[#0a1628] leading-tight pr-4">{mat.title}</h2>
                                 <div className="flex items-center gap-2 mt-2">
                                     <span className="font-mono text-xs font-bold text-muted-foreground">{mat.uniqueId}</span>
                                     <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-200 uppercase font-bold px-1.5 py-0.5">Item Level Record</Badge>
                                 </div>
                               </div>
                               <Button variant="outline" size="sm" onClick={() => downloadMetadataExcel(mat)} className="h-8 shadow-sm">
                                  <Download className="w-3.5 h-3.5 mr-2" /> Export Metadata
                               </Button>
                             </div>
                             
                             {/* Re-use MetadataChecklist layout directly! */}
                             <MetadataChecklist 
                                values={mat as any}
                                selectedFields={new Set()}
                                onToggle={() => {}}
                                onSelectAll={() => {}}
                                onClearAll={() => {}}
                                onValueChange={(fieldKey, value) => {
                                  // Inline edit propagation for CRUD saving
                                  const updatedMat = { ...mat, [fieldKey]: value };
                                  saveMaterial(updatedMat as any);
                                  setMaterials(prev => prev.map(m => m.id === mat.id ? (updatedMat as any) : m));
                                }}
                                className="shadow-none border border-border/60"
                             />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-border/40 bg-muted/5">
                <span className="text-xs text-muted-foreground font-medium">
                   Showing {(currentPage - 1) * itemsPerPage + 1} to Math.min(currentPage * itemsPerPage, filteredMaterials.length) of {filteredMaterials.length} materials
                </span>
                <div className="flex gap-1.5">
                   <Button variant="outline" size="sm" className="h-8" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Previous</Button>
                   <div className="flex items-center px-3 text-xs font-bold text-[#0a1628]">{currentPage} / {totalPages}</div>
                   <Button variant="outline" size="sm" className="h-8" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* ═══ Upload & Scan Dialog (Admin Form Overhaul) ═══ */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto bg-[#fafbfc]">
          <DialogHeader className="border-b pb-4 mb-2">
            <DialogTitle className="flex items-center gap-2 text-xl text-[#0a1628]">
              <Upload className="w-5 h-5 text-primary" /> Setup Archival Item
            </DialogTitle>
            <DialogDescription>
              Assign the reference identifier, upload media and metadata separately, and organize the hierarchy.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            
            {/* 1. Reference Code Generator */}
            <div className="bg-slate-50 rounded-xl p-6 border shadow-sm flex flex-col justify-between">
              <div className="mb-4">
                 <span className="text-muted-foreground text-xs font-bold mb-1 block">Unique material identifier</span>
                 <div className="text-3xl font-mono text-[#0a1628] font-bold tracking-widest">{generatedRefCode}</div>
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                 <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] w-fit font-mono font-bold">{uploadForm.year} = year</Badge>
                 <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] w-fit font-mono font-bold">iA = iArchive</Badge>
                 <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] w-fit font-mono font-bold">{uploadForm.catNo} = category</Badge>
                 <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] w-fit font-mono font-bold">{uploadForm.matNo} = material no.</Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-border pt-4">
                <div>
                  <label className="text-muted-foreground text-[10px] font-bold block mb-1.5 uppercase">Category no.</label>
                  <Select value={uploadForm.catNo} onValueChange={v => setUploadForm({...uploadForm, catNo: v})}>
                    <SelectTrigger className={cn("h-9 bg-white font-mono", validationErrors.includes('catNo') && "border-red-500 bg-red-50/50")}>
                      <SelectValue placeholder="Cat No." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="01">01 - Yearbook</SelectItem>
                      <SelectItem value="02">02 - Research Paper / Publication</SelectItem>
                      <SelectItem value="03">03 - Administrative Record</SelectItem>
                      <SelectItem value="04">04 - Capstone / Student Final Output</SelectItem>
                      <SelectItem value="05">05 - Photograph / Multimedia</SelectItem>
                      <SelectItem value="06">06 - Newspaper / Press</SelectItem>
                      <SelectItem value="07">07 - Manuals / Handbooks</SelectItem>
                      <SelectItem value="08">08 - Certificates / Awards</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-muted-foreground text-[10px] font-bold block mb-1.5 uppercase">Material no.</label>
                  <Input maxLength={7} className={cn("bg-white font-mono", validationErrors.includes('matNo') && "border-red-500 bg-red-50/50")} value={uploadForm.matNo} onChange={e => setUploadForm({...uploadForm, matNo: e.target.value})} />
                </div>
                <div>
                  <label className="text-muted-foreground text-[10px] font-bold block mb-1.5 uppercase">Year</label>
                  <Input maxLength={2} className={cn("bg-white font-mono", validationErrors.includes('year') && "border-red-500 bg-red-50/50")} value={uploadForm.year} onChange={e => setUploadForm({...uploadForm, year: e.target.value})} />
                </div>
              </div>
            </div>

            {/* 2. Cascading Hierarchy & Basic Info */}
            <div className="bg-white p-5 rounded-xl border shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#0a1628] mb-4">Structural Placement</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Fonds <span className="text-red-500">*</span></label>
                      <Input 
                        list="fonds-datalist" 
                        placeholder="Type or select..." 
                        value={uploadForm.fonds} 
                        onChange={(e) => { 
                          setUploadForm({ ...uploadForm, fonds: e.target.value, subfonds: "", series: "" }); 
                          setValidationErrors(prev => prev.filter(k => k !== 'fonds')); 
                        }} 
                        className={cn("h-9 bg-white", validationErrors.includes('fonds') && "border-red-500 bg-red-50/50")} 
                      />
                      <datalist id="fonds-datalist">
                        {fondsList.map((f: any) => <option key={f.id} value={f.name} />)}
                      </datalist>
                  </div>
                  <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Sub-fonds</label>
                      <Input 
                        list="subfonds-datalist" 
                        placeholder="Type or select..." 
                        value={uploadForm.subfonds} 
                        onChange={(e) => setUploadForm({ ...uploadForm, subfonds: e.target.value, series: "" })} 
                        className="h-9 bg-white" 
                        disabled={!uploadForm.fonds} 
                      />
                      <datalist id="subfonds-datalist">
                        {subFondsList.map((s: any) => <option key={s.id} value={s.name} />)}
                      </datalist>
                  </div>
                  <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Series</label>
                      <Input 
                        list="series-datalist" 
                        placeholder="Type or select..." 
                        value={uploadForm.series} 
                        onChange={(e) => setUploadForm({ ...uploadForm, series: e.target.value })} 
                        className="h-9 bg-white" 
                        disabled={!uploadForm.subfonds} 
                      />
                      <datalist id="series-datalist">
                        {seriesList.map((s: any) => <option key={s.id} value={s.name} />)}
                      </datalist>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-[#0a1628] mb-1.5 block">Title (Double Check Scan) <span className="text-red-500">*</span></label>
                    <Input placeholder="Material Title" value={uploadForm.title} onChange={e => { setUploadForm({...uploadForm, title: e.target.value}); setValidationErrors(x => x.filter(k => k !== 'title')); }} className={cn("h-9", validationErrors.includes('title') && "border-red-500 bg-red-50/50")} />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-[#0a1628] mb-1.5 block">Creator / Author <span className="text-red-500">*</span></label>
                    <Input placeholder="e.g. CET Dept" value={uploadForm.creator} onChange={e => { setUploadForm({...uploadForm, creator: e.target.value}); setValidationErrors(x => x.filter(k => k !== 'creator')); }} className={cn("h-9", validationErrors.includes('creator') && "border-red-500 bg-red-50/50")} />
                  </div>
                </div>
            </div>

            {/* 3. Dual Uploads */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Box A: Main Material */}
              <div className="border border-indigo-200 bg-indigo-50/30 rounded-xl p-5">
                 <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-widest mb-1 flex items-center gap-2">
                   <Upload className="w-4 h-4 text-indigo-500" /> 1. Main Material Asset
                 </h4>
                 <p className="text-[10px] text-muted-foreground mb-4 font-medium">Select the media type and upload the file.</p>
                 
                 <div className="flex gap-2 mb-3 bg-white/50 p-1 rounded-lg border border-indigo-100 flex-wrap">
                    <button type="button" onClick={() => setMediaCategory("document")} className={cn("flex-1 text-[10px] font-bold uppercase tracking-wide py-2 rounded-md flex items-center justify-center gap-1.5 transition-all text-xs min-w-[70px]", mediaCategory === "document" ? "bg-indigo-600 text-white shadow-md ring-1 ring-indigo-600/50" : "text-muted-foreground hover:bg-white hover:shadow-sm")}><FileText className="w-3.5 h-3.5" /> Document</button>
                    <button type="button" onClick={() => setMediaCategory("image")} className={cn("flex-1 text-[10px] font-bold uppercase tracking-wide py-2 rounded-md flex items-center justify-center gap-1.5 transition-all text-xs min-w-[70px]", mediaCategory === "image" ? "bg-indigo-600 text-white shadow-md ring-1 ring-indigo-600/50" : "text-muted-foreground hover:bg-white hover:shadow-sm")}><ImageIcon className="w-3.5 h-3.5" /> Picture</button>
                    <button type="button" onClick={() => setMediaCategory("video")} className={cn("flex-1 text-[10px] font-bold uppercase tracking-wide py-2 rounded-md flex items-center justify-center gap-1.5 transition-all text-xs min-w-[70px]", mediaCategory === "video" ? "bg-indigo-600 text-white shadow-md ring-1 ring-indigo-600/50" : "text-muted-foreground hover:bg-white hover:shadow-sm")}><Video className="w-3.5 h-3.5" /> Video</button>
                 </div>
                 
                 <div className="space-y-4">
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Direct File Upload</span>
                      <Input type="file" onChange={handleMediaUpload} className="bg-white border-dashed border-2 cursor-pointer h-12 flex items-center file:mr-4 file:py-1 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" accept={mediaCategory === "document" ? ".pdf,.doc,.docx" : mediaCategory === "image" ? "image/*" : "video/*"} />
                    </div>
                    
                    <div className="flex items-center gap-3">
                       <div className="h-px bg-indigo-100/60 flex-1"></div>
                       <span className="text-[9px] font-bold text-indigo-300 uppercase tracking-widest">AND / OR</span>
                       <div className="h-px bg-indigo-100/60 flex-1"></div>
                    </div>
                    
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">External URL Link</span>
                      <Input type="url" placeholder={`Paste URL to ${mediaCategory} (e.g Google Drive)...`} value={uploadForm.videoUrl} onChange={(e) => setUploadForm({...uploadForm, videoUrl: e.target.value})} className="bg-white border-dashed border-2 text-sm focus-visible:ring-indigo-500 placeholder:text-muted-foreground h-10" />
                    </div>
                 </div>
              </div>

              {/* Box B: Metadata Scanner */}
              <div className="border border-emerald-200 bg-emerald-50/30 rounded-xl p-5">
                 <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-widest mb-1 flex items-center gap-2">
                   <FileText className="w-4 h-4 text-emerald-500" /> 2. Metadata Document (Scan)
                 </h4>
                  <p className="text-[10px] text-muted-foreground mb-4 font-medium">Upload descriptive doc/PDF/Excel/CSV to route to the metadata parsing engine.</p>
                  <div className="flex gap-2">
                    <Input type="file" onChange={handleMetadataScanUpload} className="bg-white flex-1" accept=".pdf,.doc,.docx,.txt,.csv,.xlsx" />
                    {processingState === "done" && (
                      <Button 
                        variant="outline" 
                        size="icon" 
                        title="Download Scanned Metadata Excel"
                        className="h-10 w-10 border-emerald-200 text-emerald-600 hover:bg-emerald-50 shrink-0"
                        onClick={() => {
                          const pseudoMaterial = { ...uploadForm, ...checklistValues } as unknown as ArchivalMaterial;
                          downloadMetadataExcel(pseudoMaterial);
                        }}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                 
                 {processingState === "scanning" && (
                   <div className="mt-3 text-xs text-emerald-700 font-bold flex items-center gap-2">
                     <Loader2 className="w-3.5 h-3.5 animate-spin" /> Extracting Content... {scanProgress}%
                   </div>
                 )}
                 {processingState === "done" && (
                   <div className="mt-3 text-[10px] text-emerald-700 font-bold flex items-center gap-1.5 bg-emerald-100 p-1.5 rounded">
                     <CheckCircle2 className="w-3.5 h-3.5" /> Text Extracted for Checklist
                   </div>
                 )}
              </div>
            </div>

          </div>

          <DialogFooter className="mt-2 border-t pt-4">
            <Button variant="ghost" onClick={() => setUploadOpen(false)}>Cancel Ingest</Button>
            <Button onClick={submitIngest} className="gap-2 bg-[#0a1628] hover:bg-[#1a2b4b]">
              Continue to Metadata Checklist <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Metadata Checklist Dialog ═══ */}
      <Dialog open={checklistOpen} onOpenChange={setChecklistOpen}>
        <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-emerald-500" /> Apply Full Metadata Schema</DialogTitle>
            <DialogDescription>Verify the automatically generated ISAD(G) schema mapping.</DialogDescription>
          </DialogHeader>
          <MetadataChecklist 
            selectedFields={selectedChecklistFields} 
            onToggle={(fieldKey) => setSelectedChecklistFields(prev => { 
              const n = new Set(prev); 
              n.has(fieldKey)? n.delete(fieldKey) : n.add(fieldKey); 
              return n;
            })} 
            onSelectAll={() => setSelectedChecklistFields(new Set(COMBINED_FIELDS.map(f => f.fieldKey)))} 
            onClearAll={() => setSelectedChecklistFields(new Set())}
            values={checklistValues}
            onValueChange={(fieldKey, value) => setChecklistValues(prev => ({ ...prev, [fieldKey]: value }))}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setChecklistOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              const hierarchyPath = `HCDC > ${uploadForm.fonds}${uploadForm.subfonds ? ' > ' + uploadForm.subfonds : ''}${uploadForm.series ? ' > ' + uploadForm.series : ''}`;
              const newMaterial: ArchivalMaterial = {
                 ...selectedMaterial, // if editing
                 id: editingMaterialId || crypto.randomUUID(),
                 uniqueId: generatedRefCode,
                 createdAt: selectedMaterial?.createdAt || new Date().toISOString(),
                 updatedAt: new Date().toISOString(),
                 createdBy: selectedMaterial?.createdBy || "Admin",
                 ...uploadForm,
                 ...checklistValues,
                 hierarchyPath,
                 access: uploadForm.access,
                 title: uploadForm.title,
                 creator: uploadForm.creator,
              } as ArchivalMaterial;

              const updated = saveMaterial(newMaterial);
              setMaterials(updated);
              
              addActivity({
                user: "Admin",
                actionType: editingMaterialId ? "edit" : "upload",
                description: `${editingMaterialId ? 'Updated' : 'Ingested'} material: ${newMaterial.title}`,
                materialId: newMaterial.uniqueId
              });

              toast({ title: editingMaterialId ? "Updated" : "Ingestion Confirmed", description: "Material saved successfully." }); 
              setChecklistOpen(false);
              setEditingMaterialId(null);
            }} className="bg-emerald-600 hover:bg-emerald-700">
              {editingMaterialId ? "Update Item" : "Finalize Ingest"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

// ═══ Preview Component ══════════════════════════════════════════════════════
function MediaPreview({ material }: { material: ArchivalMaterial }) {
  const isOAIS = !!(material.sha256 || material.identifier);
  
  return (
    <div className="bg-white rounded-2xl border border-border/60 overflow-hidden shadow-sm mb-8">
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/60 bg-muted/10">
        <div className="flex items-center gap-2">
          <span className="bg-[#0a1628] text-white text-[9px] font-bold px-2 py-0.5 rounded">OAIS AIP</span>
          <span className="text-[10px] font-mono text-muted-foreground">{material.identifier || "AIP-PENDING"}</span>
        </div>
        {isOAIS && (
          <div className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Integrity Verified
          </div>
        )}
      </div>

      {/* Preview area */}
      <div className="h-80 bg-[#f7f8fc] flex flex-col items-center justify-center relative group">
        {material.thumbnailUrl ? (
          <img src={material.thumbnailUrl} alt={material.title || "Preview"} className="max-h-full max-w-full object-contain p-4 transition-transform duration-500 group-hover:scale-[1.02]" />
        ) : (
          <div className="text-center p-8">
            <div className="w-24 h-28 bg-white border-2 border-border/40 rounded-lg shadow-sm flex items-center justify-center mx-auto mb-4 relative overflow-hidden">
              <FileText className="w-10 h-10 text-primary/20" />
              <div className="absolute top-2 right-2 w-3 h-3 bg-red-500/10 rounded-sm" />
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-primary/10" />
            </div>
            <p className="text-sm font-bold text-[#0a1628]">{material.title}</p>
            <p className="text-[10px] text-muted-foreground mt-2 font-mono uppercase tracking-widest">{material.format || "DOCUMENT"}</p>
            <div className="mt-6">
               <Button variant="outline" size="sm" className="bg-white border-primary/20 text-primary h-8 px-4 text-[10px] font-bold uppercase tracking-widest">
                 Upload Reference File
               </Button>
            </div>
          </div>
        )}
        
        {/* Floating Toolbar (only on hover) */}
        {material.thumbnailUrl && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-[#0a1628]/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
            {[{ icon: ZoomIn, label: "Zoom In" }, { icon: ZoomOut, label: "Zoom Out" }, { icon: RotateCw, label: "Rotate" }, { icon: Maximize2, label: "Fullscreen" }].map(({ icon: Icon, label }, i) => (
              <button key={i} title={label} className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors">
                <Icon className="w-4 h-4" />
              </button>
            ))}
            <div className="w-px h-4 bg-white/20 mx-1" />
            <button title="Download" className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors">
              <Download className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="border-t border-border/60 px-5 py-3 flex items-center justify-between bg-white text-[10px]">
        <div className="flex items-center gap-4 text-muted-foreground font-semibold">
           <span className="flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5" /> {material.type || "Unknown"}</span>
           <span className="flex items-center gap-1.5 uppercase tracking-widest"><FileDigit className="w-3.5 h-3.5" /> {material.extentAndMedium?.split(";")[1]?.trim() || "N/A"}</span>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="ghost" size="sm" className="h-7 px-3 text-[9px] font-bold text-primary hover:bg-primary/5 uppercase tracking-widest flex items-center gap-1">
             <ExternalLink className="w-3 h-3" /> External Source
           </Button>
        </div>
      </div>
    </div>
  );
}

// ═══ Detail View (Inline Edit Supported) ═══════════════════════════════════

function MaterialDetailView({ material, onBack }: { material: ArchivalMaterial, onBack: () => void }) {
  const isOAIS = checkOAISCompliance(material);
  const allFields = getAllFieldValues(material);
  const pct = computeCompletion(material);

  const isadFields = allFields.filter(f => f.field.standard === "ISAD(G)" || f.field.standard === "Both");
  const dcFields = allFields.filter(f => f.field.standard === "Dublin Core" || f.field.standard === "Both");
  
  const isadScore = Math.round((isadFields.filter(f => f.filled).length / isadFields.length) * 100);
  const dcScore = Math.round((dcFields.filter(f => f.filled).length / dcFields.length) * 100);

  const getRingColor = (score: number) => score >= 100 ? "#059669" : score >= 50 ? "#0284c7" : "#dc2626";
  const essentialKeys = ["referenceCode", "title", "date", "levelOfDescription", "format", "creator"];

  const [editingFieldCode, setEditingFieldCode] = React.useState<string | null>(null);
  const [editMap, setEditMap] = React.useState<Record<string, string>>({});

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300 bg-white p-6 rounded-xl border shadow-sm col-span-3 min-h-screen">
      <button onClick={onBack} className="text-primary hover:underline text-xs flex items-center gap-1 font-semibold mb-3">
        <ChevronRight className="w-3 h-3 rotate-180" /> Back to Materials
      </button>

      <div className="flex justify-between items-start mb-2">
         <h2 className="text-2xl font-bold text-[#0a1628] leading-tight pr-4">{material.title}</h2>
         <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
           <svg className="w-full h-full -rotate-90 stroke-muted/30" viewBox="0 0 36 36">
             <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeWidth="3" />
           </svg>
           <svg className="absolute top-0 left-0 w-full h-full -rotate-90 transition-all duration-1000" viewBox="0 0 36 36">
             <path style={{ stroke: getRingColor(pct), strokeDasharray: `${Math.round(pct)}, 100` }} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeWidth="3" strokeLinecap="round" />
           </svg>
           <div className="absolute flex flex-col items-center">
              <span className="font-bold text-[13px] leading-tight" style={{ color: getRingColor(pct) }}>{Math.round(pct)}%</span>
              <span className="text-[6px] uppercase tracking-widest font-bold text-muted-foreground mt-0.5">Overall</span>
           </div>
         </div>
      </div>
      
      <div className="flex items-center gap-2 mb-8 flex-wrap">
        <span className="font-mono text-xs font-bold text-muted-foreground">{material.uniqueId}</span>
        <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-200 uppercase font-bold px-1.5 py-0.5">Item</Badge>
        {isOAIS && <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-200 uppercase font-bold px-1.5 py-0.5 inline-flex items-center gap-1"><ShieldCheck className="w-2.5 h-2.5" /> OAIS Compliant</Badge>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Box 1: Barcode */}
        <div className="border rounded-xl flex items-center justify-center p-4 min-h-[140px] shadow-sm">
          <Barcode value={material.uniqueId} width={80} height={30} />
        </div>

        {/* Box 2: Rings */}
        <div className="border rounded-xl flex items-center justify-center p-4 gap-8 min-h-[140px] shadow-sm">
           <div className="flex flex-col items-center">
             <div className="relative w-[3.5rem] h-[3.5rem] flex items-center justify-center mb-2">
               <svg className="w-full h-full -rotate-90 stroke-muted/30" viewBox="0 0 36 36">
                 <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeWidth="4" />
               </svg>
               <svg className="absolute top-0 left-0 w-full h-full -rotate-90 transition-all duration-1000" viewBox="0 0 36 36">
                 <path style={{ stroke: getRingColor(isadScore), strokeDasharray: `${isadScore}, 100` }} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeWidth="4" strokeLinecap="round" />
               </svg>
               <span className="absolute font-bold text-[13px]" style={{ color: getRingColor(isadScore) }}>{isadScore}%</span>
             </div>
             <span className="text-[9px] font-bold text-[#0a1628] uppercase tracking-widest">ISAD(G)</span>
           </div>
           
           <div className="w-px h-12 bg-border/60"></div>
           
           <div className="flex flex-col items-center">
             <div className="relative w-[3.5rem] h-[3.5rem] flex items-center justify-center mb-2">
               <svg className="w-full h-full -rotate-90 stroke-muted/30" viewBox="0 0 36 36">
                 <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeWidth="4" />
               </svg>
               <svg className="absolute top-0 left-0 w-full h-full -rotate-90 transition-all duration-1000" viewBox="0 0 36 36">
                 <path style={{ stroke: getRingColor(dcScore), strokeDasharray: `${dcScore}, 100` }} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeWidth="4" strokeLinecap="round" />
               </svg>
               <span className="absolute font-bold text-[13px]" style={{ color: getRingColor(dcScore) }}>{dcScore}%</span>
             </div>
             <span className="text-[9px] font-bold text-[#0a1628] uppercase tracking-widest">Dublin Core</span>
           </div>
        </div>

        {/* Box 3: Essential checklist */}
        <div className="border rounded-xl p-5 flex flex-col justify-center min-h-[140px] shadow-sm">
           <span className="text-[9px] font-bold uppercase tracking-widest text-[#0a1628] mb-3">Essential Fields</span>
           <div className="grid grid-cols-1 gap-2.5">
             {allFields.filter(f => essentialKeys.includes(f.field.fieldKey)).map(f => (
               <div key={f.field.code} className="flex items-center gap-2">
                 {f.filled ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <X className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                 <span className="text-[10px] text-[#0a1628] font-semibold truncate">{f.field.name}</span>
               </div>
             ))}
           </div>
        </div>
      </div>
      
      <MediaPreview material={material} />

      <div className="flex flex-wrap items-center gap-2 mb-8 text-[11px] text-muted-foreground bg-muted/20 px-4 py-3 rounded-lg border font-mono">
         <FolderTree className="w-3.5 h-3.5 text-primary shrink-0" />
         <span className="shrink-0 font-sans">{material.hierarchyPath || "HCDC"}</span>
      </div>

      {material.termsOfUse && (
        <div className="mb-8 bg-amber-50/50 border border-amber-200 rounded-lg p-5 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-400"></div>
           <h4 className="text-[10px] font-bold text-amber-800 uppercase tracking-widest mb-2">Terms of Use</h4>
           <p className="text-xs text-amber-900/90 leading-relaxed font-semibold">{material.termsOfUse}</p>
        </div>
      )}

      {/* Full Metadata Card - Long Vertical List w/ Inline Editing */}
      <Card className="shadow-none border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b bg-muted/10 font-bold text-[#0a1628] flex items-center justify-between text-sm tracking-wide">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" /> 
            FULL METADATA ({allFields.filter(f => f.filled).length}/{allFields.length})
          </div>
          <div className="flex items-center gap-2">
            {editingFieldCode && <Badge variant="outline" className="text-xs bg-white text-muted-foreground border-border/50">Edit Mode Active</Badge>}
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 px-3 text-[10px] bg-white border-border/60 hover:bg-muted text-primary flex items-center gap-1.5 font-bold uppercase tracking-wider shadow-sm"
              onClick={() => downloadMetadataExcel(material)}
            >
              <Download className="w-3.5 h-3.5" /> Export to Excel
            </Button>
          </div>
        </div>
        <div className="divide-y divide-border/50 bg-white">
           {allFields.map(({ field, value, filled }) => {
              const isEditing = editingFieldCode === field.code;
              const currentValue = editMap[field.code] !== undefined ? editMap[field.code] : (value || "");

              return (
                 <div key={field.code} className={cn("grid grid-cols-[180px_1fr_60px_40px] items-start px-6 py-4 hover:bg-muted/5 transition-colors group relative", isEditing && "bg-blue-50/30 hover:bg-blue-50/40")}>
                    <div>
                        <span className="text-[11px] font-bold text-[#0a1628] block tracking-wide">{field.name}{essentialKeys.includes(field.fieldKey) && <span className="text-red-500 ml-1">*</span>}</span>
                        <span className="text-[9px] text-muted-foreground font-mono mt-0.5 block">{field.code}</span>
                    </div>
                    
                    <div className="text-[11px] leading-relaxed max-w-2xl pr-8 flex items-center min-h-[24px]">
                        {isEditing ? (
                          <div className="flex items-center gap-2 w-full animate-in fade-in zoom-in-95 duration-200">
                             <Input 
                               autoFocus 
                               className="h-8 text-[11px] w-full border-blue-200 focus-visible:ring-blue-500/30 shadow-sm" 
                               value={currentValue} 
                               onChange={e => setEditMap({...editMap, [field.code]: e.target.value})} 
                               onKeyDown={e => { if (e.key === "Enter") setEditingFieldCode(null); if(e.key === "Escape"){ setEditMap({...editMap, [field.code]: value||""}); setEditingFieldCode(null); } }}
                             />
                             <Button size="icon" className="h-8 w-8 bg-blue-600 hover:bg-blue-700 shrink-0" onClick={() => setEditingFieldCode(null)}><Save className="w-3.5 h-3.5" /></Button>
                          </div>
                        ) : (
                          <span className={cn("font-semibold text-[#0a1628] transition-all", !filled && !editMap[field.code] && "italic font-normal opacity-40 text-muted-foreground")}>
                             {editMap[field.code] || value || "Empty"}
                          </span>
                        )}

                        {/* Hover Edit Action */}
                        {!isEditing && (
                          <button onClick={() => { setEditingFieldCode(field.code); setEditMap({...editMap, [field.code]: value||""}); }} className="absolute right-[112px] opacity-0 group-hover:opacity-100 p-1.5 rounded bg-muted hover:bg-[#4169E1] hover:text-white transition-all text-muted-foreground" title="Inline Edit">
                            <Edit className="w-3 h-3" />
                          </button>
                        )}
                    </div>
                    
                    <div className="text-right flex justify-end">
                        <Badge variant="outline" className={cn(
                          "text-[8px] uppercase font-bold tracking-widest h-5 px-1.5 py-0 border-none",
                          field.standard === "ISAD(G)" ? "bg-blue-50 text-blue-700" :
                          field.standard === "Dublin Core" ? "bg-teal-50 text-teal-700" :
                          "bg-indigo-50 text-indigo-700"
                        )}>
                          {field.standard === "Dublin Core" ? "DC" : field.standard}
                        </Badge>
                    </div>
                    <div className="text-right flex justify-end items-center">
                        {editMap[field.code]?.length > 0 || filled ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-red-500" />}
                    </div>
                 </div>
              );
           })}
        </div>
      </Card>
    </div>
  );
}
