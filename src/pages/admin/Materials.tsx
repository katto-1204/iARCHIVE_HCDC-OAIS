import * as React from "react";
import { AdminLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Input } from "@/components/ui-components";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn, compressFile, fileToBase64 } from "@/lib/utils";
import {
  Search, Plus, Edit, ExternalLink, Layers, Settings2, Download,
  Upload, FolderTree, ShieldCheck, CheckCircle2, FileText, Folder,
  ZoomIn, ZoomOut, RotateCw, Maximize2, AlertTriangle, ChevronRight, X, Save, FolderOpen, ChevronLeft, Lock,
  CheckCircle, Loader2, Image as ImageIcon, Video, FileDigit, BarChart3
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ArchivalTree } from "@/components/ArchivalTree";
import { MetadataChecklist } from "@/components/MetadataChecklist";
import { Barcode } from "@/components/Barcode";
import { CompletionRing } from "@/components/CompletionRing";
import {
  SAMPLE_HIERARCHY, COMBINED_FIELDS, LEVEL_LABELS,
  type ArchivalMaterial, type HierarchyNode, type HierarchyLevel
} from "@/data/sampleData";
import {
  deleteMaterial, addActivity, addIngestRequest, updateIngestRequest
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
  getAllFieldValues, downloadMetadataExcel, computeAreaBreakdown, getCompletionCategory
} from "@/data/metadataUtils";
import { useToast } from "@/hooks/use-toast";
import { useGetMe, useGetCategories, useCreateCategory, useCreateMaterial, useUpdateMaterial, useDeleteMaterial, useGetMaterials as useGetMaterialsApi, useSubmitIngestRequest, useUploadMaterialPage, useUploadMaterialFileChunk } from "@workspace/api-client-react";

type ViewMode = "table" | "detail";

const hierarchyLevels: HierarchyLevel[] = ["subfonds", "series", "subseries", "file"];

const slugify = (value: string | null | undefined) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const normalizeCategoryLevel = (level?: string | null) => {
  const normalized = String(level || "").toLowerCase().replace(/[\s_-]/g, "");
  if (normalized === "fonds") return "fonds";
  if (normalized === "subfonds" || normalized === "department") return "subfonds";
  if (normalized === "series") return "series";
  if (normalized === "subseries") return "subseries";
  if (normalized === "file") return "file";
  if (normalized === "item") return "item";
  return normalized;
};

const REQUIRED_SUBFONDS = ["CET", "CHATME", "STE", "SBME", "COME", "CCJE", "HUSOCOM", "CSCAA"] as const;
const SUBFOND_DISPLAY: Record<string, string> = {
  CET: "College of Engineering and Technology (CET)",
  CHATME: "College of Hospitality & Tourism Management (CHATME)",
  STE: "School of Teacher Education (STE)",
  SBME: "School of Business & Management (SBME)",
  COME: "College of Maritime Education (COME)",
  CCJE: "College of Criminal Justice Education (CCJE)",
  HUSOCOM: "College of Arts & Sciences (HUSOCOM)",
  CSCAA: "Center for Social Communication and Alumni Affairs (CSCAA)",
};
const PROGRAMS_BY_SUBFOND: Record<string, string[]> = {
  CET: [
    "Bachelor of Science in Computer Engineering (BSCpE)",
    "Bachelor of Science in Electronics Engineering (BSECE)",
    "Bachelor of Science in Information Technology (BSIT)",
    "Bachelor of Library and Information Science (BLIS)"
  ],
  CHATME: [
    "Bachelor of Science in Hospitality Management (BSHM)",
    "Bachelor of Science in Tourism Management (BSTM)"
  ],
  STE: [
    "Bachelor of Early Childhood Education (BECEd)",
    "Bachelor of Elementary Education (BEEd)",
    "Bachelor of Physical Education (BPEd)",
    "Bachelor of Secondary Education (BSEd)",
    "Bachelor of Special Needs Education (BSNEd)"
  ],
  SBME: [
    "Bachelor of Science in Accountancy (BSA)",
    "Bachelor of Science in Business Administration major in Financial Management (BSBA-FM)",
    "Bachelor of Science in Business Administration major in Human Resource Management (BSBA-HRM)",
    "Bachelor of Science in Business Administration major in Marketing Management (BSBA-MM)",
    "Bachelor of Science in Customs Administration (BSCA)",
    "Bachelor of Science in Management Accounting (BSMA)",
    "Bachelor of Science in Real Estate Management (BSREM)"
  ],
  COME: ["Bachelor of Science in Marine Transportation (BSMT)"],
  CCJE: ["Bachelor of Science in Criminology (BS Criminology)"],
  HUSOCOM: [
    "Bachelor of Arts in Political Science (AB PolSci)",
    "Bachelor of Arts in Economics (AB Econ)",
    "Bachelor of Arts in History (AB History)",
    "Bachelor of Arts in Philosophy (AB Philosophy)",
    "Bachelor of Arts in Communication (BA Comm)",
    "Bachelor of Arts in English Language Studies (BA ELS)",
    "Bachelor of Science in Psychology (BS Psych)",
    "Bachelor of Science in Social Work (BSSW)"
  ],
  CSCAA: [
    "HCDC Social Media Video Collection",
    "Yearbooks",
    "HCDC Social Media Photo Collection",
  ],
};

const extractDepartmentCode = (name?: string | null) => {
  const text = String(name || "");
  const m = text.match(/\(([A-Z]{2,})\)/);
  if (m?.[1]) return m[1];
  const upper = text.toUpperCase();
  if (upper.includes("COLLEGE OF ENGINEERING")) return "CET";
  if (upper.includes("HOSPITALITY") || upper.includes("TOURISM")) return "CHATME";
  if (upper.includes("TEACHER EDUCATION")) return "STE";
  if (upper.includes("BUSINESS") || upper.includes("MANAGEMENT")) return "SBME";
  if (upper.includes("MARITIME")) return "COME";
  if (upper.includes("CRIMINAL JUSTICE")) return "CCJE";
  if (upper.includes("ARTS") || upper.includes("HUSOCOM")) return "HUSOCOM";
  if (upper.includes("CSCAA")) return "CSCAA";
  if (upper.includes("CSAA")) return "CSCAA";
  return "";
};

const hasMetadataValue = (value: unknown) =>
  value !== undefined && value !== null && String(value).trim() !== "";

const deriveSelectedFieldsFromValues = (values: Record<string, any>, allowedFieldIds?: string[]) => {
  const allowed = allowedFieldIds ? new Set(allowedFieldIds) : null;
  const selectableKeys = COMBINED_FIELDS.map((f) => f.fieldKey);
  return new Set(
    selectableKeys.filter((key) => hasMetadataValue(values[key]) && (!allowed || allowed.has(key)))
  );
};

const buildHierarchyWithMaterials = (base: HierarchyNode, mats: ArchivalMaterial[]): HierarchyNode => {
  const root: HierarchyNode = JSON.parse(JSON.stringify(base));

  const ensureChild = (parent: HierarchyNode, name: string, level: HierarchyLevel) => {
    parent.children = parent.children || [];
    let child = parent.children.find((c) => c.name.toLowerCase() === name.toLowerCase() && c.level === level);
    if (!child) {
      child = {
        id: `${parent.id}-${slugify(name)}-${level}`,
        name,
        level,
        children: [],
      } as HierarchyNode;
      parent.children.push(child);
    }
    return child;
  };

  const addItem = (parent: HierarchyNode, material: ArchivalMaterial) => {
    parent.children = parent.children || [];
    const itemKey = material.uniqueId || material.id;
    const exists = parent.children.some((c) => c.level === "item" && c.materialId === itemKey);
    if (!exists) {
      parent.children.push({
        id: `item-${material.id}`,
        name: material.title || material.uniqueId || "Untitled Material",
        level: "item",
        materialId: itemKey,
      });
    }
  };

  mats.forEach((material) => {
    const path = (material.hierarchyPath || "").split(">").map((p) => p.trim()).filter(Boolean);
    const parts = path[0]?.startsWith("HCDC") ? path.slice(1) : path;
    let current = root;

    parts.forEach((segment, index) => {
      const level = hierarchyLevels[index] || "file";
      current = ensureChild(current, segment, level);
    });

    addItem(current, material);
  });

  return root;
};

export default function AdminMaterials() {
  const [search, setSearch] = React.useState("");
  const [selectedHierarchyItem, setSelectedHierarchyItem] = React.useState<string | null>(null);
  const [materials, setMaterials] = React.useState<ArchivalMaterial[]>([]);
  const [materialsLoading, setMaterialsLoading] = React.useState(true);
  const { data: me } = useGetMe();

  // Real Category Data
  const { data: categories = [] } = useGetCategories();
  const [activeSchema, setActiveSchema] = React.useState<string[] | undefined>(undefined);

  const fallbackRole = typeof window !== "undefined" && window.location.pathname.startsWith("/archivist") ? "archivist" : "admin";
  const currentRole = (me?.role || fallbackRole) as "admin" | "archivist";
  const isAdmin = currentRole === "admin";
  const approvalStatusFor = (material: ArchivalMaterial) => material.approvalStatus || "approved";
  const [approvalFilter, setApprovalFilter] = React.useState<"all" | "approved" | "pending" | "rejected">("all");
  const [dateSort, setDateSort] = React.useState<"newest" | "oldest" | "none">("newest");
  const [folderSummaryOpen, setFolderSummaryOpen] = React.useState(false);
  const [folderSummaryData, setFolderSummaryData] = React.useState<{ count: number, names: string[] }>({ count: 0, names: [] });
  const [showHierarchy, setShowHierarchy] = React.useState(false);
  const [expandedHierarchyPaths, setExpandedHierarchyPaths] = React.useState<string[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 8;
  const approvalCounts = React.useMemo(() => {
    const counts = { all: materials.length, approved: 0, pending: 0, rejected: 0 };
    materials.forEach((mat) => {
      const status = approvalStatusFor(mat);
      if (status === "approved") counts.approved += 1;
      if (status === "pending") counts.pending += 1;
      if (status === "rejected") counts.rejected += 1;
    });
    return counts;
  }, [materials]);

  const { data: apiMaterialsData, isLoading: apiMaterialsLoading, refetch: refetchMaterials } = useGetMaterialsApi({ limit: 1000 });
  const createMaterialMutation = useCreateMaterial();
  const updateMaterialMutation = useUpdateMaterial();
  const deleteMaterialMutation = useDeleteMaterial();
  const uploadPageMutation = useUploadMaterialPage();
  const uploadFileChunkMutation = useUploadMaterialFileChunk();
  const submitIngestMutation = useSubmitIngestRequest();

  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedHierarchyItem, approvalFilter]);

  React.useEffect(() => {
    if (apiMaterialsData?.materials) {
      setMaterials(apiMaterialsData.materials);
      setMaterialsLoading(false);
    } else {
      setMaterials([]);
      setMaterialsLoading(apiMaterialsLoading);
    }
  }, [apiMaterialsData, apiMaterialsLoading]);

  React.useEffect(() => {
    const sync = () => {
      refetchMaterials();
    };
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
    };
  }, [apiMaterialsData, refetchMaterials]);

  // Material detail expansion
  const [selectedMaterial, setSelectedMaterial] = React.useState<ArchivalMaterial | null>(null);
  const [editingMaterialId, setEditingMaterialId] = React.useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [materialToDelete, setMaterialToDelete] = React.useState<string | null>(null);

  // Upload dialog state
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [accessControlOpen, setAccessControlOpen] = React.useState(false);
  const [rawExtractionText, setRawExtractionText] = React.useState("");
  const [pdfPreviewImages, setPdfPreviewImages] = React.useState<string[]>([]);
  const [pdfPreviewBlobs, setPdfPreviewBlobs] = React.useState<Blob[]>([]);
  const [selectionTarget, setSelectionTarget] = React.useState<{ text: string, x: number, y: number } | null>(null);

  // Storage for separated processing
  const [mainMaterialText, setMainMaterialText] = React.useState("");
  const [mainFileName, setMainFileName] = React.useState("");
  const [metadataFileName, setMetadataFileName] = React.useState("");

  const [checklistOpen, setChecklistOpen] = React.useState(false);
  const [checklistMode, setChecklistMode] = React.useState<"select" | "fill">("select");
  const [selectedChecklistFields, setSelectedChecklistFields] = React.useState<Set<string>>(new Set());
  const [checklistValues, setChecklistValues] = React.useState<Record<string, string>>({});
  const [successDialogOpen, setSuccessDialogOpen] = React.useState(false);
  const [lastIngestedId, setLastIngestedId] = React.useState<string | null>(null);
  const [ingestBusy, setIngestBusy] = React.useState(false);
  const [ingestStage, setIngestStage] = React.useState("Preparing ingest payload...");
  const [customSubfonds, setCustomSubfonds] = React.useState<string[]>([]);
  const [newSubfonds, setNewSubfonds] = React.useState("");

  const { mutateAsync: createMaterial, isPending: isCreating } = useCreateMaterial();
  const { mutateAsync: createCategory } = useCreateCategory();
  const { mutateAsync: updateMaterial, isPending: isUpdating } = useUpdateMaterial();
  const { mutateAsync: submitIngestRequest } = useSubmitIngestRequest();

  // Dynamic Upload Form
  const [mediaCategory, setMediaCategory] = React.useState<"document" | "image" | "video">("document");
  const [videoInputType, setVideoInputType] = React.useState<"file" | "url">("file");

  const [uploadForm, setUploadForm] = React.useState({
    title: "", creator: "", dateOfDescription: "", format: "", description: "",
    levelOfDescription: "Item", extentAndMedium: "", access: "public" as "public" | "restricted" | "confidential",
    videoUrl: "", hierarchyPath: "", termsOfUse: "", referenceCode: "",
    fileData: undefined as undefined | Blob,
    fileType: "",

    // Auto Reference Code Gen fields
    year: "26", catNo: "01", matNo: "AUTO",

    // Cascade Selection
    fonds: "",
    subfonds: "",
    program: "",
    series: ""
  });

  const generatedRefCode = (!uploadForm.matNo || uploadForm.matNo === "AUTO") ? "" : `${uploadForm.year}iA${uploadForm.catNo}${uploadForm.matNo}`;

  // ══ Feature 1: Auto-sync uploadForm → checklistValues ══
  // When the user types title, creator, etc. in the ingestion form,
  // those values auto-propagate into the checklist so they appear as ✅
  React.useEffect(() => {
    setChecklistValues(prev => {
      const next = { ...prev };
      if (uploadForm.title !== undefined && uploadForm.title !== prev.title) next.title = uploadForm.title;
      if (uploadForm.creator !== undefined && uploadForm.creator !== prev.creator) next.creator = uploadForm.creator;
      if (uploadForm.description !== undefined && uploadForm.description !== prev.description) next.description = uploadForm.description;
      if (uploadForm.format !== undefined && uploadForm.format !== prev.format) next.format = uploadForm.format;
      if (uploadForm.dateOfDescription !== undefined && uploadForm.dateOfDescription !== prev.dateOfDescription) next.dateOfDescription = uploadForm.dateOfDescription;
      if (uploadForm.levelOfDescription !== undefined && uploadForm.levelOfDescription !== prev.levelOfDescription) next.levelOfDescription = uploadForm.levelOfDescription;
      if (uploadForm.extentAndMedium !== undefined && uploadForm.extentAndMedium !== prev.extentAndMedium) next.extentAndMedium = uploadForm.extentAndMedium;
      if (uploadForm.access !== undefined) {
        const expectedAccess = uploadForm.access === 'public' ? 'Public access; no restrictions.' : uploadForm.access === 'restricted' ? 'Restricted access; authorization required.' : 'Confidential; board authorization required.';
        if (expectedAccess !== prev.accessConditions) next.accessConditions = expectedAccess;
      }
      if (uploadForm.termsOfUse !== undefined && uploadForm.termsOfUse !== prev.termsOfUse) next.termsOfUse = uploadForm.termsOfUse;
      if (generatedRefCode && generatedRefCode !== prev.referenceCode) next.referenceCode = generatedRefCode;

      // Sync hierarchy-derived fields (Optional: could map to source/context if desired)
      if (uploadForm.subfonds !== undefined) {
        const hierarchyPath = `HCDC > Departmental Sub-fonds > ${uploadForm.subfonds}${uploadForm.series ? ' > ' + uploadForm.series : ''}`;
        next.hierarchyPath = hierarchyPath;
      }
      return next;
    });
  }, [
    uploadForm.title, uploadForm.creator, uploadForm.description,
    uploadForm.format, uploadForm.dateOfDescription, uploadForm.levelOfDescription,
    uploadForm.extentAndMedium, uploadForm.access, uploadForm.termsOfUse,
    uploadForm.referenceCode, uploadForm.fonds, uploadForm.subfonds, uploadForm.program, uploadForm.series,
    generatedRefCode
  ]);

  // Sync activeSchema when series changes
  React.useEffect(() => {
    if (uploadForm.series && categories.length > 0) {
      const seriesNode = categories.find(c => c.name === uploadForm.series);
      if (seriesNode?.metadataSchema?.fieldIds) {
        setActiveSchema(seriesNode.metadataSchema.fieldIds);
        // Also auto-select these fields for the checklist
        setSelectedChecklistFields(new Set(seriesNode.metadataSchema.fieldIds));
      } else {
        setActiveSchema(undefined);
      }
    } else {
      setActiveSchema(undefined);
    }
  }, [uploadForm.series, categories]);


  const [processingState, setProcessingState] = React.useState<"idle" | "scanning" | "compressing" | "done">("idle");
  const [metadataProcessingState, setMetadataProcessingState] = React.useState<"idle" | "scanning" | "done">("idle");
  const [scanProgress, setScanProgress] = React.useState(0);
  const [fileDetails, setFileDetails] = React.useState<{ name: string; ogSize: number; newSize: number } | null>(null);
  const [needsManualInput, setNeedsManualInput] = React.useState(true); // Default show for new modal layout
  const [validationErrors, setValidationErrors] = React.useState<string[]>([]);
  const [showExtractedText, setShowExtractedText] = React.useState(true);

  // ══ Feature: Auto-increment Material Number ══
  React.useEffect(() => {
    if (materials.length > 0) {
      const matNumbers = materials.map(m => {
        // Look for the last numeric sequence (7 digits) in the uniqueId/materialId
        const idToScan = m.uniqueId || m.materialId || "";
        const match = idToScan.match(/\d{7}$/);
        return match ? parseInt(match[0], 10) : 0;
      });
      const maxNo = Math.max(...matNumbers, 0);
      const nextNum = maxNo + 1;
      const formattedNum = String(nextNum).padStart(7, '0');
      setUploadForm(prev => ({ ...prev, matNo: formattedNum }));
    } else {
      // Start at 0000001 if empty
      setUploadForm(prev => ({ ...prev, matNo: "0000001" }));
    }
  }, [materials.length, uploadForm.catNo]); // Also recalc if category changes? Maybe not.

  const movePdfImage = (idx: number, dir: 'left' | 'right') => {
    setPdfPreviewImages(prev => {
      const newArr = [...prev];
      const targetIdx = dir === 'left' ? idx - 1 : idx + 1;
      if (targetIdx >= 0 && targetIdx < newArr.length) {
        [newArr[idx], newArr[targetIdx]] = [newArr[targetIdx], newArr[idx]];
      }
      return newArr;
    });
  };

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

  const createObjectUrl = (blob: Blob) => URL.createObjectURL(blob);

  const compressImageToBlob = async (file: File, maxWidth: number, quality: number) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    await new Promise((resolve) => (img.onload = resolve));
    const canvas = document.createElement("canvas");
    let w = img.width;
    let h = img.height;
    if (w > maxWidth) {
      h *= maxWidth / w;
      w = maxWidth;
    }
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");
    ctx.drawImage(img, 0, 0, w, h);
    const blob: Blob = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b as Blob), "image/jpeg", quality);
    });
    return blob;
  };

  const extractMainFile = async (file: File) => {
    const isPdf = file.type === "application/pdf";
    const isDocx = file.name.toLowerCase().endsWith(".docx");
    const isImage = file.type.startsWith("image/");

    setProcessingState("scanning");
    setScanProgress(0);
    setMainFileName(file.name);

    let extractedText = "";
    let detectedPageCount = 0;
    let extractedImages: string[] = [];
    let extractedImageBlobs: Blob[] = [];

    try {
      if (isPdf && window.pdfjsLib) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        detectedPageCount = pdf.numPages;

        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          fullText += textContent.items.map((item: any) => item.str).join(" ") + "\n\n";

          if (i <= 50) { // Increased limit to 50 pages for better coverage
            try {
              const viewport = page.getViewport({ scale: 1.0 });
              const canvas = document.createElement('canvas');
              const context = canvas.getContext('2d');
              if (context) {
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                await page.render({ canvasContext: context, viewport: viewport }).promise;
                const blob: Blob = await new Promise((resolve) => {
                  canvas.toBlob((b) => resolve(b as Blob), "image/jpeg", 0.45);
                });
                extractedImageBlobs.push(blob);
                extractedImages.push(createObjectUrl(blob));
              }
            } catch (e) { console.error("Canvas render fail on page", i, e) }
          }
          setScanProgress(Math.round((i / pdf.numPages) * 100));
        }
        extractedText = fullText;
      } else if (isImage) {
        const blob = await compressImageToBlob(file, 1200, 0.5);
        extractedImageBlobs = [blob];
        extractedImages = [createObjectUrl(blob)];
        detectedPageCount = 1;
        setScanProgress(100);
      } else if (isDocx && window.mammoth) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await window.mammoth.extractRawText({ arrayBuffer });
        extractedText = result.value;
      }

      setPdfPreviewImages(extractedImages.length > 0 ? extractedImages : pdfPreviewImages);
      setPdfPreviewBlobs(extractedImageBlobs.length > 0 ? extractedImageBlobs : pdfPreviewBlobs);
      setMainMaterialText(extractedText);

      // Always set rawExtractionText to the document content when scanning the main file
      // This ensures users see the document's actual content
      if (extractedText) {
        setRawExtractionText("═══ Scanned from Document: " + file.name + " ═══\n\n" + extractedText);
      }

      const fileExt = file.name.split('.').pop()?.toUpperCase() || "FILE";
      const baseName = file.name.replace(/\.[^/.]+$/, "");
      const sizeStr = (file.size / 1024 / 1024).toFixed(2) + " MB";
      const fileDate = file.lastModified ? new Date(file.lastModified).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      const previewSnippet = extractedText ? extractedText.substring(0, 150).trim() : "";

      // ** AUTO-METADATA EXTRACTION FROM FILE PROPERTIES ** //
      setChecklistValues(prev => ({
        ...prev,
        title: prev.title || baseName,
        date: prev.date || fileDate,
        dateOfDescription: prev.dateOfDescription || fileDate,
        format: prev.format || file.type || fileExt,
        extentAndMedium: prev.extentAndMedium || `${sizeStr} Digital ${fileExt}`,
        description: prev.description || previewSnippet
      }));

      setSelectedChecklistFields(prev => {
        const n = new Set(prev);
        n.add('title');
        n.add('date');
        n.add('dateOfDescription');
        n.add('format');
        n.add('extentAndMedium');
        if (previewSnippet) n.add('description');
        return n;
      });

      if (!uploadForm.title && !metadataFileName) {
        let inferredAccess: "public" | "restricted" | "confidential" = uploadForm.access;
        const lowerClean = extractedText.toLowerCase();
        if (lowerClean.includes('confidential') || lowerClean.includes('classified')) inferredAccess = 'confidential';
        else if (lowerClean.includes('restricted') || lowerClean.includes('authorized personnel')) inferredAccess = 'restricted';

        setUploadForm((prev: any) => ({
          ...prev,
          title: prev.title || baseName,
          format: prev.format || file.type || "application/octet-stream",
          description: prev.description || previewSnippet,
          access: inferredAccess,
          pageImages: extractedImages.length > 0 ? extractedImages : prev.pageImages,
          pages: detectedPageCount || prev.pages || 1
        }));
      } else {
        setUploadForm((prev: any) => ({
          ...prev,
          pageImages: extractedImages.length > 0 ? extractedImages : prev.pageImages,
          pages: detectedPageCount || prev.pages || 1
        }));
      }
    } catch (err) {
      console.error("Extraction failed", err);
    }

    setProcessingState("done");
  };

  const extractMetadataFile = async (file: File) => {
    const isDocx = file.name.toLowerCase().endsWith(".docx");
    const isCsv = file.name.toLowerCase().endsWith(".csv");
    const isXlsx = file.name.toLowerCase().endsWith(".xlsx");
    const isPdf = file.name.toLowerCase().endsWith(".pdf");
    const isTxt = file.name.toLowerCase().endsWith(".txt");

    setMetadataProcessingState("scanning");
    setMetadataFileName(file.name);

    let extractedText = "";

    try {
      if (isPdf && window.pdfjsLib) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          fullText += textContent.items.map((item: any) => item.str).join(" ") + "\n\n";
        }
        extractedText = fullText;
      } else if (isDocx && window.mammoth) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await window.mammoth.extractRawText({ arrayBuffer });
        extractedText = result.value;
      } else if (isCsv || isTxt) {
        extractedText = await file.text();
      } else if (isXlsx && window.XLSX) {
        const arrayBuffer = await file.arrayBuffer();
        const wb = window.XLSX.read(arrayBuffer);
        const ws = wb.Sheets[wb.SheetNames[0]];
        extractedText = window.XLSX.utils.sheet_to_txt(ws, { sep: " " });

        // Advanced XLSX Extraction for Auto-filling Fields
        const jsonData = window.XLSX.utils.sheet_to_json(ws);
        if (jsonData && jsonData.length > 0) {
          const firstRow: any = jsonData[0];
          const lowerMap: any = {};
          Object.keys(firstRow).forEach(k => lowerMap[k.toLowerCase()] = String(firstRow[k]));

          const newTitle = lowerMap.title || lowerMap.name || lowerMap.subject || "";
          const newCreator = lowerMap.creator || lowerMap.author || lowerMap.institution || lowerMap.publisher || "";
          const newDesc = lowerMap.description || lowerMap.summary || lowerMap.abstract || "";
          const newDate = lowerMap.date || lowerMap.year || lowerMap["date of description"] || "";

          setUploadForm((prev: any) => ({
            ...prev,
            title: newTitle || prev.title,
            creator: newCreator || prev.creator,
            description: newDesc || prev.description,
            dateOfDescription: newDate || prev.dateOfDescription
          }));
          setChecklistValues((prev: any) => ({
            ...prev,
            title: newTitle || prev.title,
            creator: newCreator || prev.creator,
            description: newDesc || prev.description,
          }));
          setSelectedChecklistFields(prev => {
            const n = new Set(prev);
            if (newTitle) n.add('title');
            if (newCreator) n.add('creator');
            if (newDesc) n.add('description');
            return n;
          });
        }
      }

      // When metadata file is uploaded, replace the extraction text with metadata content
      if (extractedText.trim()) {
        setRawExtractionText("═══ Extracted from Metadata File: " + file.name + " ═══\n\n" + extractedText);
      } else {
        // Metadata file had no extractable text — keep existing document scan
        setRawExtractionText(prev => prev || ("═══ Metadata File: " + file.name + " (no extractable text) ═══"));
      }

      const previewSnippet = extractedText.substring(0, 150).trim();
      setChecklistValues(prev => ({
        ...prev,
        description: prev.description || previewSnippet,
        dateOfDescription: prev.dateOfDescription || new Date().toISOString().split('T')[0],
      }));
      setSelectedChecklistFields(prev => {
        const n = new Set(prev);
        if (previewSnippet) n.add('description');
        n.add('dateOfDescription');
        return n;
      });
    } catch (err) {
      console.error("Metadata extraction failed", err);
    }

    setMetadataProcessingState("done");
  };

  const handleMediaUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedChecklistFields(new Set());

    const ogSize = file.size;
    let fileToProcess = file as File | Blob;

    setProcessingState("compressing");
    fileToProcess = await compressFile(file, 1);

    if (fileToProcess.type.startsWith("image/")) {
      setUploadForm(prev => ({ ...prev, fileData: fileToProcess as Blob, fileType: fileToProcess.type }));
    } else {
      setUploadForm(prev => ({ ...prev, fileData: fileToProcess as Blob, fileType: fileToProcess.type }));
    }

    const newSize = fileToProcess.size;
    setFileDetails({ name: file.name, ogSize, newSize });

    await extractMainFile(file);
  };

  const handleMetadataScanUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    setSelectedChecklistFields(new Set());

    // Defer heavy processing to next frame to avoid INP blocking
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

    if (files.length > 1) {
      setProcessingState("scanning");
      setMetadataProcessingState("scanning");
      const allFiles = Array.from(files);

      // Separate files by type:
      // - Document files (PDF, DOCX, DOC) → treat FIRST as main material
      // - Image files → page previews / main material
      // - Metadata files (CSV, XLSX, TXT) → metadata extraction
      const docExtensions = ['.pdf', '.doc', '.docx'];
      const metaExtensions = ['.csv', '.xlsx', '.xls', '.txt'];
      const imageFiles = allFiles
        .filter(f => f.type.startsWith('image/'))
        .sort((a, b) => a.name.localeCompare(b.name));
      const documentFiles = allFiles
        .filter(f => {
          const ext = f.name.toLowerCase().substring(f.name.lastIndexOf('.'));
          return docExtensions.includes(ext) && !f.type.startsWith('image/');
        })
        .sort((a, b) => a.name.localeCompare(b.name));
      const metadataFiles = allFiles
        .filter(f => {
          const ext = f.name.toLowerCase().substring(f.name.lastIndexOf('.'));
          return metaExtensions.includes(ext) && !f.type.startsWith('image/');
        });

      // Process images for preview
      let images: string[] = [];
      let imageBlobs: Blob[] = [];
      for (let i = 0; i < imageFiles.length; i++) {
        const blob = await compressImageToBlob(imageFiles[i], 1200, 0.5);
        imageBlobs.push(blob);
        images.push(createObjectUrl(blob));
      }

      // Process first document file as the MAIN material
      if (documentFiles.length > 0) {
        const rawMainDoc = documentFiles[0];
        const mainDoc = await compressFile(rawMainDoc, 0.6); // Compress for Firestore Base64 limit
        setUploadForm(prev => ({ ...prev, fileData: mainDoc, fileType: (mainDoc as any).type || rawMainDoc.type }));
        setFileDetails({ name: rawMainDoc.name, ogSize: rawMainDoc.size, newSize: mainDoc.size });
        await extractMainFile(mainDoc as File);

        // Any additional document files → extract as supplementary metadata
        for (let i = 1; i < documentFiles.length; i++) {
          await extractMetadataFile(documentFiles[i]);
        }
      } else if (images.length > 0) {
        // No document files — images ARE the main material
        setPdfPreviewImages(images);
        setPdfPreviewBlobs(imageBlobs);
        setUploadForm(prev => ({
          ...prev,
          pages: images.length,
          pageImages: images,
          fileData: imageBlobs[0] || prev.fileData,
          fileType: "image/jpeg"
        }));
        setProcessingState("done");

        // Auto-fill from first image file properties
        const firstImg = imageFiles[0];
        const baseName = firstImg.name.replace(/\.[^/.]+$/, "");
        const sizeStr = (firstImg.size / 1024 / 1024).toFixed(2) + " MB";
        const fileDate = firstImg.lastModified ? new Date(firstImg.lastModified).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        setUploadForm(prev => ({
          ...prev,
          title: prev.title || baseName,
          format: prev.format || firstImg.type || "image/jpeg",
        }));
        setChecklistValues(prev => ({
          ...prev,
          title: prev.title || baseName,
          date: prev.date || fileDate,
          format: prev.format || firstImg.type,
          extentAndMedium: prev.extentAndMedium || `${images.length} image(s), ${sizeStr}`,
        }));
        setMainFileName(firstImg.name);
        setRawExtractionText(`═══ Scanned ${images.length} Image(s) from Folder ═══\n\nImages loaded as page previews. No extractable text from images.`);
      }

      // Process metadata-specific files (CSV, XLSX, TXT)
      for (const mf of metadataFiles) {
        await extractMetadataFile(mf);
      }

      // Show folder summary modal
      setFolderSummaryData({
        count: allFiles.length,
        names: allFiles.slice(0, 20).map(f => f.name)
      });
      setFolderSummaryOpen(true);

      setMetadataProcessingState("done");
      return;
    }

    // Single file uploaded via folder selector — determine if it's a document or metadata
    const singleFile = files[0];
    const ext = singleFile.name.toLowerCase().substring(singleFile.name.lastIndexOf('.'));
    const isDoc = ['.pdf', '.doc', '.docx'].includes(ext);
    const isImg = singleFile.type.startsWith('image/');

    if (isDoc || isImg) {
      // Single document/image → treat as main material and scan its content
      if (isImg) {
        const blob = await compressImageToBlob(singleFile, 1200, 0.5);
        setUploadForm(prev => ({ ...prev, fileData: blob, fileType: blob.type || singleFile.type }));
      } else {
        setUploadForm(prev => ({ ...prev, fileData: singleFile, fileType: singleFile.type }));
      }
      setFileDetails({ name: singleFile.name, ogSize: singleFile.size, newSize: Math.floor(singleFile.size * 0.1) });
      await extractMainFile(singleFile);
    } else {
      // It's a metadata file (CSV, XLSX, TXT)
      await extractMetadataFile(singleFile);
    }
  };

  const filteredMaterials = React.useMemo(() => {
    let result = [...materials];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(m =>
        m.title?.toLowerCase().includes(s) || (m.uniqueId || "").toLowerCase().includes(s) || m.creator?.toLowerCase().includes(s)
      );
    }
    if (approvalFilter !== "all") {
      result = result.filter((m) => approvalStatusFor(m) === approvalFilter);
    }
    if (selectedHierarchyItem) {
      result = result.filter(m =>
        m.hierarchyPath?.includes(selectedHierarchyItem) ||
        m.uniqueId === selectedHierarchyItem ||
        m.id === selectedHierarchyItem
      );
    }
    // Date sorting
    if (dateSort === "newest") {
      result.sort((a, b) => {
        const ta = new Date(b.createdAt || b.ingestDate || 0).getTime();
        const tb = new Date(a.createdAt || a.ingestDate || 0).getTime();
        return (isNaN(ta) ? 0 : ta) - (isNaN(tb) ? 0 : tb);
      });
    } else if (dateSort === "oldest") {
      result.sort((a, b) => {
        const ta = new Date(a.createdAt || a.ingestDate || 0).getTime();
        const tb = new Date(b.createdAt || b.ingestDate || 0).getTime();
        return (isNaN(ta) ? 0 : ta) - (isNaN(tb) ? 0 : tb);
      });
    }
    return result;
  }, [materials, search, selectedHierarchyItem, approvalFilter, dateSort]);

  const totalPages = Math.ceil(filteredMaterials.length / itemsPerPage);
  const paginatedMaterials = filteredMaterials.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleMaterialDetail = async (mat: ArchivalMaterial) => {
    const selectedKey = selectedMaterial?.id || selectedMaterial?.uniqueId;
    const targetKey = mat.id || mat.uniqueId;
    if (selectedKey && targetKey && selectedKey === targetKey) {
      setSelectedMaterial(null);
    } else {
      // Fetch full server copy first so pageImages/chunked fileUrl are reconstructed.
      let hydrated: any = null;
      const routeId = (mat.id || mat.uniqueId) as string;
      try {
        const resp = await fetch(`/api/materials/${encodeURIComponent(routeId)}`);
        if (resp.ok) hydrated = await resp.json();
      } catch (err) {
        console.warn("Failed to hydrate material from API:", err);
      }
      if (!hydrated) {
        const { loadMaterial } = await import('@/data/storage');
        hydrated = await loadMaterial(routeId);
      }
      setSelectedMaterial(hydrated || mat);

      // Auto-open hierarchy panel and expand the tree to show this material's location
      if (mat.hierarchyPath) {
        setShowHierarchy(true);
        // Build hierarchy path segments for auto-expansion
        const parts = (mat.hierarchyPath || "").split(" > ").map(p => p.trim()).filter(Boolean);
        // Select the subfonds (department) level if present
        const hierarchyTarget = parts.length > 1 ? parts.slice(1).join(" > ") : parts[0];
        setExpandedHierarchyPaths(parts);
      }
    }
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

  const updateApprovalStatus = async (material: ArchivalMaterial, status: "approved" | "rejected") => {
    const now = new Date().toISOString();
    const updatedMaterial = {
      ...material,
      approvalStatus: status,
      approvedAt: status === "approved" ? now : undefined,
      approvedBy: status === "approved" ? (me?.name || "Admin") : undefined,
    } as ArchivalMaterial;

    try {
      await updateMaterial({ id: material.id, data: updatedMaterial });
    } catch (err) {
      console.error("Failed to update approval status in Firestore:", err);
    }

    // Update local state for immediate UI feedback
    setMaterials(prev => prev.map(m => m.id === material.id ? updatedMaterial : m));
    refetchMaterials();

    if (material.approvalStatus === "pending") {
      updateIngestRequest(material.id, status);
    }

    const hierarchyLabel = material.hierarchyPath || "Unassigned";
    addActivity({
      user: me?.name || "Admin",
      actionType: status === "approved" ? "approve" : "reject",
      description: `${status === "approved" ? "Approved" : "Rejected"} material: ${material.title} (Hierarchy: ${hierarchyLabel})`,
      materialId: material.uniqueId,
    });

    toast({
      title: status === "approved" ? "Approved" : "Rejected",
      description: status === "approved" ? "Material is now published." : "Material has been rejected.",
    });
  };

  const { mutateAsync: deleteMatApi, isPending: isDeletingMat } = useDeleteMaterial();

  const confirmDeleteMaterial = async () => {
    if (materialToDelete && !isDeletingMat) {
      try {
        const target = materials.find((m) => m.id === materialToDelete);

        await deleteMatApi(materialToDelete);

        // Local storage sync fallback for production resilience
        const updated = await deleteMaterial(materialToDelete);
        setMaterials(updated);
        refetchMaterials();

        addActivity({
          user: me?.name || "Admin",
          actionType: "delete",
          description: `Deleted material: ${target?.title || materialToDelete}`
        });

        toast({ title: "Deleted", description: "Material removed from repository." });
        setDeleteDialogOpen(false);
        setMaterialToDelete(null);
      } catch (err: any) {
        console.error("Cloud Deletion Failed:", err);
        const status = err?.status;
        const errorMsg = err?.data?.error || err?.message || "Check your connection and try again.";

        toast({
          title: status === 404 ? "Material Sync Issue" : "Deletion Failed",
          description: status === 404
            ? "Record not found in Firestore. It may have already been deleted or exists as a local record only."
            : `Server returned error: ${errorMsg}`,
          variant: "destructive"
        });

        // If it's a 404, we might want to clear it locally anyway if it's orphaned
        if (status === 404) {
          const updated = await deleteMaterial(materialToDelete);
          setMaterials(updated);
          refetchMaterials();
          setDeleteDialogOpen(false);
          setMaterialToDelete(null);
        }
      }
    }
  };

  const handleDeleteMaterial = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    // Defer state update to next tick to avoid blocking click handler
    requestAnimationFrame(() => {
      setMaterialToDelete(id);
      setDeleteDialogOpen(true);
    });
  };

  const handleEditMaterial = (mat: ArchivalMaterial, e: React.MouseEvent) => {
    e.stopPropagation();
    const parts = (mat.hierarchyPath || "").split(" > ").map(p => p.trim());
    let depth = 1;
    if (parts[depth] === "Departmental Sub-fonds") depth++;

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
      fileData: undefined,
      fileType: mat.fileType || "",
      year: mat.uniqueId?.substring(0, 2) || "26",
      catNo: mat.uniqueId?.substring(4, 6) || "01",
      matNo: mat.uniqueId?.substring(6) || "0000001",
      fonds: parts[0] || "",
      subfonds: parts[depth] || "",
      program: parts.length > depth + 1 ? parts[depth + 1] : "",
      series: parts.length > depth + 2 ? parts[parts.length - 1] : ""
    });
    setChecklistValues(mat as any);
    setUploadOpen(true);
  };

  const handleExportMetadata = async () => {
    if (filteredMaterials.length === 0) return;

    if (!(window as any).ExcelJS || !(window as any).saveAs) {
      toast({ title: "Error", description: "Excel export library not loaded yet.", variant: "destructive" });
      return;
    }

    const ExcelJS = (window as any).ExcelJS;
    const saveAs = (window as any).saveAs;
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'iArchive Digital Repository';
    workbook.created = new Date();

    filteredMaterials.forEach((mat, index) => {
      // Abbreviate sheet name as Excel sets max length to 31 chars
      const safeTitle = (mat.referenceCode || mat.uniqueId || `Record ${index + 1}`).substring(0, 30).replace(/[:\\\/?*\[\]]/g, "-");
      const sheet = workbook.addWorksheet(safeTitle, {
        views: [{ state: 'frozen', ySplit: 2 }]
      });

      sheet.columns = [
        { key: 'code', width: 20 },
        { key: 'name', width: 40 },
        { key: 'standard', width: 15 },
        { key: 'value', width: 80 }
      ];

      const titleRow = sheet.addRow(['ARCHIVAL DESCRIPTION RECORD']);
      sheet.mergeCells('A1:D1');
      titleRow.height = 30;
      const titleCell = sheet.getCell('A1');
      titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A2A44' } }; // Dark navy
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

      const headerRow = sheet.addRow(['FIELD CODE', 'FIELD NAME', 'STANDARD', 'VALUE']);
      headerRow.height = 20;
      headerRow.eachCell((cell: any) => {
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4775B3' } }; // Steel blue
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF8FAACC' } },
          bottom: { style: 'thin', color: { argb: 'FF8FAACC' } },
          left: { style: 'thin', color: { argb: 'FF8FAACC' } },
          right: { style: 'thin', color: { argb: 'FF8FAACC' } }
        };
      });

      const addDivider = (text: string) => {
        const div = sheet.addRow([text]);
        sheet.mergeCells(`A${div.number}:D${div.number}`);
        const c = sheet.getCell(`A${div.number}`);
        c.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF000000' } };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDF3D0' } }; // Gold background
        c.alignment = { horizontal: 'center', vertical: 'middle' };
      };

      let dataRowIndex = 0;
      const addDataRow = (fieldDef: any, value: string) => {
        const row = sheet.addRow([fieldDef.code, fieldDef.name, fieldDef.standard, value]);
        const bgColor = dataRowIndex % 2 !== 0 ? 'FFF4F8FC' : 'FFFFFFFF';

        const cellA = row.getCell(1);
        cellA.font = { name: 'Calibri', size: 10, bold: true };
        cellA.alignment = { horizontal: 'center', vertical: 'middle' };

        const cellB = row.getCell(2);
        cellB.font = { name: 'Calibri', size: 10 };
        cellB.alignment = { vertical: 'middle' };

        const cellC = row.getCell(3);
        cellC.font = { name: 'Calibri', size: 10, italic: true };
        cellC.alignment = { horizontal: 'center', vertical: 'middle' };

        const cellD = row.getCell(4);
        cellD.font = { name: 'Calibri', size: 10 };
        cellD.alignment = { vertical: 'top', wrapText: true };

        row.eachCell((cell: any) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFD9E2EE' } },
            bottom: { style: 'thin', color: { argb: 'FFD9E2EE' } },
            left: { style: 'thin', color: { argb: 'FFD9E2EE' } },
            right: { style: 'thin', color: { argb: 'FFD9E2EE' } }
          };
        });

        dataRowIndex++;
      };

      addDivider('--- ISAD(G) ARCHIVAL DESCRIPTION ---');
      COMBINED_FIELDS.filter(f => f.standard === 'ISAD(G)' || f.standard === 'Both').forEach(f => {
        const value = (mat as any)[f.fieldKey] || '';
        addDataRow(f, value);
      });

      addDivider('--- DUBLIN CORE METADATA ---');
      dataRowIndex = 0;
      COMBINED_FIELDS.filter(f => f.standard === 'Dublin Core').forEach(f => {
        const value = (mat as any)[f.fieldKey] || '';
        addDataRow(f, value);
      });

      const footerRow = sheet.addRow([`iArchive Digital Repository • Holy Cross of Davao College • Generated: ${new Date().toISOString().split('T')[0]}`]);
      sheet.mergeCells(`A${footerRow.number}:D${footerRow.number}`);
      footerRow.height = 20;
      const footerCell = sheet.getCell(`A${footerRow.number}`);
      footerCell.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF5A7394' } };
      footerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6ECF5' } };
      footerCell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `iarchive_metadata_export_${new Date().toISOString().split('T')[0]}.xlsx`);

    toast({
      title: "Export Successful",
      description: `Targeted ${filteredMaterials.length} records. Downloaded as Excel Workbook.`
    });
  };

  const hierarchyTree = React.useMemo(
    () => buildHierarchyWithMaterials(SAMPLE_HIERARCHY, materials),
    [materials]
  );

  // Hierarchy Helpers (driven by categories for proper fonds -> sub-fonds cascading)
  const normalizedCategories = React.useMemo(
    () =>
      categories.map((c: any) => ({
        ...c,
        normalizedLevel: normalizeCategoryLevel(c.level),
      })),
    [categories]
  );
  const fondsOptions = React.useMemo(() => [{ id: "fonds-hcdc", name: "HCDC" }], []);
  const subfondsOptions = React.useMemo(() => {
    const byCode = new Map<string, { id: string; code: string; name: string; categoryId?: string }>();
    normalizedCategories
      .filter((c: any) => c.normalizedLevel === "subfonds")
      .forEach((node: any) => {
        const code = extractDepartmentCode(node.name);
        if (!code) return;
        byCode.set(code, { id: node.id, code, name: SUBFOND_DISPLAY[code] || node.name, categoryId: node.id });
      });
    REQUIRED_SUBFONDS.forEach((code) => {
      if (!byCode.has(code)) byCode.set(code, { id: `required-${code}`, code, name: SUBFOND_DISPLAY[code] || code });
    });
    customSubfonds.forEach((code) => {
      if (!byCode.has(code)) byCode.set(code, { id: `custom-${code}`, code, name: code });
    });
    return Array.from(byCode.values());
  }, [normalizedCategories, customSubfonds]);
  const selectedSubfondsOption = React.useMemo(
    () => subfondsOptions.find((s) => s.code === uploadForm.subfonds),
    [subfondsOptions, uploadForm.subfonds]
  );
  const seriesOptions = React.useMemo(
    () =>
      normalizedCategories.filter(
        (c: any) => c.normalizedLevel === "series" && (!selectedSubfondsOption?.categoryId || c.parentId === selectedSubfondsOption.categoryId)
      ),
    [normalizedCategories, selectedSubfondsOption]
  );
  const seriesSuggestionValues = React.useMemo(() => {
    const fromCategories = seriesOptions.map((s: any) => String(s.name || "").trim()).filter(Boolean);
    const fromFallback = uploadForm.subfonds ? (PROGRAMS_BY_SUBFOND[uploadForm.subfonds] || []) : [];
    const merged = [...fromCategories, ...fromFallback];
    const byNormalized = new Map<string, string>();
    
    merged.forEach((name) => {
      // Normalization: Extract abbreviation from parentheses or start of string
      // e.g., "Bachelor of Science in Hospitality Management (BSHM)" -> key: "BSHM"
      // e.g., "BSHM" -> key: "BSHM"
      const abbreviationMatch = name.match(/\(([A-Z0-9-]{2,})\)/) || name.match(/^([A-Z0-9-]{2,})/);
      const key = abbreviationMatch ? abbreviationMatch[1].toLowerCase() : name.toLowerCase();
      
      // Prefer the display name that is more descriptive (longer)
      const already = byNormalized.get(key);
      if (!already || name.length > already.length) {
        byNormalized.set(key, name);
      }
    });
    return Array.from(byNormalized.values()).sort();
  }, [seriesOptions, uploadForm.subfonds]);
  const primaryFondsCategory = React.useMemo(
    () => normalizedCategories.find((c: any) => c.normalizedLevel === "fonds" && /hcdc/i.test(String(c.name || ""))),
    [normalizedCategories]
  );
  React.useEffect(() => {
    if (uploadForm.fonds !== "HCDC") {
      setUploadForm((p) => ({ ...p, fonds: "HCDC", subfonds: "", program: "", series: "" }));
    }
  }, [uploadForm.fonds]);

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-[#0a1628]">Archival Materials</h1>
          <p className="text-muted-foreground">Browse hierarchy, manage metadata, and catalog items using ISAD(G) standards.</p>
        </div>
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <Button variant="outline" className={cn("shrink-0 gap-2 w-full sm:w-auto transition-all", showHierarchy ? "bg-primary/10 text-primary border-primary/30" : "")} onClick={() => setShowHierarchy(!showHierarchy)}>
            <FolderTree className="w-4 h-4" /> {showHierarchy ? "Hide Hierarchy" : "Show Hierarchy"}
          </Button>
          <Button variant="outline" className="shrink-0 gap-2 w-full sm:w-auto hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all" onClick={handleExportMetadata}>
            <Download className="w-4 h-4" /> Export Metadata
          </Button>
          <Button variant="outline" className="shrink-0 gap-2 w-full sm:w-auto shadow-sm" onClick={() => setChecklistOpen(true)}>
            <ShieldCheck className="w-4 h-4 text-primary" /> Metadata Checklist
          </Button>
          <Button className="shrink-0 shadow-lg gap-2 w-full sm:w-auto" onClick={() => {
            setProcessingState("idle");
            setFileDetails(null);
            setNeedsManualInput(true);
            setValidationErrors([]);
            setEditingMaterialId(null);

            // Calculate next material number
            const latestMatNo = materials.reduce((max, mat) => {
              const match = String(mat.uniqueId || "").match(/^\d{2}iA\d{2}(\d{7})$/);
              if (match) {
                const num = parseInt(match[1], 10);
                return num > max ? num : max;
              }
              return max;
            }, 0);
            const nextMatNo = String(latestMatNo + 1).padStart(7, "0");

            setUploadForm({
              title: "", creator: "", dateOfDescription: "", format: "", description: "",
              levelOfDescription: "Item", extentAndMedium: "", access: "public",
              videoUrl: "", fileUrl: "", hierarchyPath: "", termsOfUse: "", referenceCode: "",
              year: "26", catNo: "01", matNo: nextMatNo,
              fonds: "HCDC", subfonds: "", program: "", series: "", pageImages: []
            } as any);
            setChecklistValues({
              title: "", creator: "", dateOfDescription: new Date().toISOString().split('T')[0], format: "", description: "",
              levelOfDescription: "Item", extentAndMedium: "", accessConditions: "Public access; no restrictions.",
              termsOfUse: "", referenceCode: ""
            });
            setMainFileName("");
            setMetadataFileName("");
            setRawExtractionText("");
            setMainMaterialText("");
            setPdfPreviewImages([]);
            setUploadOpen(true);
          }}>
            <Plus className="w-4 h-4 text-white" /> Ingest Material
          </Button>
        </div>
      </div>

      <div className={cn("grid grid-cols-1 gap-6", showHierarchy ? "lg:grid-cols-4" : "lg:grid-cols-1")}>
        {/* ═══ Left: Archival Hierarchy Tree ═══ */}
        {showHierarchy && (
          <div className="lg:col-span-1">
            <Card className="shadow-sm border-border/50 bg-white sticky top-20">
              <CardHeader className="border-b border-border/50 pb-3 px-4 pt-4 flex flex-row items-center justify-between">
                <CardTitle className="text-[11px] font-bold text-[#0a1628] flex items-center gap-2 uppercase tracking-widest">
                  <FolderTree className="w-4 h-4 text-primary" /> Archival Hierarchy
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-500" onClick={() => setShowHierarchy(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="p-2 max-h-[700px] overflow-y-auto custom-scrollbar">
                <ArchivalTree node={hierarchyTree} selectedId={selectedHierarchyItem} expandedPaths={expandedHierarchyPaths} onSelectItem={(id) => {
                  setSelectedHierarchyItem(prev => prev === id ? null : id);
                  setSelectedMaterial(null);
                  setShowHierarchy(true);
                  setExpandedHierarchyPaths([]);
                }} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* ═══ Right: Materials List & Inline Details ═══ */}
        <div className={showHierarchy ? "lg:col-span-3" : "lg:col-span-1"}>
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
              <Select value={dateSort} onValueChange={(v: any) => setDateSort(v)}>
                <SelectTrigger className="w-[160px] h-9 text-xs bg-white shrink-0">
                  <SelectValue placeholder="Sort by date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="none">No Sort</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-sm text-muted-foreground flex items-center gap-2 shrink-0">
                <Layers className="w-4 h-4" /> {filteredMaterials.length} items
              </div>
            </div>

            <div className="px-4 pb-4 pt-2 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border/40">
              {([
                { key: "all", label: "All", count: approvalCounts.all },
                { key: "approved", label: "Approved", count: approvalCounts.approved },
                { key: "pending", label: "Pending", count: approvalCounts.pending },
                { key: "rejected", label: "Rejected", count: approvalCounts.rejected },
              ] as const).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setApprovalFilter(tab.key)}
                  className={cn(
                    "px-3 py-1.5 rounded-full border transition-colors bg-white",
                    approvalFilter === tab.key
                      ? "bg-[#0a1628] text-white border-[#0a1628]"
                      : "bg-white text-muted-foreground border-border hover:border-[#0a1628]/30 hover:text-[#0a1628]"
                  )}
                >
                  {tab.label}
                  <span className="ml-2 text-[9px] font-mono">{tab.count}</span>
                </button>
              ))}
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[920px] divide-y divide-border/40">
                <div className="grid grid-cols-[140px_70px_1fr_120px_70px_90px_120px_60px] gap-2 px-4 py-2.5 bg-muted/30 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  <span>Unique ID</span><span>Barcode</span><span>Title</span><span>Progress</span><span className="text-right">%</span><span className="text-center">Metadata</span><span className="text-center">Approval</span><span></span>
                </div>

                {materialsLoading ? (
                  <div className="py-16 text-center text-muted-foreground">
                    <div className="mx-auto h-8 w-32 rounded bg-muted/40 animate-pulse" />
                    <div className="mx-auto mt-3 h-3 w-56 rounded bg-muted/30 animate-pulse" />
                  </div>
                ) : filteredMaterials.length === 0 ? (
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
                    const isExpanded = (selectedMaterial?.id || selectedMaterial?.uniqueId) === (mat.id || mat.uniqueId);
                    const approvalStatus = approvalStatusFor(mat);
                    const approvalBadge = approvalStatus === "approved"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : approvalStatus === "pending"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-red-50 text-red-700 border-red-200";

                    return (
                      <React.Fragment key={mat.id || `${mat.uniqueId}-${(mat as any).createdAt || "row"}`}>
                        <div className={cn("grid grid-cols-[140px_70px_1fr_120px_70px_90px_120px_60px] gap-2 px-4 py-4 items-center hover:bg-muted/10 transition-colors group cursor-pointer", isExpanded && "bg-muted/5")} onClick={() => toggleMaterialDetail(mat)}>
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
                                  <ShieldCheck className="w-2 h-2" /> OAIS Aligned
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
                          <div className="text-center">
                            <Badge variant="outline" className={cn("text-[9px] capitalize", approvalBadge)}>{approvalStatus}</Badge>
                          </div>
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {isAdmin && approvalStatus === "pending" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-emerald-600 hover:text-emerald-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void updateApprovalStatus(mat, "approved");
                                }}
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={(e) => handleEditMaterial(mat, e)}>
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-600" onClick={(e) => handleDeleteMaterial(mat.id, e)}>
                              <X className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                const materialRouteId = mat.id || mat.uniqueId;
                                if (!materialRouteId) return;
                                window.open(`/materials/${materialRouteId}`, '_blank');
                              }}
                            >
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
                                {/* Hierarchy Breadcrumb Trail */}
                                {mat.hierarchyPath && (
                                  <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                                    <Folder className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                    {(mat.hierarchyPath || "").split(" > ").map((segment: string, idx: number, arr: string[]) => (
                                      <React.Fragment key={idx}>
                                        <span className={cn(
                                          "text-[11px] font-semibold px-2 py-0.5 rounded-md transition-colors",
                                          idx === 0 ? "bg-[#0B3D91]/10 text-[#0B3D91] font-bold" :
                                            idx === 1 ? "bg-[#4169E1]/10 text-[#4169E1] font-bold" :
                                              idx === 2 ? "bg-[#0EA5E9]/10 text-[#0EA5E9] font-bold" :
                                                "bg-muted/60 text-muted-foreground"
                                        )}>
                                          {segment.trim()}
                                        </span>
                                        {idx < arr.length - 1 && (
                                          <ChevronRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />
                                        )}
                                      </React.Fragment>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge variant="outline" className={cn("text-[9px] capitalize", approvalBadge)}>
                                  {approvalStatus}
                                </Badge>
                                {isAdmin && approvalStatus === "pending" && (
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-[10px] font-bold text-emerald-600 border-emerald-200 hover:bg-emerald-50 gap-1.5"
                                      onClick={() => void updateApprovalStatus(mat, "approved")}
                                    >
                                      <ShieldCheck className="w-3.5 h-3.5" /> Approve
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-[10px] font-bold text-red-600 border-red-200 hover:bg-red-50 gap-1.5"
                                      onClick={() => void updateApprovalStatus(mat, "rejected")}
                                    >
                                      <X className="w-3.5 h-3.5" /> Reject
                                    </Button>
                                  </div>
                                )}
                                <div className="flex items-center gap-3">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-[10px] font-bold text-emerald-600 border-emerald-200 hover:bg-emerald-50 gap-1.5"
                                    onClick={() => {
                                      const headers = ["Field", "Value"];
                                      const rows = Object.entries(mat).filter(([k, v]) => typeof v === 'string' || typeof v === 'number').map(([k, v]) => [k, v]);
                                      const csvContent = [headers.join(","), ...rows.map(r => `"${r[0]}","${String(r[1]).replace(/\n/g, ' ')}"`)].join("\n");
                                      const blob = new Blob([csvContent], { type: 'text/csv' });
                                      const url = URL.createObjectURL(blob);
                                      const link = document.createElement("a");
                                      link.href = url;
                                      link.download = `metadata_${mat.uniqueId}.csv`;
                                      link.click();
                                    }}
                                  >
                                    <Download className="w-3.5 h-3.5" /> Metadata CSV
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-[10px] font-bold text-indigo-600 border-indigo-200 hover:bg-indigo-50 gap-1.5" 
                                    onClick={(e) => handleEditMaterial(mat, e)}
                                  >
                                    <Edit className="w-3.5 h-3.5" /> Edit Record
                                  </Button>
                                </div>
                              </div>
                            </div>

                            {/* ─── DATA INSIGHTS SECTION ─── */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-10">
                              <div className="md:col-span-4 bg-muted/20 rounded-[2rem] p-8 flex flex-col items-center justify-center border border-border/40">
                                <CompletionRing percentage={pct} size={160} strokeWidth={12} color={color} label="Overall" />
                                <div className="mt-6 text-center">
                                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Record Integrity</div>
                                  <div className="text-sm font-bold text-[#0a1628]">{getCompletionCategory(pct).toUpperCase()}</div>
                                </div>
                              </div>
                              
                              <div className="md:col-span-8 bg-white border border-border/40 rounded-[2rem] p-8">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-6 flex items-center gap-2">
                                  <BarChart3 className="w-4 h-4 text-primary" /> ISAD(G) Area Completion
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                  {computeAreaBreakdown(mat).map((area, i) => (
                                    <div key={i} className="space-y-2">
                                      <div className="flex justify-between items-end">
                                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-tighter truncate max-w-[80px]" title={area.area.name}>
                                          {area.area.name}
                                        </span>
                                        <span className="text-[10px] font-bold" style={{ color: getCompletionColor(area.completion) }}>{area.completion}%</span>
                                      </div>
                                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${area.completion}%`, backgroundColor: getCompletionColor(area.completion) }} />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <div className="mt-8 pt-6 border-t border-dashed border-border/60 flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">ISAD(G) Compatible</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Dublin Core Ready</span>
                                    </div>
                                  </div>
                                  <div className="text-[10px] font-black text-primary uppercase tracking-widest">Standard: OAIS 2025</div>
                                </div>
                              </div>
                            </div>

                            {/* ACTUAL VIEWER */}
                            <div className="mb-8 rounded-xl overflow-hidden border shadow-sm bg-[#1e1e1e]">
                              <div className="flex items-center justify-between px-4 py-2 bg-[#2a2a2a] text-white/70 text-xs font-bold uppercase tracking-widest border-b border-white/10">
                                <span className="flex items-center gap-2"><ZoomIn className="w-3.5 h-3.5 text-indigo-400" /> Media Viewer</span>
                                {mat.access !== 'public' ? (
                                  <span className="flex items-center gap-1.5 text-red-400 bg-red-400/10 px-2 py-0.5 rounded uppercase font-bold"><Lock className="w-3 h-3" /> {mat.access} - Admin Override Mode</span>
                                ) : (
                                  <span className="text-emerald-400">Public Object</span>
                                )}
                              </div>
                              {(() => {
                                const sm = selectedMaterial;
                                if (!sm) {
                                  return (
                                    <div className="h-[420px] bg-[#141414] relative overflow-hidden">
                                      {/* subtle grid + glow */}
                                      <div className="absolute inset-0 opacity-[0.06] bg-[linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:24px_24px]" />
                                      <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-500/20 blur-[80px] rounded-full" />
                                      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-emerald-500/10 blur-[90px] rounded-full" />

                                      <div className="relative h-full flex flex-col items-center justify-center px-8">
                                        {/* Card skeleton */}
                                        <div className="w-full max-w-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl">
                                          <div className="flex items-center gap-3 mb-5">
                                            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 animate-pulse" />
                                            <div className="flex-1">
                                              <div className="h-3 w-40 rounded bg-white/10 animate-pulse" />
                                              <div className="h-2 w-28 rounded bg-white/10 mt-2 animate-pulse" />
                                            </div>
                                            <div className="h-6 w-16 rounded-full bg-white/10 animate-pulse" />
                                          </div>

                                          <div className="h-48 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 relative overflow-hidden">
                                            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
                                                <div className="w-7 h-7 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                                              </div>
                                            </div>
                                          </div>

                                          <div className="mt-5">
                                            <p className="text-white/80 text-sm font-bold tracking-wide">Loading material preview</p>
                                            <p className="text-white/40 text-xs mt-1.5 leading-relaxed">
                                              Fetching pages and reconstructing any chunked files from storage…
                                            </p>
                                          </div>
                                        </div>

                                        <div className="mt-5 text-[10px] font-mono text-white/30 tracking-widest uppercase">
                                          Please wait…
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }
                                const fileUrlStr = typeof sm.fileUrl === "string" ? sm.fileUrl : "";
                                const isPdf = fileUrlStr.startsWith("data:application/pdf") || sm.fileType?.includes("pdf") || sm.format?.includes("pdf");
                                const isVideo = sm.fileType?.startsWith("video/") || fileUrlStr.startsWith("data:video/");
                                const isImage = sm.fileType?.startsWith("image/") || fileUrlStr.startsWith("data:image/");
                                const hasPages = !!(sm.pageImages && sm.pageImages.length > 0);
                                const hasRawFile = !!fileUrlStr && fileUrlStr !== "PENDING_UPLOAD" && fileUrlStr !== "CHUNKED";
                                if (isPdf) {
                                  return (
                                    <div className="relative w-full h-[700px] bg-[#333]">
                                      <object data={sm.fileUrl} type="application/pdf" className="w-full h-full">
                                        <iframe src={sm.fileUrl} className="w-full h-full border-0">
                                          <div className="p-8 text-center text-white/50">Your browser does not support embedding PDFs.</div>
                                        </iframe>
                                      </object>
                                    </div>
                                  );
                                }
                                if (isVideo) {
                                  return (
                                    <video src={sm.fileUrl} controls className="w-full h-[600px] object-contain bg-black" />
                                  );
                                }
                                if (hasPages) {
                                  return (
                                    <div className="flex overflow-x-auto gap-4 p-8 snap-x bg-[#1a1a1a] custom-scrollbar scroll-smooth">
                                      {sm.pageImages?.map((img, i) => (
                                        <div key={i} className="shrink-0 snap-center relative group">
                                          <img src={img} className="h-[600px] object-contain shadow-2xl bg-white border border-white/10 rounded" />
                                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white backdrop-blur-sm text-[10px] font-bold px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">Page {i + 1}</div>
                                        </div>
                                      ))}
                                    </div>
                                  );
                                }
                                if (isImage) {
                                  return (
                                    <div className="bg-[#1a1a1a] p-8 flex justify-center">
                                      <img src={sm.fileUrl} className="max-h-[600px] max-w-full object-contain rounded shadow-2xl bg-white" />
                                    </div>
                                  );
                                }
                                return (
                                  <div className="h-[300px] flex flex-col items-center justify-center text-white/30 bg-[#222]">
                                    <FileText className="w-12 h-12 mb-4 opacity-40" />
                                    <p className="text-sm font-semibold uppercase tracking-wider">No viewable media representation</p>
                                    {hasRawFile && (
                                      <a href={fileUrlStr} target="_blank" rel="noreferrer" className="mt-4 text-xs text-indigo-300 underline">
                                        Open raw file
                                      </a>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>

                            {/* Re-use MetadataChecklist layout directly! */}
                            <MetadataChecklist
                              values={mat as any}
                              selectedFields={new Set()}
                              onToggle={() => { }}
                              onSelectAll={() => { }}
                              onClearAll={() => { }}
                              onValueChange={async (fieldKey, value) => {
                                // Inline edit propagation for both Cloud and Local saving
                                const updatedMat = { ...mat, [fieldKey]: value };

                                try {
                                  // Primary sync to cloud (Firestore)
                                  await updateMaterial({ id: mat.id, data: { [fieldKey]: value } });
                                } catch (err) {
                                  console.warn("Cloud sync failed during inline edit, falling back to local storage:", err);
                                }

                                // Update local state for immediate UI feedback
                                setMaterials(prev => prev.map(m => m.id === mat.id ? updatedMat : m));
                              }}
                              className="shadow-none border border-border/60"
                              allowedFieldIds={activeSchema}
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
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredMaterials.length)} of {filteredMaterials.length} materials
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

      {/* ═══ Folder Upload Summary Modal ═══ */}
      <Dialog open={folderSummaryOpen} onOpenChange={setFolderSummaryOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg text-[#0a1628]">
              <FolderOpen className="w-5 h-5 text-indigo-600" /> Folder Upload Complete
            </DialogTitle>
            <DialogDescription>
              {folderSummaryData.count} file(s) have been processed from the selected folder.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[300px] overflow-y-auto border rounded-lg p-3 bg-muted/20 space-y-1">
            {folderSummaryData.names.map((name, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-[#0a1628] py-1 px-2 rounded hover:bg-muted/30">
                <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="truncate">{name}</span>
              </div>
            ))}
            {folderSummaryData.count > 20 && (
              <p className="text-[10px] text-muted-foreground text-center pt-2">...and {folderSummaryData.count - 20} more files</p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setFolderSummaryOpen(false)} className="bg-indigo-600 hover:bg-indigo-700">Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Upload & Scan Dialog (Admin Form Overhaul) ═══ */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto bg-[#fafbfc]">
          <DialogHeader className="border-b pb-4 mb-2">
            <DialogTitle className="flex items-center gap-2 text-xl text-[#0a1628]">
              <Upload className="w-5 h-5 text-primary" /> Setup Archival Item
            </DialogTitle>
            <DialogDescription>
              Upload the material first, then assign metadata and organize the hierarchy.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">

            {/* ── STEP 1: UPLOAD MATERIAL FIRST ── */}
            <div className="border border-indigo-200 bg-indigo-50/30 rounded-xl p-5">
              <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-widest mb-1 flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-500" /> Step 1 — Upload Material
              </h4>
              <p className="text-[10px] text-muted-foreground mb-4 font-medium">Select the media type and upload the file or folder first.</p>

              <div className="flex gap-2 mb-3 bg-white/50 p-1 rounded-lg border border-indigo-100 flex-wrap">
                <button type="button" onClick={() => setMediaCategory("document")} className={cn("flex-1 text-[10px] font-bold uppercase tracking-wide py-2 rounded-md flex items-center justify-center gap-1.5 transition-all text-xs min-w-[70px]", mediaCategory === "document" ? "bg-indigo-600 text-white shadow-md ring-1 ring-indigo-600/50" : "text-muted-foreground hover:bg-white hover:shadow-sm")}><FileText className="w-3.5 h-3.5" /> Document</button>
                <button type="button" onClick={() => setMediaCategory("image")} className={cn("flex-1 text-[10px] font-bold uppercase tracking-wide py-2 rounded-md flex items-center justify-center gap-1.5 transition-all text-xs min-w-[70px]", mediaCategory === "image" ? "bg-indigo-600 text-white shadow-md ring-1 ring-indigo-600/50" : "text-muted-foreground hover:bg-white hover:shadow-sm")}><ImageIcon className="w-3.5 h-3.5" /> Picture</button>
                <button type="button" onClick={() => setMediaCategory("video")} className={cn("flex-1 text-[10px] font-bold uppercase tracking-wide py-2 rounded-md flex items-center justify-center gap-1.5 transition-all text-xs min-w-[70px]", mediaCategory === "video" ? "bg-indigo-600 text-white shadow-md ring-1 ring-indigo-600/50" : "text-muted-foreground hover:bg-white hover:shadow-sm")}><Video className="w-3.5 h-3.5" /> Video</button>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Direct File Upload</span>
                  <Input type="file" onChange={handleMediaUpload} className="bg-white border-dashed border-2 cursor-pointer h-12 flex items-center file:mr-4 file:py-1 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" accept={mediaCategory === "document" ? ".pdf,.doc,.docx" : mediaCategory === "image" ? "image/*" : "video/*"} />
                </div>

                {/* Folder upload — available for all media types */}
                <div className="flex gap-2 w-full">
                  {/* @ts-ignore */}
                  <input type="file" onChange={handleMetadataScanUpload} className="hidden" id="mainFolderUploadInput" webkitdirectory="true" multiple />
                  <Button variant="outline" onClick={() => document.getElementById('mainFolderUploadInput')?.click()} className="w-full text-xs h-10 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                    <FolderOpen className="w-4 h-4 mr-1.5" /> Upload Folder
                  </Button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-px bg-indigo-100/60 flex-1"></div>
                  <span className="text-[9px] font-bold text-indigo-300 uppercase tracking-widest">AND / OR</span>
                  <div className="h-px bg-indigo-100/60 flex-1"></div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">External URL Link</span>
                  <Input type="url" placeholder={`Paste URL to ${mediaCategory} (e.g Google Drive)...`} value={uploadForm.videoUrl} onChange={(e) => setUploadForm({ ...uploadForm, videoUrl: e.target.value })} className="bg-white border-dashed border-2 text-sm focus-visible:ring-indigo-500 placeholder:text-muted-foreground h-10" />
                </div>
              </div>

              {processingState === "scanning" && (
                <div className="mt-3 text-xs text-indigo-700 font-bold flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing material...
                </div>
              )}
              {processingState === "done" && uploadForm.fileData && (
                <div className="mt-3 text-[10px] text-indigo-700 font-bold flex items-center gap-1.5 bg-indigo-100 p-1.5 rounded">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Material uploaded: {mainFileName || fileDetails?.name || "File ready"}
                </div>
              )}

              {/* For document type: the document IS also the metadata source */}
              {mediaCategory === "document" && processingState === "done" && (
                <div className="mt-2 text-[10px] text-emerald-600 font-bold flex items-center gap-1.5 bg-emerald-50 p-1.5 rounded border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Document text extracted and mapped to metadata checklist
                </div>
              )}
            </div>

            {/* ── STEP 2: METADATA DOCUMENT (for all media types) ── */}
            <div className="border border-emerald-200 bg-emerald-50/30 rounded-xl p-5">
              <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-widest mb-1 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-500" /> Step 2 — Metadata Document (Optional)
              </h4>
              <p className="text-[10px] text-muted-foreground mb-4 font-medium">Upload a descriptive doc/PDF/Excel/CSV to auto-fill metadata fields. The extracted text will populate the checklist.</p>
              <div className="flex gap-2">
                <Input type="file" onChange={handleMetadataScanUpload} className="bg-white flex-1" accept=".pdf,.doc,.docx,.txt,.csv,.xlsx" />
              </div>

              {metadataProcessingState === "scanning" && (
                <div className="mt-3 text-xs text-emerald-700 font-bold flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Extracting Metadata...
                </div>
              )}
              {metadataProcessingState === "done" && (
                <div className="mt-3 text-[10px] text-emerald-700 font-bold flex items-center gap-1.5 bg-emerald-100 p-1.5 rounded">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Text Extracted for Checklist: {metadataFileName}
                </div>
              )}
            </div>

            {/* ── STEP 3: Reference Code Generator ── */}
            <div className="bg-slate-50 rounded-xl p-6 border shadow-sm flex flex-col justify-between">
              <div className="mb-4">
                <span className="text-muted-foreground text-xs font-bold mb-1 block">Unique material identifier</span>
                <div className="text-3xl font-mono text-[#0a1628] font-bold tracking-widest">{generatedRefCode || "AUTO-GENERATED"}</div>
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
                  <Select value={uploadForm.catNo} onValueChange={v => setUploadForm({
                    ...uploadForm,
                    catNo: v,
                    access: v === "01" ? "public" : v === "02" ? "restricted" : "confidential"
                  })}>
                    <SelectTrigger className={cn("h-9 bg-white font-mono", validationErrors.includes('catNo') && "border-red-500 bg-red-50/50")}>
                      <SelectValue placeholder="Cat No." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="01">01 - Public Access</SelectItem>
                      <SelectItem value="02">02 - Restricted Access</SelectItem>
                      <SelectItem value="03">03 - Confidential Access</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-muted-foreground text-[10px] font-bold block mb-1.5 uppercase">Material no.</label>
                  <Input maxLength={7} className={cn("bg-white font-mono", validationErrors.includes('matNo') && "border-red-500 bg-red-50/50")} value={uploadForm.matNo} onChange={e => setUploadForm({ ...uploadForm, matNo: e.target.value })} />
                </div>
                <div>
                  <label className="text-muted-foreground text-[10px] font-bold block mb-1.5 uppercase">Year</label>
                  <Input maxLength={2} className={cn("bg-white font-mono", validationErrors.includes('year') && "border-red-500 bg-red-50/50")} value={uploadForm.year} onChange={e => setUploadForm({ ...uploadForm, year: e.target.value })} />
                </div>
              </div>
            </div>

            {/* ── STEP 4: Organizational Hierarchy ── */}
            <div className="bg-white rounded-xl border p-5">
              <h4 className="flex items-center gap-2 text-sm font-bold text-[#0a1628] mb-4">
                <FolderTree className="w-5 h-5 text-[#4169E1]" /> Organizational Hierarchy
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5 font-mono">Fonds</label>
                  <Select
                    value={uploadForm.fonds}
                    onValueChange={(v) => setUploadForm((p) => ({ ...p, fonds: v, subfonds: "", program: "", series: "" }))}
                  >
                    <SelectTrigger className="h-10 bg-white border-border/60 hover:border-[#4169E1]/50 focus:ring-[#4169E1]/20 transition-all font-semibold text-[#0a1628]">
                      <SelectValue placeholder="Select Fonds" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] overflow-y-auto">
                      {fondsOptions.map((fonds: any) => (
                        <SelectItem key={fonds.id} value={fonds.name}>{fonds.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5 font-mono">
                    Sub-fonds (Department)
                  </label>
                  <Select value={uploadForm.subfonds} onValueChange={v => setUploadForm(p => ({ ...p, subfonds: v, program: "", series: "" }))}>
                    <SelectTrigger className="h-10 bg-white border-border/60 hover:border-[#4169E1]/50 focus:ring-[#4169E1]/20 transition-all font-semibold text-[#0a1628]"><SelectValue placeholder="Select Department" /></SelectTrigger>
                    <SelectContent className="max-h-[300px] overflow-y-auto">
                      {subfondsOptions.map((subfonds: any) => (
                        <SelectItem key={subfonds.id} value={subfonds.code}>{subfonds.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="mt-2 flex gap-2">
                    <Input
                      placeholder="Add sub-fond code (e.g. CSCAA)"
                      value={newSubfonds}
                      onChange={(e) => setNewSubfonds(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""))}
                      className="h-8 bg-white text-xs"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="h-8 px-2 text-xs"
                      onClick={() => {
                        const code = newSubfonds.trim();
                        if (!code) return;
                        const existing = subfondsOptions.find((s) => s.code === code);
                        if (existing) {
                          setUploadForm((p) => ({ ...p, subfonds: code, series: "" }));
                          setNewSubfonds("");
                          return;
                        }
                        if (!primaryFondsCategory?.id) {
                          toast({
                            title: "Cannot add sub-fond",
                            description: "HCDC fonds is missing in categories. Please create/fix Fonds first.",
                            variant: "destructive",
                          });
                          return;
                        }
                        createCategory({
                          data: {
                            name: code,
                            level: "subfonds",
                            parentId: primaryFondsCategory.id,
                            description: `${code} sub-fond`,
                          },
                        })
                          .then(() => {
                            setCustomSubfonds((p) => (p.includes(code) ? p : [...p, code]));
                            setUploadForm((p) => ({ ...p, subfonds: code, series: "" }));
                            setNewSubfonds("");
                            toast({ title: "Sub-fond added", description: `${code} saved to hierarchy.` });
                          })
                          .catch(() => {
                            toast({
                              title: "Failed to add sub-fond",
                              description: "Could not save to backend right now.",
                              variant: "destructive",
                            });
                          });
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5 font-mono">
                    Series
                  </label>
                  <Input
                    list="series-suggestions"
                    placeholder="e.g. Research Papers, Yearbooks..."
                    value={uploadForm.series || ""}
                    onChange={e => {
                      const val = e.target.value;
                      const match = seriesSuggestionValues.find(s => s.toLowerCase() === val.toLowerCase());
                      setUploadForm(p => ({ ...p, series: match || val }));
                    }}
                    className="h-10 bg-white"
                  />
                  <datalist id="series-suggestions">
                    {seriesSuggestionValues.map((name: string) => (
                      <option key={name} value={name} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-6 pt-6 border-t border-dashed">
                <div>
                  <label className="text-[11px] font-bold text-[#0a1628] mb-1.5 block">Title (Double Check Scan) <span className="text-red-500">*</span></label>
                  <Input placeholder="Material Title" value={uploadForm.title} onChange={e => { setUploadForm({ ...uploadForm, title: e.target.value }); setValidationErrors(x => x.filter(k => k !== 'title')); }} className={cn("h-9", validationErrors.includes('title') && "border-red-500 bg-red-50/50")} />
                </div>
              </div>
            </div>

          </div>

          <DialogFooter className="mt-2 border-t pt-4 flex gap-2">
            <Button variant="ghost" onClick={() => setUploadOpen(false)}>Cancel Ingest</Button>
            <Button onClick={() => {
              if (validationErrors.length > 0 && !uploadForm.title) {
                setValidationErrors(['title', 'creator']);
                toast({ title: "Validation Error", description: "Please provide a Title and Creator", variant: "destructive" });
                return;
              }
              setUploadOpen(false);
              setPreviewOpen(true);
            }} disabled={processingState === "scanning" || metadataProcessingState === "scanning" || (!uploadForm.fileData && !uploadForm.videoUrl)} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              Proceed to Page Preview <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Smart Document Interactive Pre-viewer ═══ */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent
          className="max-w-5xl w-[95vw] h-[90vh] flex flex-col p-0 overflow-hidden bg-slate-50"
          onMouseUp={() => {
            const selection = window.getSelection();
            if (selection && selection.toString().trim().length > 0) {
              const rect = selection.getRangeAt(0).getBoundingClientRect();
              setSelectionTarget({ text: selection.toString().trim(), x: rect.left + rect.width / 2, y: rect.top - 10 });
            } else {
              setSelectionTarget(null);
            }
          }}
        >
          <DialogHeader className="p-6 border-b bg-white shrink-0">
            <DialogTitle className="flex items-center gap-2 text-xl text-[#0a1628]">
              <Search className="w-5 h-5 text-indigo-500" /> Interactive Page Preview
            </DialogTitle>
            <DialogDescription>
              We've automatically sniffed out several metadata fields!
              Not completely accurate? **Highlight any text below** to manually extract and assign it to a specific ISAD(G) field.
            </DialogDescription>
          </DialogHeader>

          {/* Interactive Extraction Viewer */}
          <div className="flex-1 overflow-y-auto px-10 py-8 scroll-smooth custom-scrollbar relative flex gap-8">

            {/* LEFT COLUMN: Visual Document Preview */}
            <div className={cn("flex flex-col gap-6 items-center shrink-0 transition-all", showExtractedText ? "w-1/2" : "w-full mx-auto max-w-4xl")}>
              <div className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-2 border-b pb-2 w-full text-center flex justify-between px-4 items-center">
                <span className="flex-1 text-center">Original Document Paged View</span>
                <Button variant="ghost" size="sm" onClick={() => setShowExtractedText(!showExtractedText)} className="text-[10px] uppercase font-bold tracking-widest opacity-80 hover:opacity-100">
                  {showExtractedText ? "Hide Text" : "Show Text"}
                </Button>
              </div>
              {(pdfPreviewImages.length > 0 ? pdfPreviewImages : [
                // Fallback mock images if PDF extraction failed (e.g. DOCX)
                "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1616628188550-808682f392ce?w=800&auto=format&fit=crop"
              ]).map((src, i) => (
                <div key={i} className="relative shadow-[0_5px_25px_rgba(0,0,0,0.15)] border border-slate-200 bg-white group">
                  <div className="absolute top-2 left-2 bg-indigo-900/80 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded shadow-sm z-10 uppercase tracking-widest">Page {i + 1}</div>

                  {/* Reorder Controls */}
                  {pdfPreviewImages.length > 0 && (
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-black/60 p-1 rounded backdrop-blur-sm">
                      <button onClick={(e) => { e.stopPropagation(); movePdfImage(i, 'left') }} disabled={i === 0} className="w-7 h-7 flex items-center justify-center text-white disabled:opacity-30 hover:bg-white/20 rounded cursor-pointer transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                      <button onClick={(e) => { e.stopPropagation(); movePdfImage(i, 'right') }} disabled={i === pdfPreviewImages.length - 1} className="w-7 h-7 flex items-center justify-center text-white disabled:opacity-30 hover:bg-white/20 rounded cursor-pointer transition-colors"><ChevronRight className="w-5 h-5" /></button>
                    </div>
                  )}

                  <img src={src} alt={`Page ${i + 1}`} className={cn("h-auto object-contain min-h-[500px]", showExtractedText ? "w-full max-w-[600px]" : "w-[900px] max-w-full")} />
                </div>
              ))}
            </div>

            {/* RIGHT COLUMN: Interactive Text Extraction */}
            {showExtractedText && (
              <div className="flex-1">
                <div className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-2 border-b pb-2 w-full text-center">Auto-Extracted Text</div>
                {rawExtractionText ? (
                  <div className="bg-white p-8 shadow-sm border border-slate-200 rounded-lg">
                    {rawExtractionText.split(/(?:\r?\n){2,}/).map((paragraph: string, idx: number) => (
                      <p key={idx} className="mb-4 text-slate-800 font-serif leading-relaxed text-[15px] selection:bg-indigo-200 selection:text-indigo-900 leading-8">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 min-h-[400px]">
                    <FileText className="w-12 h-12 mb-4 opacity-20" />
                    <p>No previewable text available for this format.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Popover tools for highlighting */}
          {selectionTarget && (
            <div
              style={{ position: 'fixed', top: selectionTarget.y, left: selectionTarget.x, transform: 'translate(-50%, -100%)', zIndex: 9999 }}
              className="bg-[#0a1628] shadow-xl rounded-lg p-2 flex flex-col gap-1 w-56 mb-2 animate-in fade-in zoom-in-95 duration-100 max-h-[300px] overflow-y-auto custom-scrollbar"
              onMouseDown={(e) => e.preventDefault()}
            >
              <div className="text-[9px] uppercase tracking-widest text-slate-400 font-bold px-2 py-1 mb-1 border-b border-slate-700">Assign Selection To:</div>
              {[
                { label: "Reference Code", key: "referenceCode" },
                { label: "Title", key: "title" },
                { label: "Creator / Author", key: "creator" },
                { label: "Dates", key: "date" },
                { label: "Level of Description", key: "levelOfDescription" },
                { label: "Extent & Medium", key: "extentAndMedium" },
                { label: "Description / Content", key: "description" },
                { label: "Fonds", key: "fonds" },
                { label: "Sub-fonds", key: "subfonds" },
                { label: "Series", key: "series" }
              ].map((action) => (
                <button
                  key={action.key}
                  className="text-left text-xs font-bold text-slate-200 hover:bg-indigo-600 hover:text-white px-2 py-1.5 rounded transition-colors"
                  onClick={() => {
                    if (!selectionTarget) return;
                    setChecklistValues(prev => ({ ...prev, [action.key]: selectionTarget.text }));

                    // Sync with top-level uploadForm if applicable
                    if (action.key === "title") setUploadForm(p => ({ ...p, title: selectionTarget.text }));
                    if (action.key === "creator") setUploadForm(p => ({ ...p, creator: selectionTarget.text }));
                    if (action.key === "fonds") setUploadForm(p => ({ ...p, fonds: selectionTarget.text }));
                    if (action.key === "subfonds") setUploadForm(p => ({ ...p, subfonds: selectionTarget.text }));
                    if (action.key === "series") {
                      const val = selectionTarget.text;
                      const match = seriesSuggestionValues.find(s => s.toLowerCase() === val.toLowerCase());
                      setUploadForm(p => ({ ...p, series: match || val }));
                    }

                    setSelectionTarget(null);
                    window.getSelection()?.removeAllRanges();
                  }}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}

          <div className="p-6 border-t bg-white shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.02)] z-10">
            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={() => { setPreviewOpen(false); setUploadOpen(true); }} className="text-slate-500">Back to Setup</Button>
              <div className="flex gap-4 items-center">
                <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-indigo-100">
                  <ShieldCheck className="w-3.5 h-3.5" /> Review captured pages & extraction
                </span>
                <Button onClick={() => { setPreviewOpen(false); setAccessControlOpen(true); }} className="gap-2 bg-[#0a1628] hover:bg-[#1a2b4b] shadow-lg">
                  Proceed to Access Control <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ Access Control Step ═══ */}
      <Dialog open={accessControlOpen} onOpenChange={setAccessControlOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-[#960000]" /> Access Control & Terms
            </DialogTitle>
            <DialogDescription>
              Define the sensitivity of this archival material and set usage restrictions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <label className="text-sm font-bold text-[#0a1628] uppercase tracking-widest block">Access Level Selection</label>
              <div className="grid grid-cols-3 gap-3">
                {["public", "restricted", "confidential"].map((level) => (
                  <button
                    key={level}
                    onClick={() => setUploadForm(p => ({ ...p, access: level as any }))}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all font-bold uppercase text-[10px] tracking-widest",
                      uploadForm.access === level
                        ? "bg-indigo-50 border-indigo-600 text-indigo-700 shadow-md"
                        : "bg-white border-border hover:border-indigo-200 text-muted-foreground"
                    )}
                  >
                    <Lock className={cn("w-5 h-5", uploadForm.access === level ? "text-indigo-600" : "text-muted-foreground/40")} />
                    {level}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                {uploadForm.access === "public" && "Visible to everyone. No approval required for viewing."}
                {uploadForm.access === "restricted" && "Thumbnail and limited preview visible. Full access requires approval."}
                {uploadForm.access === "confidential" && "Highly sensitive. Strictly board-level or archivist-only access."}
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-[#0a1628] uppercase tracking-widest block font-mono">Author Terms & Copyrights</label>
              <Textarea
                placeholder="Enter any specific terms, copyright, or usage restrictions if provided by the donor/creator..."
                value={uploadForm.termsOfUse || ""}
                onChange={e => setUploadForm(p => ({ ...p, termsOfUse: e.target.value }))}
                className="min-h-[120px] bg-slate-50 border-slate-200"
              />
              <p className="text-[10px] text-muted-foreground">This text will be prominently displayed alongside the material record.</p>
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="ghost" onClick={() => { setAccessControlOpen(false); setPreviewOpen(true); }}>Back to Preview</Button>
            <Button onClick={() => { setAccessControlOpen(false); setChecklistMode("select"); setChecklistOpen(true); }} className="gap-2 bg-[#0a1628] hover:bg-[#1a2b4b]">
              Proceed to Metadata Checklist <ChevronRight className="w-4 h-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Metadata Checklist Dialog ═══ */}
      <Dialog open={checklistOpen} onOpenChange={(open) => {
        setChecklistOpen(open);
        if (open) {
          setSelectedChecklistFields(deriveSelectedFieldsFromValues(checklistValues, activeSchema));
        } else {
          setChecklistMode("select");
        }
      }}>
        <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-emerald-500" /> Apply Full Metadata Schema</DialogTitle>
            <DialogDescription>Verify the automatically generated ISAD(G) schema mapping.</DialogDescription>
          </DialogHeader>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 flex gap-4 items-center">
            <div className="flex flex-col gap-1 items-center px-4 border-r border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Access Level</span>
              <Badge className={cn(
                "uppercase text-[10px] font-bold",
                uploadForm.access === "public" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" :
                  uploadForm.access === "restricted" ? "bg-amber-100 text-amber-700 hover:bg-amber-100" :
                    "bg-red-100 text-red-700 hover:bg-red-100"
              )}>{uploadForm.access}</Badge>
            </div>
            <div className="flex-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Assigned Terms</span>
              <p className="text-xs font-semibold text-[#0a1628] line-clamp-2 italic">
                {uploadForm.termsOfUse || "No specific terms assigned."}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setChecklistOpen(false); setAccessControlOpen(true); }} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700">
              Edit
            </Button>
          </div>
          <MetadataChecklist
            mode={checklistMode}
            selectedFields={selectedChecklistFields}
            onToggle={(fieldKey) => setSelectedChecklistFields(prev => {
              const n = new Set(prev);
              n.has(fieldKey) ? n.delete(fieldKey) : n.add(fieldKey);
              return n;
            })}
            onSelectAll={() => setSelectedChecklistFields(new Set(activeSchema || COMBINED_FIELDS.map(f => f.fieldKey)))}
            onClearAll={() => setSelectedChecklistFields(new Set())}
            values={checklistValues}
            onValueChange={(fieldKey, value) => setChecklistValues(prev => ({ ...prev, [fieldKey]: value }))}
            allowedFieldIds={activeSchema}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setChecklistOpen(false); setChecklistMode("select"); }}>Cancel</Button>
            {checklistMode === "select" ? (
              <Button onClick={() => setChecklistMode("fill")} disabled={selectedChecklistFields.size === 0} className="bg-[#0a1628] hover:bg-[#1a2b4b]">
                Preview & save <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={async () => {
                setIngestBusy(true);
                setIngestStage("Preparing ingest payload...");
                // Corrected hierarchy path to use "Departmental Sub-fonds" as requested
                const hierarchyPath = `HCDC > Departmental Sub-fonds > ${uploadForm.subfonds}${uploadForm.program ? ' > ' + uploadForm.program : ''}${uploadForm.series ? ' > ' + uploadForm.series : ''}`;
                const existingApproval = (selectedMaterial as any)?.approvalStatus;
                const approvalStatus = editingMaterialId
                  ? (existingApproval || "approved")
                  : (currentRole === "archivist" ? "pending" : "approved");
                const approvalMeta = approvalStatus === "approved"
                  ? { approvedAt: new Date().toISOString(), approvedBy: me?.name || "Admin" }
                  : {};
                const newMaterial: ArchivalMaterial = {
                  ...selectedMaterial, // if editing
                  id: editingMaterialId || crypto.randomUUID(),
                  uniqueId: checklistValues.referenceCode || generatedRefCode || uploadForm.referenceCode,
                  materialId: checklistValues.referenceCode || generatedRefCode || uploadForm.referenceCode,
                  createdAt: (selectedMaterial as any)?.createdAt || new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  createdBy: (selectedMaterial as any)?.createdBy || (me?.name || (currentRole === "archivist" ? "Archivist" : "Admin")),
                  createdByRole: (selectedMaterial as any)?.createdByRole || currentRole,
                  ...uploadForm,
                  ...checklistValues,
                  pageImages: pdfPreviewBlobs.length > 0 ? pdfPreviewBlobs : pdfPreviewImages,
                  hierarchyPath,
                  access: uploadForm.access,
                  title: checklistValues.title || uploadForm.title,
                  creator: checklistValues.creator || uploadForm.creator,
                  fileUrl: (uploadForm as any).fileData || (uploadForm as any).fileUrl,
                  fileType: (uploadForm as any).fileType || uploadForm.format,
                  ingestDate: (selectedMaterial as any)?.ingestDate || new Date().toISOString(),
                  ingestBy: (selectedMaterial as any)?.ingestBy || (me?.name || (currentRole === "archivist" ? "Archivist" : "Admin")),
                  approvalStatus,
                  ...approvalMeta,
                } as any;

                try {
                  // ═══ FIRESTORE-FIRST: Save to API (Firestore) as the PRIMARY store ═══
                  setIngestStage("Saving metadata to Firestore...");
                  const apiData: any = { ...newMaterial };

                  // Strip non-serializable fields before sending to API
                  delete apiData.fileData;
                  delete apiData.fileId;

                  // Prepare pages for granular upload (bypassing Vercel's 4.5MB limit)
                  const pagesToUpload = apiData.pageImages || [];
                  delete apiData.pageImages;
                  apiData.hasPageImages = pagesToUpload.length > 0;
                  apiData.pageCount = pagesToUpload.length;

                  // Handle main file (with chunking for large files)
                  let mainFileBase64 = "";
                  if (uploadForm.fileData instanceof Blob) {
                    try {
                      const isVideoFile = String(uploadForm.fileData.type || "").startsWith("video/");
                      // Aggressive compression: 0.3MB for docs, 1.0MB for videos
                      const targetSizeMB = isVideoFile ? 1.0 : 0.3;
                      
                      if (isVideoFile) {
                        toast({
                          title: "Compressing Video",
                          description: "Optimizing video for archival storage. This may take a moment...",
                        });
                      } else {
                        setIngestStage("Optimizing document quality...");
                      }

                      const compressed = await compressFile(uploadForm.fileData, targetSizeMB);
                      mainFileBase64 = await fileToBase64(compressed);
                    } catch (err) {
                      console.error("Compression/Base64 conversion failed:", err);
                    }
                  } else if (typeof apiData.fileUrl === 'string' && apiData.fileUrl.length > 1000) {
                    // If it's already a base64 string from a previous scan
                    mainFileBase64 = apiData.fileUrl;
                  }

                  // If main file is large (> 200KB base64), use chunked upload to bypass payload limits
                  if (mainFileBase64.length > 200000) {
                    console.log(`File is large (${mainFileBase64.length} chars). Using chunked upload.`);
                    apiData.fileUrl = "CHUNKED"; // Marker for backend
                    // Ensure NO large base64 is in the main payload
                    delete apiData.compressedFileBase64; 
                    delete (apiData as any).fileData;
                  } else if (mainFileBase64.length > 0) {
                    apiData.fileUrl = mainFileBase64;
                    mainFileBase64 = ""; // Clear so we don't double-upload
                  } else if (typeof apiData.fileUrl === 'object') {
                    // Safety: ensure no Blob/File object accidentally leaks into the JSON payload
                    delete apiData.fileUrl;
                  }

                  // Convert first page thumbnail to base64 for Firestore (for collections display)
                  if (pdfPreviewBlobs.length > 0) {
                    try {
                      const compressedThumb = await compressFile(pdfPreviewBlobs[0], 0.1);
                      const thumbBase64 = await fileToBase64(compressedThumb);
                      apiData.thumbnailUrl = thumbBase64;
                    } catch (err) {
                      console.error("Thumbnail base64 failed:", err);
                    }
                  } else if (pdfPreviewImages.length > 0 && typeof pdfPreviewImages[0] === 'string' && !pdfPreviewImages[0].startsWith('blob:')) {
                    apiData.thumbnailUrl = pdfPreviewImages[0];
                  }



                  // Ensure category mapping for API
                  if (uploadForm.series) {
                    const cat = categories.find(c => c.name === uploadForm.series || c.id === uploadForm.series);
                    if (cat) apiData.categoryId = cat.id;
                  }
                  // Also try subfonds as category fallback
                  if (!apiData.categoryId && uploadForm.subfonds) {
                    const cat = categories.find(c => 
                      c.name === uploadForm.subfonds || 
                      c.id === uploadForm.subfonds || 
                      (c as any).code === uploadForm.subfonds ||
                      (c.name.includes('(' + uploadForm.subfonds + ')') )
                    );
                    if (cat) apiData.categoryId = cat.id;
                  }

                  let supabaseSaved = false;

                  let finalId = editingMaterialId;

                  try {
                    // A. Save main record (Metadata + PDF file)
                    setIngestStage(editingMaterialId ? "Updating existing record..." : "Creating archival record...");
                    if (editingMaterialId) {
                      await updateMaterial({ id: editingMaterialId, data: apiData });
                    } else {
                      const res = await createMaterial({ data: apiData });
                      finalId = (res && res.id) ? res.id : apiData.id;
                      if (finalId) setLastIngestedId(finalId);
                    }

                    // B. Granular Page Uploads (one by one to bypass payload limits)
                    if (finalId && pagesToUpload.length > 0) {
                      setIngestStage(`Uploading ${pagesToUpload.length} page image(s)...`);
                      const pageToast = toast({
                        title: "Uploading Pages",
                        description: `Saving ${pagesToUpload.length} pages to Supabase...`,
                      });

                      let failedPages = 0;
                      for (let i = 0; i < pagesToUpload.length; i++) {
                        let pageData = pagesToUpload[i];
                        if (pageData instanceof Blob) {
                          // Ultra-aggressive for page previews (150KB per page)
                          const compressedPage = await compressFile(pageData, 0.15);
                          pageData = await fileToBase64(compressedPage);
                        }
                        try {
                          await uploadPageMutation.mutateAsync({
                            materialId: finalId,
                            pageIndex: i,
                            data: pageData
                          });
                        } catch {
                          failedPages += 1;
                        }
                      }

                      pageToast.update({
                        id: pageToast.id,
                        title: failedPages > 0 ? "Upload Partially Complete" : "Upload Complete",
                        description: failedPages > 0
                          ? `${pagesToUpload.length - failedPages}/${pagesToUpload.length} pages saved.`
                          : `All ${pagesToUpload.length} pages saved to Supabase.`,
                      });
                    }

                    // C. Chunked Main File Upload (if it was too large for the initial payload)
                    if (finalId && mainFileBase64.length > 0) {
                      setIngestStage("Uploading large document in chunks...");
                      const chunkToast = toast({
                        title: "Uploading Document",
                        description: "Large document detected. Uploading in chunks...",
                      });

                      const chunkSize = 200000;
                      const totalChunks = Math.ceil(mainFileBase64.length / chunkSize);

                      for (let i = 0; i < totalChunks; i++) {
                        const chunk = mainFileBase64.substring(i * chunkSize, (i + 1) * chunkSize);
                        await uploadFileChunkMutation.mutateAsync({
                          materialId: finalId,
                          chunkIndex: i,
                          totalChunks,
                          data: chunk
                        });
                      }

                      chunkToast.update({
                        id: chunkToast.id,
                        title: "Document Uploaded",
                        description: "Large document successfully saved to Supabase.",
                      });
                    }

                    supabaseSaved = true;
                    toast({
                      title: editingMaterialId ? "Material Updated" : "Ingestion Successful",
                      description: editingMaterialId ? "Changes saved to Supabase." : "Material and all pages saved to Supabase.",
                    });
                  } catch (apiErr: any) {
                    console.error("Supabase Save Failed:", apiErr);
                    
                    // Extract rich error info from backend hint
                    const errorMsg = (apiErr as any)?.response?.data?.message || apiErr?.message || "Cloud sync failed";
                    const errorHint = (apiErr as any)?.response?.data?.hint || "";
                    const errorCode = (apiErr as any)?.response?.data?.code || (apiErr as any)?.code;

                    toast({
                      variant: "destructive",
                      title: errorCode === "23505" ? "ID Conflict" : "Ingestion Failed",
                      description: errorCode === "23505" 
                        ? `A material with this Reference Code already exists. Please change the Material No. and try again.`
                        : `Error: ${errorMsg}. ${errorHint ? '\nHint: ' + errorHint : ''}`,
                    });
                    setIngestBusy(false);
                    return; // Stop here — do NOT save to local storage
                  }

                  // ═══ NO LOCAL FALLBACK ═══
                  // Removed saveMaterial(newMaterial) to enforce Firestore-only ingestion

                  // Clear filters after successful ingest to make it visible
                  if (!editingMaterialId) {
                    setSelectedHierarchyItem(null);
                    setSearch("");
                    setCurrentPage(1);
                  }

                  const hierarchyLabel = hierarchyPath || "Unassigned";
                  const actionType = editingMaterialId
                    ? "edit"
                    : (approvalStatus === "pending" ? "submit" : "upload");
                  const actionLabel = editingMaterialId
                    ? "Updated"
                    : (approvalStatus === "pending" ? "Submitted for approval" : "Ingested");
                  addActivity({
                    user: me?.name || "Admin",
                    actionType,
                    description: `${actionLabel} material: ${newMaterial.title} (Hierarchy: ${hierarchyLabel})`,
                    materialId: newMaterial.uniqueId
                  });

                  if (approvalStatus === "pending") {
                    setIngestStage("Submitting approval request...");
                    submitIngestRequest({
                      data: {
                        materialId: newMaterial.uniqueId,
                        materialTitle: newMaterial.title || newMaterial.uniqueId,
                        hierarchyPath,
                        requestedBy: me?.name || "Archivist",
                        requestedAt: new Date().toISOString(),
                      }
                    });
                    // Still do local fallback update
                    addIngestRequest({
                      id: newMaterial.id,
                      materialId: newMaterial.uniqueId,
                      materialTitle: newMaterial.title || newMaterial.uniqueId,
                      hierarchyPath,
                      requestedBy: me?.name || "Archivist",
                      requestedAt: new Date().toISOString(),
                      status: "pending",
                    });
                  }

                  const toastTitle = editingMaterialId
                    ? "Updated"
                    : (approvalStatus === "pending" ? "Submitted for Approval" : "Ingestion Confirmed");
                  const toastDesc = supabaseSaved
                    ? (approvalStatus === "pending"
                      ? "Material saved to Supabase and pending admin approval."
                      : "Material saved to Supabase and published successfully.")
                    : "Saved locally. Supabase sync will retry on next refresh.";

                  toast({
                    title: toastTitle,
                    description: toastDesc,
                    variant: supabaseSaved ? "default" : "destructive"
                  });

                  if (!editingMaterialId) {
                    setSuccessDialogOpen(true);
                  }

                  setChecklistOpen(false);
                  setEditingMaterialId(null);
                } catch (e) {
                  toast({ title: "Storage Error", description: "Failed to store material data.", variant: "destructive" });
                } finally {
                  setIngestBusy(false);
                }
              }} className="bg-emerald-600 hover:bg-emerald-700" disabled={isCreating || isUpdating}>
                {(isCreating || isUpdating) ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  editingMaterialId ? "Update Item" : "Finalize Ingest"
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={ingestBusy} onOpenChange={(open) => { if (!ingestBusy) setIngestBusy(open); }}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#0a1628]">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
              Ingesting Material
            </DialogTitle>
            <DialogDescription>
              Please keep this tab open while we save files and metadata.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
            <p className="text-sm font-semibold text-indigo-800">{ingestStage}</p>
            <p className="text-xs text-indigo-600 mt-1">This may take longer for large files and multi-page documents.</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ Successful Ingest Modal ═══ */}
      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Ingestion successful</DialogTitle>
            <DialogDescription>Archival material was saved and indexed successfully.</DialogDescription>
          </DialogHeader>
          <div className="bg-emerald-600 h-2 w-full" />
          <div className="p-8 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-inner animate-in zoom-in-50 duration-500">
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <CheckCircle className="w-10 h-10 text-emerald-600" />
              </motion.div>
            </div>

            <h2 className="text-2xl font-bold text-[#0a1628] mb-2 font-display">
              {currentRole === "archivist" ? "Submission Received" : "Ingestion Successful"}
            </h2>
            <p className="text-muted-foreground mb-8 text-sm leading-relaxed px-4">
              {currentRole === "archivist" 
                ? "Your archival material has been uploaded successfully and is currently pending administrator review. It will be published once approved."
                : "Your archival material has been successfully processed and secured in the repository. The record is now indexed and available for management."}
            </p>

            <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-8 flex items-center gap-4 text-left">
              <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                <Barcode value={checklistValues.referenceCode || generatedRefCode || "SIP-AIP-PENDING"} className="w-6 h-6 text-slate-400" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Material Identifier</span>
                <span className="text-sm font-mono font-bold text-indigo-600 truncate block">
                  {checklistValues.referenceCode || generatedRefCode || "SIP-AIP-PENDING"}
                </span>
              </div>
            </div>

            <div className="flex flex-col w-full gap-3">
              <Button
                onClick={() => setSuccessDialogOpen(false)}
                className="bg-[#0a1628] hover:bg-[#1a2b4b] h-12 rounded-xl text-white font-bold shadow-lg shadow-blue-900/10 transition-all active:scale-[0.98]"
              >
                Go to Records Dashboard
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSuccessDialogOpen(false);
                  setUploadOpen(true);
                  // Reset form for next ingest
                  setUploadForm({
                    title: "", creator: "", dateOfDescription: "", format: "", description: "",
                    levelOfDescription: "Item", extentAndMedium: "", access: "public",
                    videoUrl: "", hierarchyPath: "", termsOfUse: "", referenceCode: "",
                    fileData: undefined, fileType: "", year: "26", catNo: "01", matNo: String(materials.length + 2).padStart(7, '0'),
                    fonds: "HCDC", subfonds: "", program: "", series: ""
                  });
                }}
                className="h-12 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all active:scale-[0.98]"
              >
                Ingest Another Material
              </Button>
            </div>
          </div>
          <div className="p-4 bg-emerald-50/50 border-t border-emerald-100 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">AIP Integrity Verified</span>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" /> Confirm Deletion
            </DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to delete this archival material? This action is permanent and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)} disabled={isDeletingMat}>Cancel</Button>
            <Button
              className="bg-red-600 text-white hover:bg-red-700 font-medium border-0"
              onClick={confirmDeleteMaterial}
              disabled={isDeletingMat}
            >
              {isDeletingMat ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Permanently"
              )}
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
            <button title="Options" className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors">
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
    <div className="animate-in fade-in slide-in-from-right-4 duration-300 bg-white p-6 pb-24 rounded-xl border shadow-sm col-span-3 min-h-screen">
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
        {isOAIS && <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-200 uppercase font-bold px-1.5 py-0.5 inline-flex items-center gap-1"><ShieldCheck className="w-2.5 h-2.5" /> OAIS Aligned</Badge>}
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
                        onChange={e => setEditMap({ ...editMap, [field.code]: e.target.value })}
                        onKeyDown={e => { if (e.key === "Enter") setEditingFieldCode(null); if (e.key === "Escape") { setEditMap({ ...editMap, [field.code]: value || "" }); setEditingFieldCode(null); } }}
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
                    <button onClick={() => { setEditingFieldCode(field.code); setEditMap({ ...editMap, [field.code]: value || "" }); }} className="absolute right-[112px] opacity-0 group-hover:opacity-100 p-1.5 rounded bg-muted hover:bg-[#4169E1] hover:text-white transition-all text-muted-foreground" title="Inline Edit">
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
