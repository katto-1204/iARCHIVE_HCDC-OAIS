import * as React from "react";
import { useRoute, Link } from "wouter";
import { format } from "date-fns";
import {
  FileText, Lock, ArrowLeft, CheckCircle,
  ZoomIn, ZoomOut, RotateCcw, Maximize2, ExternalLink,
  Database, HardDrive, Calendar, User, Tag, BookOpen, AlertTriangle, Edit,
  ChevronLeft, ChevronRight, X
} from "lucide-react";
import { useGetMe, useGetAccessRequests } from "@workspace/api-client-react";
import { getMaterialById, loadMaterial } from "@/data/storage";

function Field({ label, value }: { label: string; value?: string | number | null }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-[180px_1fr] gap-4 py-3 border-b border-border/50 last:border-0">
      <dt className="text-sm text-muted-foreground font-medium">{label}</dt>
      <dd className="text-sm text-foreground font-normal">{value}</dd>
    </div>
  );
}

function IsadSection({ num, title, children }: { num: number; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-3">
        <span className="inline-flex items-center gap-1.5 bg-[#0a1628] text-white text-xs font-bold px-2.5 py-1 rounded-md">
          ISAD(G) {num}
        </span>
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{title}</span>
      </div>
      <dl className="bg-white rounded-xl border border-border/60">{children}</dl>
    </div>
  );
}

/* ═══ Multi-Page Document Viewer ═══ */
function PageViewer({ 
  materialId,
  pages, 
  pageImages, 
  title,
  isRestricted,
  canAccess 
}: { 
  materialId: string;
  pages?: number; 
  pageImages?: string[]; 
  title: string;
  isRestricted: boolean;
  canAccess: boolean;
}) {
  const [currentPage, setCurrentPage] = React.useState(0);
  const [showFullscreen, setShowFullscreen] = React.useState(false);
  const images = pageImages || [];
  const totalDisplayPages = images.length;
  
  // Restricted: preview 3 pages, then on the 4th blur and show request access
  const maxVisiblePages = (!canAccess && isRestricted) ? Math.min(4, totalDisplayPages) : totalDisplayPages;
  const visibleImages = images.slice(0, maxVisiblePages);
  
  const goTo = (idx: number) => {
    if (idx >= 0 && idx < maxVisiblePages) setCurrentPage(idx);
  };

  if (totalDisplayPages === 0) return null;

  return (
    <>
      <div className="bg-white rounded-2xl border border-border/60 overflow-hidden shadow-sm">
        {/* Viewer Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/60 bg-muted/10">
          <div className="flex items-center gap-3">
            <span className="bg-[#0a1628] text-white text-xs font-bold px-2.5 py-1 rounded">Document Viewer</span>
            <span className="text-xs text-muted-foreground font-medium">
              Page {currentPage + 1} of {maxVisiblePages}{pages ? ` (${pages} total)` : ''}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowFullscreen(true)} className="w-8 h-8 rounded-lg border border-border hover:bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Page Display */}
        <div className="relative bg-[#f0f0f4]">
          {/* Cover Page (page 0) = larger */}
          <div className="relative flex items-center justify-center min-h-[420px] max-h-[600px] overflow-hidden">
            <img 
              src={visibleImages[currentPage]} 
              alt={`${title} - Page ${currentPage + 1}`} 
              className={`max-h-[580px] w-full object-cover transition-all duration-500 ${!canAccess && isRestricted && currentPage === 3 ? 'blur-md opacity-70' : ''}`}
              style={{ objectPosition: 'top' }}
            />
            
            {/* Page label */}
            <div className="absolute top-3 left-3 bg-black/60 text-white text-[10px] px-3 py-1 rounded-lg font-bold backdrop-blur-sm">
              {currentPage === 0 ? "Cover Page" : `Page ${currentPage + 1}`}
            </div>

            {/* Restricted overlay on 4th page (index 3) */}
            {!canAccess && isRestricted && currentPage === 3 && (
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/60 to-white flex flex-col items-center justify-end pb-10 z-10">
                <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-border/60 p-8 max-w-md text-center mx-4 animate-fade-in-up">
                  <div className="w-14 h-14 rounded-full bg-[#960000]/10 flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-7 h-7 text-[#960000]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#0a1628] mb-2">Restricted Content</h3>
                  <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                    You've reached the preview limit. This material requires authorized access to view all {pages || totalDisplayPages} pages.
                  </p>
                  <Link 
                    href={`/request-access?materialId=${encodeURIComponent(materialId)}&title=${encodeURIComponent(title)}`}
                  >
                    <button className="w-full bg-[#960000] hover:bg-[#7a0000] text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg">
                      <Lock className="w-4 h-4" /> Request Access to Continue
                    </button>
                  </Link>
                </div>
              </div>
            )}

            {/* Navigation Arrows */}
            {currentPage > 0 && (
              <button 
                onClick={() => goTo(currentPage - 1)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-lg border border-border/60 flex items-center justify-center hover:bg-white transition-all z-20 group"
              >
                <ChevronLeft className="w-5 h-5 text-[#0a1628] group-hover:text-[#4169E1]" />
              </button>
            )}
            {currentPage < maxVisiblePages - 1 && (!isRestricted || canAccess || currentPage < 3) && (
              <button 
                onClick={() => goTo(currentPage + 1)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-lg border border-border/60 flex items-center justify-center hover:bg-white transition-all z-20 group"
              >
                <ChevronRight className="w-5 h-5 text-[#0a1628] group-hover:text-[#4169E1]" />
              </button>
            )}
          </div>

          {/* Thumbnail Strip */}
          <div className="border-t border-border/60 bg-white px-4 py-3">
            <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
              {visibleImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => goTo(idx)}
                  className={`relative shrink-0 w-16 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                    currentPage === idx 
                      ? 'border-[#4169E1] shadow-md ring-2 ring-[#4169E1]/20' 
                      : 'border-border/40 hover:border-[#4169E1]/40 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[8px] font-bold text-center py-0.5">
                    {idx === 0 ? 'Cover' : idx + 1}
                  </div>
                  {/* Locked indicator for restricted pages beyond limit */}
                  {!canAccess && isRestricted && idx === maxVisiblePages - 1 && idx < totalDisplayPages - 1 && (
                    <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                      <Lock className="w-3 h-3 text-[#960000]" />
                    </div>
                  )}
                </button>
              ))}
              {/* Show locked placeholder thumbnails for restricted content */}
              {!canAccess && isRestricted && totalDisplayPages > maxVisiblePages && (
                <>
                  {Array.from({ length: Math.min(3, totalDisplayPages - maxVisiblePages) }).map((_, idx) => (
                    <div
                      key={`locked-${idx}`}
                      className="shrink-0 w-16 h-20 rounded-lg border-2 border-dashed border-[#960000]/30 bg-[#960000]/5 flex flex-col items-center justify-center gap-1"
                    >
                      <Lock className="w-3 h-3 text-[#960000]/50" />
                      <span className="text-[7px] font-bold text-[#960000]/50 uppercase">Locked</span>
                    </div>
                  ))}
                  {totalDisplayPages - maxVisiblePages > 3 && (
                    <div className="shrink-0 w-16 h-20 rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/20 flex items-center justify-center">
                      <span className="text-[9px] font-bold text-muted-foreground/50">+{totalDisplayPages - maxVisiblePages - 3}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {showFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
          <div className="flex items-center justify-between px-6 py-4">
            <span className="text-white/80 text-sm font-medium">
              {title} — Page {currentPage + 1} of {maxVisiblePages}
            </span>
            <button onClick={() => setShowFullscreen(false)} className="text-white/60 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center relative px-16">
            <img 
              src={visibleImages[currentPage]} 
              alt={`${title} - Page ${currentPage + 1}`} 
              className="max-h-[85vh] max-w-full object-contain"
            />
            {currentPage > 0 && (
              <button onClick={() => goTo(currentPage - 1)} className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
            )}
            {currentPage < maxVisiblePages - 1 && (!isRestricted || canAccess || currentPage < 3) && (
              <button onClick={() => goTo(currentPage + 1)} className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            )}
          </div>
          <div className="flex justify-center gap-2 px-6 py-4 overflow-x-auto">
            {visibleImages.map((img, idx) => (
              <button key={idx} onClick={() => goTo(idx)} className={`shrink-0 w-14 h-18 rounded-md overflow-hidden border-2 transition-all ${currentPage === idx ? 'border-white shadow-lg' : 'border-white/20 opacity-50 hover:opacity-80'}`}>
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

/* ═══ Request Access Modal (inline) ═══ */
function RestrictedAccessModal({ 
  isOpen, 
  onClose, 
  material 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  material: any 
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#960000] p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 -mr-10 -mt-10 rounded-full bg-white/10 blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Access Required</h3>
                <p className="text-white/70 text-xs">This material is restricted</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Body */}
        <div className="p-6">
          <h4 className="font-bold text-[#0a1628] mb-1">{material.title}</h4>
          <p className="text-sm text-muted-foreground mb-4">{material.uniqueId}</p>
          
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-amber-800 font-semibold mb-1">Preview Limit Reached</p>
                <p className="text-xs text-amber-700/80 leading-relaxed">
                  You've viewed the maximum number of preview pages for this restricted material. 
                  To view all {material.pages || 'remaining'} pages, please submit an access request for archivist review.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={onClose} 
              className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted/50 transition-colors"
            >
              Close
            </button>
            <Link 
              href={`/request-access?materialId=${encodeURIComponent(material.id)}&title=${encodeURIComponent(material.title)}&date=${encodeURIComponent(material.date ?? "")}&cover=${encodeURIComponent(material.thumbnailUrl ?? "")}`}
              className="flex-1"
            >
              <button className="w-full px-4 py-2.5 rounded-xl bg-[#960000] text-white text-sm font-semibold hover:bg-[#7a0000] transition-colors flex items-center justify-center gap-2">
                <Lock className="w-4 h-4" /> Request Access
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MaterialDetail() {
  const [, params] = useRoute("/materials/:id");
  const [material, setMaterial] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (params?.id) {
      loadMaterial(params.id).then((hydratedMat) => {
        setMaterial(hydratedMat);
        setIsLoading(false);
      }).catch(e => {
        console.error("Failed to load material", e);
        setMaterial(getMaterialById(params!.id));
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, [params?.id]);

  const { data: user } = useGetMe();
  const { data: requests } = useGetAccessRequests({ status: "approved" });
  const [activeTab, setActiveTab] = React.useState<"details" | "dc" | "related">("details");

  const [showAccessModal, setShowAccessModal] = React.useState(false);

  const isApproved = requests?.requests?.some((r: any) => r.materialId === params?.id);

  const fmt = (d?: string | null) => {
    if (!d) return null;
    try { return format(new Date(d), "yyyy-MM-dd"); } catch { return d; }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f7f8fc] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#4169E1] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Loading material...</p>
        </div>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="min-h-screen bg-[#f7f8fc] flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Material Not Found</h2>
          <p className="text-muted-foreground mb-6">Record ID: <span className="font-mono text-xs">{params?.id}</span></p>
          <Link href="/collections">
            <button className="bg-[#4169E1] text-white font-semibold px-6 py-2.5 rounded-lg text-sm hover:bg-[#3558c8] transition-colors">
              Back to Collections
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const accessBadge = {
    public: { label: "PUBLIC", className: "bg-[#4169E1]/10 text-[#4169E1] border border-[#4169E1]/20" },
    restricted: { label: "RESTRICTED", className: "bg-amber-50 text-amber-700 border border-amber-200" },
    confidential: { label: "CONFIDENTIAL", className: "bg-[#960000]/10 text-[#960000] border border-[#960000]/20" },
  }[material.access as "public" | "restricted" | "confidential"] ?? { label: material.access?.toUpperCase() || "", className: "bg-muted text-muted-foreground border border-border" };

  const fixityVerified = material.fixityStatus === "verified" || material.sha256;
  const canViewDetail = material.access === "public" || user?.role === "admin" || user?.role === "archivist" || !!isApproved;
  const isRestricted = material.access === "restricted" || material.access === "confidential";
  const canAccessFull = material.access === "public" || user?.role === "admin" || user?.role === "archivist" || !!isApproved;

  return (
    <div className="min-h-screen bg-[#f7f8fc] font-sans">
      {/* ─── TOP NAV ─── */}
      <header className="bg-white border-b border-border/70 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-[#4169E1] flex items-center justify-center">
              <Database className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-[#0a1628]">iArchive</span>
          </div>
          <Link href="/collections">
            <button className="flex items-center gap-2 text-sm font-semibold text-foreground border border-border px-4 py-2 rounded-lg hover:bg-muted/50 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </Link>
        </div>
      </header>

      {/* ─── BREADCRUMB ─── */}
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>›</span>
          <Link href="/collections" className="hover:text-foreground transition-colors">Collections</Link>
          <span>›</span>
          <span className="text-foreground font-medium truncate max-w-xs">{material.title}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              const headers = ["Field", "Value"];
              const rows = Object.entries(material).filter(([k,v]) => typeof v === 'string' || typeof v === 'number').map(([k,v]) => [k, v]);
              const csvContent = [headers.join(","), ...rows.map(r => `"${r[0]}","${String(r[1]).replace(/\n/g, ' ')}"`)].join("\n");
              const blob = new Blob([csvContent], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = `metadata_${material.uniqueId}.csv`;
              link.click();
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 transition-all"
          >
            <FileText className="w-3.5 h-3.5" /> Download Metadata
          </button>
          {(user?.role === "admin" || user?.role === "archivist") && (
            <Link href={`/admin/collections`}>
              <button className="flex items-center gap-1.5 text-xs font-bold text-[#4169E1] hover:text-[#3558c8] bg-[#4169E1]/10 px-3 py-1.5 rounded-lg border border-[#4169E1]/20 transition-all">
                <Edit className="w-3.5 h-3.5" /> Edit in Admin
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">

          {/* ─── LEFT PANEL ─── */}
          <div className="space-y-5">
            {/* Multi-Page Document Viewer */}
            {true ? (
              <PageViewer
                materialId={material.id}
                pages={material.pages || 4}
                pageImages={material.pageImages && material.pageImages.length > 0 ? material.pageImages : [
                  "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&auto=format&fit=crop",
                  "https://images.unsplash.com/photo-1616628188550-808682f392ce?w=800&auto=format&fit=crop",
                  "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop",
                  "https://images.unsplash.com/photo-1586281380117-5a60ae2050cc?w=800&auto=format&fit=crop"
                ]}
                title={material.title}
                isRestricted={isRestricted}
                canAccess={canAccessFull}
              />
            ) : (
              /* Fallback: Only for standalone images or odd formats */
              <div className="bg-white rounded-2xl border border-border/60 overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-5 py-3 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#0a1628] text-white text-xs font-bold px-2.5 py-1 rounded">OAIS AIP</span>
                    <span className="text-xs font-mono text-muted-foreground">{material.aipId || "AIP-0000-0001"}</span>
                  </div>
                  {fixityVerified && (
                    <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Checksum Verified
                    </div>
                  )}
                </div>
                <div className="h-72 bg-[#f7f8fc] flex flex-col items-center justify-center relative">
                  {material.thumbnailUrl ? (
                    <img src={material.thumbnailUrl} alt={material.title} className="max-h-full max-w-full object-contain" />
                  ) : (
                    <div className="text-center">
                      <div className="w-24 h-28 bg-white border-2 border-border rounded-lg shadow-md flex items-center justify-center mx-auto mb-4 relative">
                        <FileText className="w-10 h-10 text-[#4169E1]/30" />
                        <div className="absolute top-2 right-2 w-3 h-3 bg-[#960000]/20 rounded-sm" />
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#4169E1]/20 rounded-b" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">{material.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 font-mono">{material.format || "application/pdf"}</p>
                    </div>
                  )}
                </div>
                <div className="border-t border-border/60 px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {[{ icon: ZoomIn }, { icon: ZoomOut }, { icon: RotateCcw }, { icon: Maximize2 }].map(({ icon: Icon }, i) => (
                      <button key={i} className="w-9 h-9 rounded-lg border border-border hover:bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                        <Icon className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
                  {material.pages && (
                    <span className="text-sm text-muted-foreground font-medium">{material.pages} pages</span>
                  )}
                </div>
              </div>
            )}

            {/* OAIS Preservation Info */}
            <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-border/60 flex items-center gap-3">
                <span className="bg-[#0a1628] text-white text-xs font-bold px-2.5 py-1 rounded">OAIS</span>
                <span className="text-sm font-bold text-foreground">ISO 14721:2012 — Preservation Information</span>
              </div>
              <div className="p-5 grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: "SIP", value: material.sipId || "SIP-0000-001", sub: "Submission Information Package", mono: true },
                  { label: "AIP", value: material.aipId || "AIP-0000-001", sub: "Archival Information Package", mono: true },
                  { label: "INGEST", value: fmt(material.ingestDate) || "—", sub: material.ingestBy ? `By ${material.ingestBy}` : "Ingest date", mono: false },
                  { label: "FIXITY", value: fixityVerified ? "✓ Verified" : "Pending", sub: material.sha256 ? "SHA-256 checksum valid" : "Not yet computed", isGreen: fixityVerified, mono: false },
                  { label: "FORMAT", value: material.format || "—", sub: "MIME type", mono: false },
                  { label: "CAPTURE", value: material.scanner || "—", sub: material.resolution ? `${material.resolution} DPI` : "Capture device", mono: false },
                ].map((item, i) => (
                  <div key={i} className="bg-[#f7f8fc] rounded-xl p-4 border border-border/40">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{item.label}</p>
                    <p className={`text-sm font-bold mb-0.5 ${item.isGreen ? "text-emerald-600" : "text-[#4169E1]"} ${item.mono ? "font-mono" : ""}`}>
                      {item.value}
                    </p>
                    <p className="text-xs text-muted-foreground">{item.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Related Items */}
            {material.relatedItems && material.relatedItems.length > 0 && (
              <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-6">
                <h3 className="text-base font-bold text-foreground mb-4">Related Items</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {material.relatedItems.map((rel: any) => (
                    <Link key={rel.id} href={`/materials/${rel.id}`}>
                      <div className="flex items-center gap-3 p-4 border border-border/60 rounded-xl hover:border-[#4169E1]/30 hover:bg-[#4169E1]/5 transition-all cursor-pointer group">
                        <div className="w-9 h-9 bg-muted rounded-lg flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-semibold text-foreground group-hover:text-[#4169E1] transition-colors truncate">{rel.title}</p>
                          <p className="text-xs text-muted-foreground">{rel.categoryName} · {rel.date ? fmt(rel.date) : "—"}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ─── RIGHT PANEL ─── */}
          <div className="space-y-5">
            {/* Title card - sticky */}
            <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-6 lg:sticky lg:top-20">
              <div className="flex flex-wrap gap-2 mb-4">
                {material.categoryName && (
                  <span className="bg-[#0a1628] text-white text-xs font-bold px-3 py-1 rounded-md uppercase tracking-wide">
                    {material.categoryName}
                  </span>
                )}
                <span className={`text-xs font-bold px-3 py-1 rounded-md uppercase tracking-wide ${accessBadge.className}`}>
                  {accessBadge.label}
                </span>
                <span className="bg-muted text-muted-foreground text-xs font-medium px-3 py-1 rounded-md capitalize">
                  {material.status}
                </span>
              </div>

              <h1 className="text-2xl font-bold text-[#0a1628] mb-5 leading-snug">{material.title}</h1>

              {/* NEW: TERMS OF USE STICKY VISIBLE */}
              {(material as any).termsOfUse && (
                <div className="bg-[#f7f8fc] border border-border/60 rounded-xl p-4 mb-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-4 h-4 text-[#4169E1]" />
                    <h3 className="text-sm font-bold text-[#0a1628] uppercase tracking-wide">Terms of Use</h3>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed font-medium whitespace-pre-wrap">
                    {(material as any).termsOfUse}
                  </p>
                </div>
              )}

              {/* Tabs */}
              <div className="border-b border-border/60 mb-5">
                <div className="flex gap-1">
                  {(["details", "dc", "related"] as const).map((tab) => {
                    const labels = { details: "Details", dc: "Dublin Core", related: "Related Items" };
                    return (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${activeTab === tab
                          ? "border-[#4169E1] text-[#4169E1]"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {labels[tab]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tab: ISAD(G) Details */}
              {activeTab === "details" && (
                <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
                  <IsadSection num={1} title="IDENTITY STATEMENT">
                    <div className="px-5 divide-y divide-border/50">
                      <Field label="Ref. Code" value={material.materialId} />
                      <Field label="Title" value={material.title} />
                      <Field label="Alt. Title" value={material.altTitle} />
                      <Field label="Date" value={fmt(material.date)} />
                      <Field label="Level" value="Item" />
                      <Field label="Extent" value={material.pages ? `${material.pages} pages` : material.fileSize ? `${material.fileSize}` : undefined} />
                    </div>
                  </IsadSection>
                  <IsadSection num={2} title="CONTEXT">
                    <div className="px-5 divide-y divide-border/50">
                      <Field label="Creator" value={material.creator} />
                      <Field label="Publisher" value={material.publisher} />
                      <Field label="Contributor" value={material.contributor} />
                      <Field label="Archival History" value={material.archivalHistory} />
                      <Field label="Custodial History" value={material.custodialHistory} />
                    </div>
                  </IsadSection>
                  <IsadSection num={3} title="CONTENT & STRUCTURE">
                    <div className="px-5 divide-y divide-border/50">
                      <Field label="Scope & Content" value={material.scopeContent} />
                      <Field label="Arrangement" value={material.arrangement} />
                      <Field label="Description" value={material.description} />
                      <Field label="Language" value={material.language} />
                      <Field label="Format" value={material.format} />
                    </div>
                  </IsadSection>
                  <IsadSection num={4} title="ACCESS & USE">
                    <div className="px-5 divide-y divide-border/50">
                      <Field label="Access Level" value={material.access} />
                      <Field label="Rights" value={material.rights} />
                      <Field label="Physical Location" value={material.physicalLocation} />
                      <Field label="Physical Condition" value={material.physicalCondition} />
                    </div>
                  </IsadSection>
                </div>
              )}

              {/* Tab: Dublin Core */}
              {activeTab === "dc" && (
                <div className="max-h-[55vh] overflow-y-auto pr-1">
                  <dl className="bg-[#f7f8fc] rounded-xl border border-border/60 divide-y divide-border/50">
                    <div className="px-5"><Field label="dc:title" value={material.title} /></div>
                    <div className="px-5"><Field label="dc:creator" value={material.creator} /></div>
                    <div className="px-5"><Field label="dc:subject" value={material.subject} /></div>
                    <div className="px-5"><Field label="dc:description" value={material.description} /></div>
                    <div className="px-5"><Field label="dc:publisher" value={material.publisher} /></div>
                    <div className="px-5"><Field label="dc:contributor" value={material.contributor} /></div>
                    <div className="px-5"><Field label="dc:date" value={fmt(material.date)} /></div>
                    <div className="px-5"><Field label="dc:type" value={material.type || "Text"} /></div>
                    <div className="px-5"><Field label="dc:format" value={material.format} /></div>
                    <div className="px-5"><Field label="dc:identifier" value={material.identifier || material.materialId} /></div>
                    <div className="px-5"><Field label="dc:source" value={material.source} /></div>
                    <div className="px-5"><Field label="dc:language" value={material.language} /></div>
                    <div className="px-5"><Field label="dc:relation" value={material.relation} /></div>
                    <div className="px-5"><Field label="dc:coverage" value={material.coverage} /></div>
                    <div className="px-5"><Field label="dc:rights" value={material.rights} /></div>
                  </dl>
                </div>
              )}

              {/* Tab: Related */}
              {activeTab === "related" && (
                <div className="max-h-[55vh] overflow-y-auto space-y-3 pr-1">
                  {(material.relatedItems?.length ?? 0) === 0 ? (
                    <div className="text-center py-10">
                      <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">No related items found.</p>
                    </div>
                  ) : (
                    material.relatedItems?.map((rel: any) => (
                      <Link key={rel.id} href={`/materials/${rel.id}`}>
                        <div className="flex items-center gap-3 p-3.5 border border-border/60 rounded-xl hover:border-[#4169E1]/40 hover:bg-[#4169E1]/5 transition-all cursor-pointer group">
                          <div className="w-9 h-9 bg-muted rounded-lg flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold group-hover:text-[#4169E1] transition-colors">{rel.title}</p>
                            <p className="text-xs text-muted-foreground">{rel.categoryName} · {fmt(rel.date) || "—"}</p>
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              )}

              {/* Access Request / Info Section (Download Removed) */}
              <div className="mt-5 pt-5 border-t border-border/60">
                {!canViewDetail && (
                  <Link
                    href={`/request-access?materialId=${encodeURIComponent(material.id)}&title=${encodeURIComponent(material.title)}&date=${encodeURIComponent(material.date ?? "")}&cover=${encodeURIComponent(material.thumbnailUrl ?? "")}`}
                  >
                    <button className="w-full bg-[#960000] hover:bg-[#7a0000] text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2">
                      <Lock className="w-5 h-5" /> Request Access
                    </button>
                  </Link>
                )}
                {canViewDetail && (
                   <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      <div>
                        <p className="text-sm text-emerald-800 font-semibold mb-0.5">Authorized for Full Access</p>
                        <p className="text-xs text-emerald-700/80">You have been granted full interactive viewing rights for this material.</p>
                      </div>
                   </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Restricted Access Modal */}
      <RestrictedAccessModal 
        isOpen={showAccessModal} 
        onClose={() => setShowAccessModal(false)} 
        material={material} 
      />
    </div>
  );
}
