import * as React from "react";
import { Link } from "wouter";
import {
  Search, SlidersHorizontal, Lock, ShieldAlert, FileText, Database, X,
  User, CheckCircle, BookOpen, Calendar, Layers, Eye, Grid3X3, List,
  ArrowUpRight, Clock, Tag, Filter, Sparkles, LayoutDashboard
} from "lucide-react";
import { useGetCategories, useGetMe } from "@workspace/api-client-react";
import { checkOAISCompliance } from "@/data/metadataUtils";
import { getMaterials } from "@/data/storage";

const ACCESS_CONFIG = {
  public: {
    bg: "bg-emerald-500/90",
    text: "text-white",
    icon: Eye,
    label: "Public",
    glow: "shadow-emerald-500/20",
  },
  restricted: {
    bg: "bg-amber-500/90",
    text: "text-white",
    icon: Lock,
    label: "Restricted",
    glow: "shadow-amber-500/20",
  },
  confidential: {
    bg: "bg-[#960000]/90",
    text: "text-white",
    icon: ShieldAlert,
    label: "Confidential",
    glow: "shadow-red-500/20",
  },
} as const;

// Cover gradient overlays for cards without thumbnail images
const CARD_GRADIENTS = [
  "from-[#0a1628] via-[#1a2744] to-[#2a3f6b]",
  "from-[#4169E1] via-[#3558c8] to-[#1e3a8a]",
  "from-[#960000] via-[#7a0000] to-[#4a0000]",
  "from-[#1e293b] via-[#334155] to-[#475569]",
  "from-[#0f172a] via-[#1e293b] to-[#334155]",
  "from-[#312e81] via-[#4338ca] to-[#4f46e5]",
  "from-[#064e3b] via-[#047857] to-[#059669]",
  "from-[#78350f] via-[#92400e] to-[#b45309]",
];

export default function Collections() {
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [category, setCategory] = React.useState<string>("");
  const [access, setAccess] = React.useState<string>("");
  const [showFilters, setShowFilters] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [hoveredCard, setHoveredCard] = React.useState<string | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: categories } = useGetCategories();
  const [localMaterials, setLocalMaterials] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    setLocalMaterials(getMaterials());
    setIsLoading(false);
  }, []);

  const { data: user } = useGetMe();
  const [showOaisOnly, setShowOaisOnly] = React.useState(false);
  const isPrivileged = user?.role === "admin" || user?.role === "archivist";

  const roleBranding = {
    admin: { bg: "bg-[#002366]", label: "Admin" },
    archivist: { bg: "bg-black", label: "Archivist" },
    student: { bg: "bg-[#960000]", label: "User" },
  }[user?.role as string] || { bg: "bg-[#0a1628]", label: "" };

  const activeFilters = [
    category && { key: "category", label: categories?.find(c => c.id === category)?.name || category, clear: () => setCategory("") },
    access && { key: "access", label: ACCESS_CONFIG[access as keyof typeof ACCESS_CONFIG]?.label || access, clear: () => setAccess("") },
    showOaisOnly && { key: "oais", label: "OAIS Compliant Only", clear: () => setShowOaisOnly(false) },
  ].filter(Boolean) as { key: string; label: string; clear: () => void }[];

  const displayMaterials = localMaterials.filter((mat: any) => {
    const approvalStatus = mat.approvalStatus || "approved";
    if (!isPrivileged && approvalStatus !== "approved") return false;
    if (showOaisOnly && !checkOAISCompliance(mat)) return false;
    if (access && mat.access !== access) return false;
    if (debouncedSearch) {
      const s = debouncedSearch.toLowerCase();
      return (
        mat.title?.toLowerCase().includes(s) ||
        mat.uniqueId?.toLowerCase().includes(s) ||
        mat.creator?.toLowerCase().includes(s) ||
        mat.description?.toLowerCase().includes(s)
      );
    }
    return true;
  });

  // Stats
  const visibleMaterials = localMaterials.filter((mat) => {
    const approvalStatus = mat.approvalStatus || "approved";
    return isPrivileged || approvalStatus === "approved";
  });
  const totalPublic = visibleMaterials.filter(m => m.access === "public").length;
  const totalRestricted = visibleMaterials.filter(m => m.access === "restricted").length;
  const totalConfidential = visibleMaterials.filter(m => m.access === "confidential").length;
  const totalOais = visibleMaterials.filter(m => checkOAISCompliance(m)).length;

  return (
    <div className="min-h-screen bg-[#f7f8fc] font-sans">
      {/* ─── HEADER ─── */}
      <header className={`${roleBranding.bg} border-b border-white/10 sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4 group">
            <img src={`${import.meta.env.BASE_URL}logos/iarchive%20white%20logo.png`} alt="iArchive" className="h-11 w-auto object-contain drop-shadow-lg group-hover:scale-105 transition-transform duration-300" />
            <div className="flex flex-col">
              <span className="text-white font-black text-2xl tracking-tight leading-none uppercase">iArchive</span>
              <span className="text-[9px] text-white/40 font-bold uppercase tracking-[0.2em] mt-1.5 whitespace-nowrap">HCDC Digital Collections</span>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-white/60">
            <Link href="/" className="hover:text-white transition-colors font-medium">Home</Link>
            <span className="text-white/20">|</span>
            <span className="text-white font-bold tracking-wide">Collections</span>
          </nav>
          {user ? (
            <div className="flex items-center gap-6">
              <Link href={user.role === 'admin' ? "/admin" : user.role === 'archivist' ? "/archivist" : "/student"}>
                <button className="flex items-center gap-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-bold px-4 py-2 rounded-lg transition-all border border-white/20 hover:border-white/40 shadow-sm shadow-black/10">
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </button>
              </Link>
              <div className="flex items-center gap-4 border-l border-white/10 pl-6">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">{roleBranding.label}</span>
                  <span className="text-sm font-bold text-white">{user.name}</span>
                </div>
                <div className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shadow-lg shadow-black/20">
                  <User className="w-5 h-5 text-white/70" />
                </div>
              </div>
            </div>
          ) : (
            <Link href="/login">
              <button className="text-sm font-bold text-white bg-[#4169E1] px-5 py-2 rounded-lg hover:bg-[#3558c8] transition-all shadow-lg shadow-black/20">Sign In</button>
            </Link>
          )}
        </div>
      </header>

      {/* ─── HERO SECTION ─── */}
      <div className="bg-[#0a1628] relative overflow-hidden">
        {/* Animated background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#4169E1]/8 rounded-full blur-[120px] animate-float-slow" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#960000]/6 rounded-full blur-[100px] animate-float-slower" />
          <div className="absolute inset-0 bg-grid-white animate-grid-flow opacity-30" />
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-10 pb-12 relative z-10">
          {/* Title */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#4169E1]/20 border border-[#4169E1]/30 flex items-center justify-center">
                <Layers className="w-4 h-4 text-[#4169E1]" />
              </div>
              <p className="text-white/40 text-xs font-bold uppercase tracking-[0.25em]">Digital Archival Repository</p>
            </div>
            <h1 className="text-5xl font-black text-white leading-tight mb-3">
              Browse the <span className="font-serif italic bg-gradient-to-r from-[#4169E1] to-[#7c94e8] text-transparent bg-clip-text">Archive</span>
            </h1>
            <p className="text-white/40 text-sm max-w-lg leading-relaxed">
              Explore {localMaterials.length} digitized archival materials from the Holy Cross of Davao College collection.
            </p>
          </div>

          {/* Quick Stats Chips */}
          <div className="flex flex-wrap gap-3 mb-8">
            {[
              { label: "Total Items", value: localMaterials.length, icon: Database, color: "bg-white/10 border-white/20 text-white" },
              { label: "Public", value: totalPublic, icon: Eye, color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" },
              { label: "Restricted", value: totalRestricted, icon: Lock, color: "bg-amber-500/10 border-amber-500/20 text-amber-400" },
              { label: "Confidential", value: totalConfidential, icon: ShieldAlert, color: "bg-red-500/10 border-red-500/20 text-red-400" },
              { label: "OAIS Compliant", value: totalOais, icon: CheckCircle, color: "bg-[#4169E1]/10 border-[#4169E1]/20 text-[#4169E1]" },
            ].map(stat => (
              <div key={stat.label} className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border ${stat.color} text-xs font-semibold backdrop-blur-sm`}>
                <stat.icon className="w-3.5 h-3.5" />
                <span className="opacity-60">{stat.label}</span>
                <span className="font-black text-sm">{stat.value}</span>
              </div>
            ))}
          </div>

          {/* Search Bar */}
          <div className="flex gap-3">
            <div className="relative flex-1 max-w-2xl group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-[#4169E1] transition-colors" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search titles, creators, identifiers, descriptions..."
                className="w-full h-13 bg-white/8 border border-white/15 rounded-2xl pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-[#4169E1]/50 focus:bg-white/12 focus:shadow-lg focus:shadow-[#4169E1]/10 transition-all text-sm backdrop-blur-sm"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <label className="hidden sm:flex items-center gap-3 cursor-pointer bg-white/5 border border-white/15 hover:bg-white/10 px-5 h-13 rounded-2xl transition-all backdrop-blur-sm">
              <div className="relative">
                <input type="checkbox" className="sr-only" checked={showOaisOnly} onChange={(e) => setShowOaisOnly(e.target.checked)} />
                <div className={`w-10 h-5.5 rounded-full shadow-inner transition-all duration-300 ${showOaisOnly ? 'bg-[#4169E1]' : 'bg-white/15'}`} />
                <div className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow-md transition-transform duration-300 ${showOaisOnly ? 'translate-x-[18px]' : ''}`} />
              </div>
              <span className="text-white/80 text-sm font-semibold whitespace-nowrap">OAIS Only</span>
            </label>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-5 h-13 rounded-2xl border text-sm font-semibold transition-all backdrop-blur-sm ${
                showFilters
                  ? 'bg-[#4169E1] border-[#4169E1] text-white shadow-lg shadow-[#4169E1]/20'
                  : 'bg-white/5 border-white/15 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFilters.length > 0 && (
                <span className="bg-white/20 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-black">{activeFilters.length}</span>
              )}
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 bg-white/8 border border-white/15 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6 backdrop-blur-sm animate-fade-in">
              <div>
                <label className="text-white/50 text-xs font-bold uppercase tracking-wider block mb-2.5">Collection Series</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#4169E1]/50 [&>option]:bg-[#0a1628] [&>option]:text-white"
                >
                  <option value="">All Series</option>
                  {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-white/50 text-xs font-bold uppercase tracking-wider block mb-2.5">Access Level</label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { id: "", label: "All", icon: Layers },
                    { id: "public", label: "Public", icon: Eye },
                    { id: "restricted", label: "Restricted", icon: Lock },
                    { id: "confidential", label: "Confidential", icon: ShieldAlert },
                  ].map(a => (
                    <button
                      key={a.id}
                      onClick={() => setAccess(a.id)}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                        access === a.id
                          ? 'bg-[#4169E1] text-white shadow-md shadow-[#4169E1]/20'
                          : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                      }`}
                    >
                      <a.icon className="w-3 h-3" />
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 animate-fade-in">
              {activeFilters.map(f => (
                <button
                  key={f.key}
                  onClick={f.clear}
                  className="inline-flex items-center gap-1.5 bg-[#4169E1]/20 border border-[#4169E1]/30 text-white text-xs font-medium px-3.5 py-1.5 rounded-full hover:bg-[#4169E1]/40 transition-all group"
                >
                  {f.label}
                  <X className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                </button>
              ))}
              <button
                onClick={() => { setCategory(""); setAccess(""); setSearch(""); setShowOaisOnly(false); }}
                className="text-white/40 text-xs hover:text-white transition-colors px-3 font-semibold"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── RESULTS SECTION ─── */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-7">
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-black text-xl text-foreground">{displayMaterials.length}</span>
              <span className="ml-1.5">archival materials found</span>
            </p>
            {debouncedSearch && (
              <span className="inline-flex items-center gap-1 bg-[#4169E1]/10 text-[#4169E1] text-xs font-semibold px-3 py-1 rounded-full">
                <Search className="w-3 h-3" /> "{debouncedSearch}"
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                viewMode === "grid" ? 'bg-[#4169E1] text-white shadow-md' : 'bg-white border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                viewMode === "list" ? 'bg-[#4169E1] text-white shadow-md' : 'bg-white border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Empty State */}
        {displayMaterials.length === 0 && (
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-[#4169E1]/10 to-[#960000]/10 rounded-3xl flex items-center justify-center mb-6 rotate-6">
              <Search className="w-10 h-10 text-muted-foreground/30 -rotate-6" />
            </div>
            <h3 className="text-2xl font-black text-foreground mb-2">No materials found</h3>
            <p className="text-muted-foreground max-w-sm mb-8 leading-relaxed">
              No archival materials match your current filters. Try adjusting your search terms or clearing active filters.
            </p>
            <button
              onClick={() => { setSearch(""); setCategory(""); setAccess(""); setShowOaisOnly(false); }}
              className="bg-[#4169E1] text-white font-bold px-8 py-3 rounded-xl text-sm hover:bg-[#3558c8] transition-all shadow-lg shadow-[#4169E1]/20 hover:shadow-xl hover:shadow-[#4169E1]/30"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* ═══ GRID VIEW ═══ */}
        {displayMaterials.length > 0 && viewMode === "grid" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayMaterials.map((mat: any, i: number) => {
              const acc = ACCESS_CONFIG[mat.access as keyof typeof ACCESS_CONFIG] || ACCESS_CONFIG.public;
              const AccIcon = acc.icon;
              const hasCover = mat.thumbnailUrl || (mat.pageImages && mat.pageImages.length > 0);
              const coverImg = mat.pageImages?.[0] || mat.thumbnailUrl;
              const approvalStatus = mat.approvalStatus || "approved";
              const showApproval = isPrivileged && approvalStatus !== "approved";
              const approvalBadgeClass = approvalStatus === "pending" ? "bg-amber-500/90" : "bg-red-500/90";
              const isHovered = hoveredCard === mat.id;
              const formatLabel = mat.format?.includes("image") ? "TIFF" : mat.format?.includes("video") ? "MP4" : "PDF";

              return (
                <Link key={mat.id || mat.uniqueId} href={`/materials/${mat.id || mat.uniqueId}`}>
                  <div
                    className="relative bg-white rounded-2xl border border-border/60 overflow-hidden group hover:border-[#4169E1]/40 hover:shadow-2xl hover:shadow-[#4169E1]/8 transition-all duration-500 cursor-pointer flex flex-col h-full hover:-translate-y-1"
                    onMouseEnter={() => setHoveredCard(mat.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    {/* Cover Image / Gradient */}
                    <div className="h-[200px] shrink-0 relative overflow-hidden">
                      {showApproval && (
                        <div className={`absolute top-3 right-3 z-20 rounded-full ${approvalBadgeClass} text-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 shadow-lg`}>
                          {approvalStatus}
                        </div>
                      )}
                      {hasCover ? (
                        <>
                          <img
                            src={coverImg}
                            alt={mat.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          {/* Overlay gradient */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        </>
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${CARD_GRADIENTS[i % CARD_GRADIENTS.length]} relative`}>
                          <div className="absolute inset-0 opacity-[0.04]">
                            <div className="grid grid-cols-6 gap-px p-3 h-full">
                              {[...Array(24)].map((_, j) => <div key={j} className="bg-white rounded-sm" />)}
                            </div>
                          </div>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="w-16 h-20 bg-white/10 rounded-xl border border-white/20 flex items-center justify-center mb-3 backdrop-blur-sm group-hover:scale-110 transition-transform duration-500">
                              <FileText className="w-8 h-8 text-white/40" />
                            </div>
                            <span className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold">{formatLabel}</span>
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        </div>
                      )}

                      {/* Access Badge */}
                      <div className={`absolute top-3 left-3 inline-flex items-center gap-1.5 ${acc.bg} ${acc.text} text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-lg backdrop-blur-md shadow-lg ${acc.glow}`}>
                        <AccIcon className="w-3 h-3" />
                        {acc.label}
                      </div>

                      {/* OAIS Badge */}
                      {checkOAISCompliance(mat) && (
                        <div className="absolute top-3 right-3 inline-flex items-center gap-1 bg-black/60 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg backdrop-blur-md border border-white/10">
                          <CheckCircle className="w-2.5 h-2.5 text-emerald-400" /> OAIS
                        </div>
                      )}

                      {/* Page count indicator */}
                      {mat.pages && (
                        <div className="absolute bottom-3 right-3 inline-flex items-center gap-1 bg-black/50 text-white/80 text-[10px] font-bold px-2 py-1 rounded-md backdrop-blur-sm">
                          <BookOpen className="w-3 h-3" /> {mat.pages}p
                        </div>
                      )}

                      {/* Bottom title overlay (over image) */}
                      {hasCover && (
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <p className="text-[9px] font-mono font-bold text-white/50 mb-1 tracking-widest">{mat.uniqueId || mat.materialId}</p>
                          <h3 className="font-bold text-white text-base leading-snug line-clamp-2 drop-shadow-lg">
                            {mat.title}
                          </h3>
                        </div>
                      )}
                    </div>

                    {/* Content Section */}
                    <div className="p-5 flex flex-col flex-1">
                      {/* Title (if no cover image to overlay) */}
                      {!hasCover && (
                        <>
                          <p className="text-[9px] font-mono font-bold text-muted-foreground/50 mb-1.5 tracking-widest">{mat.uniqueId || mat.materialId}</p>
                          <h3 className="font-bold text-[#0a1628] text-[15px] leading-snug mb-3 group-hover:text-[#4169E1] transition-colors line-clamp-2">
                            {mat.title}
                          </h3>
                        </>
                      )}

                      {/* Description preview */}
                      {mat.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-4">
                          {mat.description}
                        </p>
                      )}

                      {/* Meta row */}
                      <div className="mt-auto flex items-center justify-between pt-4 border-t border-border/40">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-[#4169E1]/80" />
                            <span className="text-[11px] text-muted-foreground font-semibold truncate max-w-[120px]">
                              {mat.categoryName || mat.hierarchyPath?.split(" > ")[1] || "General"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-[#4169E1]/80" />
                            <span className="text-[11px] font-mono font-bold text-muted-foreground">
                              {mat.date ? new Date(mat.date).getFullYear() : "—"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="mt-4 pt-4 border-t border-dashed border-border flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                           View Details
                        </div>
                        <button className="flex items-center gap-1.5 px-4 py-2 bg-[#f0f4ff] text-[#4169E1] group-hover:bg-[#4169E1] group-hover:text-white rounded-xl text-xs font-bold transition-all duration-300">
                          {mat.access === 'restricted' || mat.access === 'confidential' ? <Lock className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          {mat.access === 'restricted' || mat.access === 'confidential' ? 'Preview' : 'View Original'}
                        </button>
                      </div>
                    </div>

                    {/* Hover Arrow (Keep it but positioned nicely) */}
                    <div className={`absolute top-4 right-4 w-9 h-9 rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.15)] flex items-center justify-center transition-all duration-500 z-20 ${
                      isHovered ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
                    }`}>
                      <ArrowUpRight className="w-4.5 h-4.5 text-[#4169E1]" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* ═══ LIST VIEW ═══ */}
        {displayMaterials.length > 0 && viewMode === "list" && (
          <div className="space-y-3">
            {displayMaterials.map((mat: any, i: number) => {
              const acc = ACCESS_CONFIG[mat.access as keyof typeof ACCESS_CONFIG] || ACCESS_CONFIG.public;
              const AccIcon = acc.icon;
              const coverImg = mat.pageImages?.[0] || mat.thumbnailUrl;
              const approvalStatus = mat.approvalStatus || "approved";
              const showApproval = isPrivileged && approvalStatus !== "approved";
              const approvalBadgeClass = approvalStatus === "pending" ? "bg-amber-500/90" : "bg-red-500/90";
              const formatLabel = mat.format?.includes("image") ? "TIFF" : mat.format?.includes("video") ? "MP4" : "PDF";

              return (
                <Link key={mat.id || mat.uniqueId} href={`/materials/${mat.id || mat.uniqueId}`}>
                  <div className="bg-white rounded-2xl border border-border/60 overflow-hidden group hover:border-[#4169E1]/40 hover:shadow-xl hover:shadow-[#4169E1]/5 transition-all duration-300 cursor-pointer flex">
                    <div className="w-[180px] shrink-0 relative overflow-hidden bg-slate-100 flex flex-col group border-r border-border/40">
                      {showApproval && (
                        <div className={`absolute top-3 left-3 z-20 rounded-full ${approvalBadgeClass} text-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 shadow-lg`}>
                          {approvalStatus}
                        </div>
                      )}
                      {mat.pageImages && mat.pageImages.length > 0 ? (
                        <>
                           <div className="flex-1 relative overflow-hidden">
                             <img src={mat.pageImages[0]} alt={mat.title} className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105" />
                             <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
                               <span className="text-[9px] font-bold text-white uppercase tracking-widest">{mat.pageImages.length} Pages</span>
                             </div>
                           </div>
                           {/* Mini horizontal strip below main cover */}
                           <div className="h-10 bg-white border-t border-border/50 flex gap-1 p-1 overflow-x-auto invisible group-hover:visible bg-slate-50 shadow-inner custom-scrollbar-mini">
                              {mat.pageImages.slice(1, 10).map((img: string, idx: number) => (
                                <div key={idx} className="w-8 h-full shrink-0 border border-slate-200 rounded overflow-hidden">
                                   <img src={img} alt={`Page ${idx+2}`} className="w-full h-full object-cover" />
                                </div>
                              ))}
                              {mat.pageImages.length > 10 && (
                                <div className="w-8 h-full shrink-0 border border-slate-200 rounded bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-500">
                                  +{mat.pageImages.length - 10}
                                </div>
                              )}
                           </div>
                        </>
                      ) : coverImg ? (
                        <>
                          <img src={coverImg} alt={mat.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10" />
                        </>
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${CARD_GRADIENTS[i % CARD_GRADIENTS.length]} flex items-center justify-center`}>
                          <FileText className="w-8 h-8 text-white/30" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-5 flex flex-col justify-center min-h-[120px]">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`inline-flex items-center gap-1 ${acc.bg} ${acc.text} text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md`}>
                          <AccIcon className="w-2.5 h-2.5" /> {acc.label}
                        </div>
                        {checkOAISCompliance(mat) && (
                          <div className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[9px] font-bold uppercase px-2 py-0.5 rounded-md border border-emerald-200">
                            <CheckCircle className="w-2.5 h-2.5" /> OAIS
                          </div>
                        )}
                        <span className="text-[9px] font-mono text-muted-foreground/50 font-bold">{mat.uniqueId || mat.materialId}</span>
                      </div>

                      <h3 className="font-bold text-[#0a1628] text-base leading-snug group-hover:text-[#4169E1] transition-colors mb-1.5">
                        {mat.title}
                      </h3>

                      {mat.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-1 mb-2">{mat.description}</p>
                      )}

                      <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                        {mat.creator && (
                          <span className="flex items-center gap-1"><User className="w-3 h-3" />{mat.creator}</span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {mat.date ? new Date(mat.date).getFullYear() : "—"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {mat.categoryName || mat.hierarchyPath?.split(" > ")[1] || "General"}
                        </span>
                        {mat.pages && (
                          <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{mat.pages} pages</span>
                        )}
                      </div>
                    </div>

                    {/* Action Area */}
                    <div className="flex items-center pr-6 pl-4 border-l border-border/40 my-4">
                      <div className="flex flex-col gap-2 items-end">
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest group-hover:text-[#4169E1] transition-colors">
                          Explore
                        </span>
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-[#f0f4ff] text-[#4169E1] group-hover:bg-[#4169E1] group-hover:text-white rounded-xl text-sm font-bold transition-all duration-300">
                          {mat.access === 'restricted' || mat.access === 'confidential' ? 'Preview' : 'View'}
                          <ArrowUpRight className="w-4 h-4 ml-1" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── FOOTER ─── */}
      <footer className="bg-[#0a1628] border-t border-white/10 py-10 mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#4169E1] flex items-center justify-center">
                <Database className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-white/70 text-sm font-semibold block">iArchive</span>
                <span className="text-white/30 text-xs">Holy Cross of Davao College</span>
              </div>
            </div>
            <p className="text-white/20 text-xs">&copy; 2026 HCDC. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
