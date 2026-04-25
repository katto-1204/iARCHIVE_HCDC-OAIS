import * as React from "react";
import { useRoute, Link } from "wouter";
import { format } from "date-fns";
import { PublicNavbar } from "@/components/PublicNavbar";
import { 
  FileText, Lock, ArrowLeft, CheckCircle, 
  ZoomIn, ZoomOut, RotateCcw, Maximize2, ExternalLink,
  Database, HardDrive, Calendar, User, Tag, BookOpen, AlertTriangle, Edit,
  ChevronLeft, ChevronRight, X, Eye, Maximize, Hand, Move
} from "lucide-react";
import { useGetMe, useGetAccessRequests, useGetMaterial } from "../lib/api-client-react";
import { getMaterialById } from "@/data/storage";

function Field({ label, value }: { label: string; value?: string | number | null }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-[auto_1fr] gap-3 py-3 border-b border-border/50 last:border-0">
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

/* ═══ Multi-Page Media Viewer ═══ */
function MediaViewer({ 
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
  
  // Zoom & Pan State
  const [zoom, setZoom] = React.useState(1);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = React.useState(false);
  const [startPoint, setStartPoint] = React.useState({ x: 0, y: 0 });
  
  const containerRef = React.useRef<HTMLDivElement>(null);
  const images = pageImages || [];
  const totalPages = pages || images.length;
  const loadedPagesCount = images.length;
  
  // Rule A & B: Restriction Logic
  let maxVisiblePages = loadedPagesCount;
  if (!canAccess && isRestricted) {
    if (totalPages > 10) {
      maxVisiblePages = 3;
    } else if (totalPages <= 5) {
      maxVisiblePages = 2;
    } else {
      // For 6-10 pages, let's assume 3 as well or follow a pattern. 
      // User only specified >10 and <=5. I'll stick to those strictly.
      maxVisiblePages = 3; 
    }
  }
  
  const visibleImages = images.slice(0, maxVisiblePages);
  
  const handleZoom = (delta: number) => {
    setZoom(prev => Math.min(Math.max(0.5, prev + delta), 3));
  };

  const handleReset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      handleZoom(delta);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsPanning(true);
    setStartPoint({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setOffset({
      x: e.clientX - startPoint.x,
      y: e.clientY - startPoint.y
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          handleZoom(0.25);
        } else if (e.key === '-') {
          e.preventDefault();
          handleZoom(-0.25);
        } else if (e.key === '0') {
          e.preventDefault();
          handleReset();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const goTo = (idx: number) => {
    if (idx >= 0 && idx < maxVisiblePages) {
      setCurrentPage(idx);
      handleReset();
    }
  };

  if (loadedPagesCount === 0) return null;

  return (
    <>
      <div 
        className="rounded-[24px] border border-white/10 overflow-hidden shadow-2xl bg-[#0a1628] flex flex-col h-[720px] select-none"
        onWheel={handleWheel}
      >
        {/* A. REFINED TOP BAR */}
        <div className="flex flex-wrap items-center justify-between px-6 py-4 gap-4 border-b border-white/5 bg-[#0a1628]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
              <Eye className="w-3.5 h-3.5 text-white/70" />
              <span className="text-[10px] font-bold text-white tracking-[0.1em] uppercase">Media Viewer</span>
            </div>
            <div className="h-4 w-[1px] bg-white/10 mx-1" />
            <span className="text-xs font-semibold text-white/90">
              Page {currentPage + 1} <span className="text-white/40 font-normal mx-1">of</span> {maxVisiblePages}
              {!canAccess && isRestricted && (
                <span className="text-white/40 font-normal ml-2">
                  (previewing {maxVisiblePages} of {totalPages} pages)
                </span>
              )}
              {totalPages > loadedPagesCount && !isRestricted && (
                <span className="text-white/40 font-normal ml-2">({totalPages} total)</span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
              isRestricted 
                ? "bg-[#960000]/10 border-[#960000]/30 text-[#ffb4b4]" 
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
            }`}>
              <Lock className="w-3 h-3" />
              <span className="text-[10px] font-bold tracking-wider uppercase">
                {isRestricted ? "RESTRICTED" : "PUBLIC"}
              </span>
            </div>
            
            <button 
              onClick={() => setShowFullscreen(true)} 
              className="w-9 h-9 rounded-xl border border-white/10 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all hover:scale-105 active:scale-95"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* B. REFINED THUMBNAIL SIDEBAR */}
          <div className="md:w-[100px] w-full md:border-r border-white/5 bg-[#08101d] flex flex-col">
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3 flex md:flex-col items-center">
              {images.map((img, idx) => {
                const isLocked = !canAccess && isRestricted && idx >= maxVisiblePages;
                
                return (
                  <button
                    key={idx}
                    disabled={isLocked}
                    onClick={() => goTo(idx)}
                    className={`relative shrink-0 w-16 h-20 rounded-xl overflow-hidden border-2 transition-all duration-300 group ${
                      currentPage === idx
                        ? "border-[#4169E1] ring-4 ring-[#4169E1]/20 scale-105 shadow-lg z-10"
                        : isLocked 
                          ? "border-white/5 grayscale opacity-40 cursor-not-allowed"
                          : "border-white/10 opacity-70 hover:opacity-100 hover:border-white/30 hover:scale-[1.02]"
                    }`}
                  >
                    <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                    
                    {/* Locked Overlay */}
                    {isLocked && (
                      <div className="absolute inset-0 bg-[#0a1628]/80 backdrop-blur-[2px] flex flex-col items-center justify-center gap-1">
                        <Lock className="w-4 h-4 text-[#ffb4b4]" />
                        <span className="text-[8px] font-bold text-[#ffb4b4]/60 uppercase tracking-tighter">Locked</span>
                      </div>
                    )}

                    <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[8px] font-bold text-center py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {idx === 0 ? "Cover" : idx + 1}
                    </div>
                  </button>
                );
              })}
              
              {/* Extra Locked Tiles if totalPages > loadedPagesCount */}
              {!canAccess && isRestricted && totalPages > loadedPagesCount && (
                Array.from({ length: Math.min(3, totalPages - loadedPagesCount) }).map((_, i) => (
                  <div
                    key={`extra-locked-${i}`}
                    className="shrink-0 w-16 h-20 rounded-xl border-2 border-dashed border-white/5 bg-white/5 flex flex-col items-center justify-center gap-1 opacity-30"
                  >
                    <Lock className="w-4 h-4 text-white/40" />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* C. MAIN STAGE WITH ZOOM/PAN */}
          <div className="relative flex-1 bg-[#0a1628] flex flex-col overflow-hidden">
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_rgba(65,105,225,0.05),_transparent_70%)]" />
            
            <div 
              ref={containerRef}
              className={`relative flex-1 flex items-center justify-center overflow-hidden p-10 cursor-default ${zoom > 1 ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : ''}`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div 
                className="relative transition-transform duration-200 ease-out flex items-center justify-center"
                style={{ 
                  transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                  transformOrigin: 'center'
                }}
              >
                <div className="relative shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] rounded-lg overflow-hidden transition-all duration-500">
                  <img
                    src={visibleImages[currentPage]}
                    alt={`${title} - Page ${currentPage + 1}`}
                    onDragStart={(e) => e.preventDefault()}
                    className={`max-h-[580px] w-auto object-contain transition-all duration-700 ${!canAccess && isRestricted && currentPage >= maxVisiblePages - 1 && loadedPagesCount > maxVisiblePages ? "blur-md opacity-70" : ""}`}
                  />
                  
                  {/* Floating Page Label */}
                  <div className="absolute top-4 left-4 bg-[#0a1628]/80 backdrop-blur-md text-white text-[10px] px-3 py-1.5 rounded-lg font-bold border border-white/10">
                    {currentPage === 0 ? "Cover Page" : `Page ${currentPage + 1}`}
                  </div>
                </div>
              </div>

              {/* Navigation Arrows */}
              {currentPage > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); goTo(currentPage - 1); }}
                  className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-[#0a1628]/40 hover:bg-[#0a1628]/80 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/40 flex items-center justify-center transition-all group scale-100 hover:scale-110 active:scale-95 z-20"
                >
                  <ChevronLeft className="w-6 h-6 text-white group-hover:text-emerald-400" />
                </button>
              )}
              {currentPage < maxVisiblePages - 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); goTo(currentPage + 1); }}
                  className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-[#0a1628]/40 hover:bg-[#0a1628]/80 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/40 flex items-center justify-center transition-all group scale-100 hover:scale-110 active:scale-95 z-20"
                >
                  <ChevronRight className="w-6 h-6 text-white group-hover:text-emerald-400" />
                </button>
              )}

              {/* D. ZOOM CONTROLS PILL */}
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-[#0a1628]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl px-2 py-2 flex items-center gap-1 z-30">
                <button 
                  onClick={(e) => { e.stopPropagation(); handleZoom(-0.25); }}
                  className="w-9 h-9 rounded-xl hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                  title="Zoom Out (Ctrl -)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <div className="min-w-[56px] text-center px-2">
                  <span className="text-[11px] font-bold text-white/90">{Math.round(zoom * 100)}%</span>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleZoom(0.25); }}
                  className="w-9 h-9 rounded-xl hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                  title="Zoom In (Ctrl +)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <div className="w-[1px] h-4 bg-white/10 mx-1" />
                <button 
                  onClick={(e) => { e.stopPropagation(); handleReset(); }}
                  className="px-3 h-9 rounded-xl hover:bg-white/10 flex items-center justify-center text-[10px] font-bold text-white/70 hover:text-white transition-colors gap-2"
                  title="Reset (Ctrl 0)"
                >
                  <Maximize className="w-3.5 h-3.5" />
                  Fit
                </button>
              </div>

              {/* RESTRICTED OVERLAY */}
              {!canAccess && isRestricted && currentPage >= maxVisiblePages - 1 && loadedPagesCount > maxVisiblePages && (
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628] via-[#0a1628]/60 to-transparent flex flex-col items-center justify-end pb-24 z-40 px-6">
                  <div className="bg-white rounded-3xl shadow-2xl border border-border/40 p-8 max-w-sm text-center animate-in fade-in slide-in-from-bottom-8 duration-500">
                    <div className="w-16 h-16 rounded-full bg-[#960000]/10 flex items-center justify-center mx-auto mb-4 border border-[#960000]/20">
                      <Lock className="w-8 h-8 text-[#960000]" />
                    </div>
                    <h3 className="text-xl font-bold text-[#0a1628] mb-3">Restricted Access</h3>
                    <p className="text-sm text-muted-foreground mb-8 leading-relaxed px-2">
                      🔒 This page is restricted. Request access to view the full {totalPages}-page document.
                    </p>
                    <Link href={`/request-access?materialId=${encodeURIComponent(materialId)}&title=${encodeURIComponent(title)}`}>
                      <button className="w-full bg-[#960000] hover:bg-[#7a0000] text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg hover:translate-y-[-2px] active:translate-y-0">
                        <Lock className="w-5 h-5" /> Request Access
                      </button>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* E. PRESERVATION BOTTOM BAR */}
            <div className="px-6 py-3 border-t border-white/5 bg-[#08101d] flex items-center justify-between">
              <div className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
                <Database className="w-3.5 h-3.5 text-[#4169E1]" />
                <span className="text-[10px] font-bold text-white/50 tracking-wider uppercase">OAIS ALIGNED</span>
                <div className="w-1 h-1 rounded-full bg-white/20" />
                <span className="text-[10px] font-medium text-white/40 tracking-wide">ISO 14721:2012 PRESERVATION INFO</span>
              </div>
              <div className="text-[10px] font-mono text-white/30 truncate max-w-[200px]">
                {materialId} // AIP.V1.LATEST
              </div>
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
  const { data: apiMaterial, isLoading: isApiLoading } = useGetMaterial(params?.id);
  const [material, setMaterial] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (isApiLoading) return;
    
    if (apiMaterial) {
      setMaterial(apiMaterial);
      setIsLoading(false);
    } else if (params?.id) {
      // Fallback to local if API fails or returns nothing (for items only in materials.json)
      const local = getMaterialById(params.id);
      setMaterial(local);
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [apiMaterial, isApiLoading, params?.id]);

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

  const approvalStatus = material.approvalStatus || "approved";
  const isPrivileged = user?.role === "admin" || user?.role === "archivist";
  const isPublished = approvalStatus === "approved";

  if (!isPublished && !isPrivileged) {
    return (
      <div className="min-h-screen bg-[#f7f8fc] flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-white rounded-2xl border border-border/60 shadow-sm p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-[#0a1628] mb-2">Awaiting Admin Approval</h2>
          <p className="text-sm text-muted-foreground mb-6">
            This archival material is pending administrative approval and is not yet published for public access.
          </p>
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
  const canViewDetail = material.access === "public" || isPrivileged || !!isApproved;
  const isRestricted = material.access === "restricted" || material.access === "confidential";
  const canAccessFull = material.access === "public" || isPrivileged || !!isApproved;

  return (
    <div className="min-h-screen bg-[#f7f8fc] font-sans">
      {/* ─── TOP NAV ─── */}
      <PublicNavbar isTransparentOnTop={false} />

      {/* ─── BREADCRUMB ─── */}
      <div className="max-w-7xl mx-auto px-6 pt-20 pb-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
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
              <MediaViewer
                materialId={material.id}
                pages={material.pages || 60}
                pageImages={material.pageImages && material.pageImages.length > 0 ? material.pageImages : [
                  "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&auto=format&fit=crop",
                  "https://images.unsplash.com/photo-1616628188550-808682f392ce?w=800&auto=format&fit=crop",
                  "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop",
                  "https://images.unsplash.com/photo-1586281380117-5a60ae2050cc?w=800&auto=format&fit=crop",
                  "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&auto=format&fit=crop",
                  "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800&auto=format&fit=crop"
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
