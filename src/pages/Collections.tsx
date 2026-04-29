import * as React from "react";
import { Link, useLocation } from "wouter";
import { PublicNavbar } from "@/components/PublicNavbar";
import {
  Search, SlidersHorizontal, Lock, ShieldAlert, FileText, Database, X,
  User, CheckCircle, BookOpen, Calendar, Layers, Eye, Grid3X3, List,
  ArrowUpRight, ArrowRight, Clock, Tag, Filter, Sparkles, LayoutDashboard, Folder, ChevronRight, CornerDownRight, ArrowLeft
} from "lucide-react";
import { useGetCategories, useGetMe, useGetMaterials } from "@workspace/api-client-react";
import { checkOAISCompliance } from "@/data/metadataUtils";
import { cn } from "@/lib/utils";

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
  const [navigationPath, setNavigationPath] = React.useState<Array<{ level: "fonds" | "subfonds" | "series"; name: string }>>([]);

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: categories } = useGetCategories();
  const { data: materialsData, isLoading: isMaterialsLoading } = useGetMaterials({
    search: debouncedSearch,
    access,
    category,
  });

  const materials = materialsData?.materials || [];
  const isLoading = isMaterialsLoading;

  const [location] = useLocation();

  React.useEffect(() => {
    // Sync filters/navigation from URL
    const params = new URLSearchParams(window.location.search);
    const s = params.get("search");
    const cat = params.get("category");
    if (s !== null) {
      setSearch(s);
      setDebouncedSearch(s);
    }
    if (cat !== null) {
      setCategory(cat);
    }
  }, [location]);

  const { data: user } = useGetMe();
  const [showOaisOnly, setShowOaisOnly] = React.useState(false);
  const isPrivileged = user?.role === "admin" || user?.role === "archivist";

  const roleBranding = {
    admin: { bg: "bg-[#002366]", label: "Admin" },
    archivist: { bg: "bg-black", label: "Archivist" },
    student: { bg: "bg-[#960000]", label: "User" },
  }[user?.role as string] || { bg: "bg-[#0a1628]", label: "" };

  const [subfondsFilter, setSubfondsFilter] = React.useState<string>("");

  const activeFilters = [
    subfondsFilter && { key: "subfonds", label: subfondsFilter, clear: () => setSubfondsFilter("") },
    category && { key: "category", label: categories?.find(c => c.id === category)?.name || category, clear: () => setCategory("") },
    access && { key: "access", label: ACCESS_CONFIG[access as keyof typeof ACCESS_CONFIG]?.label || access, clear: () => setAccess("") },
  ].filter(Boolean) as { key: string; label: string; clear: () => void }[];

  const displayMaterials = materials.filter((mat: any) => {
    const status = mat.approvalStatus || mat.status || "approved";
    if (!isPrivileged && status !== "approved" && status !== "published") return false;
    if (showOaisOnly && !checkOAISCompliance(mat)) return false;
    if (access && mat.access !== access) return false;
    if (subfondsFilter && !(mat.hierarchyPath || "").toLowerCase().includes(subfondsFilter.toLowerCase())) return false;
    if (category) {
       const catObj = categories?.find((c: any) => c.id === category);
       if (catObj && !(mat.hierarchyPath || "").toLowerCase().includes(catObj.name.toLowerCase())) return false;
    }
    if (!isPrivileged && !mat.fileUrl && !mat.thumbnailUrl && !mat.hasPageImages) return false;
    return true; // Search is handled by the API now
  });

  // Calculate Folders based on displayMaterials (so they reflect search & access filters too)
  const foldersMap = new Map<string, { category: string; subfonds: string; subfondsDisplayName?: string; series: string; count: number; coverImages: string[] }>();
  displayMaterials.forEach((mat: any) => {
    const parts = (mat.hierarchyPath || "").split(" > ").filter((p: string) => p.trim() !== "");
    
    let depth = 1;
    if (parts[depth] === "Departmental Sub-fonds") depth++;
    
    const subfonds = parts[depth] || parts[depth-1] || "Uncategorized";
    // Folder name is either the last part (series) or "General Series" if it's too shallow
    const ser = parts.length > (depth+1) ? parts[parts.length - 1] : "General Series";
    
    const finalSubfonds = parts.length < depth ? "HCDC Collections" : subfonds;
    const finalSer = (parts.length === depth && parts[0] === "HCDC") ? "General Series" : ser;

    // Determine the top-level category based on subfonds type
    // Group all colleges/departments under "Academic Departments"
    // Keep administrative, publications, photographs as separate categories
    let topCategory = "Other Collections";
    const isDepartmental = parts[1] === "Departmental Sub-fonds";
    const lowerSubfonds = finalSubfonds.toLowerCase();
    
    if (isDepartmental || lowerSubfonds.includes("college") || lowerSubfonds.includes("school") || 
        lowerSubfonds.includes("cet") || lowerSubfonds.includes("ccje") || lowerSubfonds.includes("chatme") || 
        lowerSubfonds.includes("husocom") || lowerSubfonds.includes("come") || lowerSubfonds.includes("sbme") || 
        lowerSubfonds.includes("ste") || lowerSubfonds.includes("blis")) {
      topCategory = "Academic Departments";
    } else if (lowerSubfonds.includes("admin") || lowerSubfonds.includes("board") || lowerSubfonds.includes("strategic")) {
      topCategory = "Administrative Records";
    } else if (lowerSubfonds.includes("publication") || lowerSubfonds.includes("yearbook") || lowerSubfonds.includes("journal")) {
      topCategory = "Publications";
    } else if (lowerSubfonds.includes("photo") || lowerSubfonds.includes("image") || lowerSubfonds.includes("visual")) {
      topCategory = "Photographs & Visual Media";
    } else if (lowerSubfonds.includes("research") || lowerSubfonds.includes("faculty")) {
      topCategory = "Research Output";
    }

    const key = `${finalSubfonds.toLowerCase()}::${finalSer.toLowerCase()}`;
    if (!foldersMap.has(key)) {
      const fullCat = (categories || []).find((c: any) => 
        c.name === finalSubfonds || 
        (typeof c.name === 'string' && c.name.includes(`(${finalSubfonds})`)) ||
        (typeof c.name === 'string' && c.name.split(' ').some((word: string) => word.toLowerCase() === finalSubfonds.toLowerCase()))
      );
      foldersMap.set(key, { 
        category: topCategory, 
        subfonds: finalSubfonds, 
        subfondsDisplayName: fullCat ? fullCat.name : finalSubfonds,
        series: finalSer, 
        count: 0, 
        coverImages: [] 
      });
    }
    const f = foldersMap.get(key)!;
    f.count++;
    const img = mat.pageImages?.[0] || mat.thumbnailUrl;
    if (img && f.coverImages.length < 3) {
      f.coverImages.push(img);
    }
  });

  const folders = Array.from(foldersMap.values());
  
  // Group by top-level category first, then by subfonds within each category
  const categoryOrder = ["Academic Departments", "Research Output", "Administrative Records", "Publications", "Photographs & Visual Media", "Other Collections"];
  const groupedFolders = categoryOrder
    .map(topCat => {
      const catFolders = folders.filter(f => f.category === topCat);
      if (catFolders.length === 0) return null;
      
      // Group folders by subfonds within this category
      const subfondGroups = Array.from(new Set(catFolders.map(f => f.subfonds)))
        .sort()
        .map(sf => ({
          subfonds: sf,
          displayName: catFolders.find(f => f.subfonds === sf)?.subfondsDisplayName || sf,
          folders: catFolders.filter(f => f.subfonds === sf).sort((a,b) => a.series.localeCompare(b.series))
        }));
      
      return {
        category: topCat,
        subfondGroups,
        folders: catFolders.sort((a,b) => a.subfonds.localeCompare(b.subfonds) || a.series.localeCompare(b.series)),
        totalCount: catFolders.reduce((sum, f) => sum + f.count, 0)
      };
    })
    .filter(Boolean) as { category: string; subfondGroups: { subfonds: string; displayName: string; folders: typeof folders }[]; folders: typeof folders; totalCount: number }[];

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const subfondsParam = params.get("subfonds");
    const seriesParam = params.get("series");
    if (!subfondsParam || groupedFolders.length === 0) return;

    const matchedGroup = groupedFolders.find((group) =>
      group.subfondGroups.some((sf) => sf.subfonds === subfondsParam)
    );
    if (!matchedGroup) return;

    const path: Array<{ level: "fonds" | "subfonds" | "series"; name: string }> = [
      { level: "fonds", name: matchedGroup.category },
      { level: "subfonds", name: subfondsParam },
    ];

    if (seriesParam) {
      const targetSubfonds = matchedGroup.subfondGroups.find((sf) => sf.subfonds === subfondsParam);
      const hasSeries = !!targetSubfonds?.folders.some((f) => f.series === seriesParam);
      if (hasSeries) {
        path.push({ level: "series", name: seriesParam });
      }
    }

    setNavigationPath(path);
  }, [location, groupedFolders]);

  const selectedFonds = navigationPath.find((p) => p.level === "fonds")?.name;
  const selectedSubfonds = navigationPath.find((p) => p.level === "subfonds")?.name;
  const selectedSeries = navigationPath.find((p) => p.level === "series")?.name;
  const currentDepth = navigationPath.length;

  const level2Materials = selectedFonds && selectedSubfonds && selectedSeries
    ? displayMaterials.filter((m: any) => {
        const parts = (m.hierarchyPath || "").split(" > ").filter((p: string) => p.trim() !== "");
        let depth = 1;
        if (parts[depth] === "Departmental Sub-fonds") depth++;
        const subfonds = parts[depth] || parts[depth - 1] || "Uncategorized";
        const ser = parts.length > depth + 1 ? parts[parts.length - 1] : "General Series";
        const finalSubfonds = parts.length < depth ? "HCDC Collections" : subfonds;
        const finalSer = parts.length === depth && parts[0] === "HCDC" ? "General Series" : ser;
        return finalSubfonds.toLowerCase() === selectedSubfonds.toLowerCase() && finalSer.toLowerCase() === selectedSeries.toLowerCase();
      })
    : [];

  // Stats
  const visibleMaterials = materials.filter((mat: any) => {
    const status = mat.approvalStatus || mat.status || "approved";
    return isPrivileged || status === "approved" || status === "published";
  });
  const totalPublic = visibleMaterials.filter((m: any) => m.access === "public").length;
  const totalRestricted = visibleMaterials.filter((m: any) => m.access === "restricted").length;
  const totalConfidential = visibleMaterials.filter((m: any) => m.access === "confidential").length;
  const totalOais = visibleMaterials.filter((m: any) => checkOAISCompliance(m)).length;

  return (
    <div className="min-h-screen bg-[#f7f8fc] font-sans">
      {/* ─── HEADER ─── */}
      <PublicNavbar isTransparentOnTop={false} />

      {/* ─── HERO SECTION ─── */}
      <div className="bg-[#0a1628] relative overflow-hidden pt-20">
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
              Explore {visibleMaterials.length} digitized archival materials from the Holy Cross of Davao College collection.
            </p>
          </div>


          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 group">
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
            <div className="mt-4 bg-white/8 border border-white/15 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6 backdrop-blur-sm animate-fade-in">
              <div>
                <label className="text-white/50 text-xs font-bold uppercase tracking-wider block mb-2.5">Sub-fonds</label>
                <select
                  value={subfondsFilter}
                  onChange={e => setSubfondsFilter(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#4169E1]/50 [&>option]:bg-[#0a1628] [&>option]:text-white"
                >
                  <option value="">All Sub-fonds</option>
                   {Array.from(new Set(materials.map((m: any) => {
                     const parts = (m.hierarchyPath || "").split(" > ").filter((p: string) => !!p.trim());
                     return parts[1];
                   }).filter(Boolean))).sort().map((sf: any) => (
                    <option key={sf} value={sf}>{sf}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-white/50 text-xs font-bold uppercase tracking-wider block mb-2.5">Department / Section</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#4169E1]/50 [&>option]:bg-[#0a1628] [&>option]:text-white"
                >
                  <option value="">All Departments</option>
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
                      className={`flex-1 min-w-[80px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                        access === a.id 
                          ? 'bg-white text-[#0a1628] border-white shadow-lg' 
                          : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <a.icon className="w-3.5 h-3.5" />
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
                onClick={() => { setCategory(""); setAccess(""); setSearch(""); setShowOaisOnly(false); setNavigationPath([]); }}
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
        <div className="flex flex-col sm:flex-row items-center justify-between mb-7 gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            {navigationPath.length > 0 ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setNavigationPath((prev) => prev.slice(0, -1))}
                  className="bg-white border border-border text-foreground text-sm font-bold px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-[#4169E1]/5 transition-colors shadow-sm"
                >
                  <ArrowLeft className="w-4 h-4 text-muted-foreground mr-1" />
                  Back
                </button>
                <div className="flex items-center gap-2 text-sm text-muted-foreground px-2 font-medium bg-white/50 border border-border/60 py-1.5 rounded-lg shadow-sm">
                  <button
                    onClick={() => setNavigationPath([])}
                    className="text-[#4169E1] hover:underline font-semibold"
                  >
                    Collections
                  </button>
                  {navigationPath.map((segment, idx) => (
                    <React.Fragment key={`${segment.level}-${segment.name}`}>
                      <ChevronRight className="w-3.5 h-3.5" />
                      <button
                        onClick={() => setNavigationPath(navigationPath.slice(0, idx + 1))}
                        className={cn(
                          "max-w-[180px] truncate",
                          idx === navigationPath.length - 1 ? "text-foreground font-bold" : "text-[#4169E1]/80 hover:underline"
                        )}
                        title={segment.name}
                      >
                        {segment.name}
                      </button>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                <span className="font-black text-xl text-foreground">{displayMaterials.length}</span>
                <span className="ml-1.5">archival materials in {folders.length} folders</span>
              </p>
            )}
            
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

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-[360px] bg-white border border-border/60 rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && displayMaterials.length === 0 && (
          <div className="flex flex-col items-center justify-center py-28 text-center bg-white border border-border/40 rounded-3xl shadow-sm">
            <div className="w-24 h-24 bg-gradient-to-br from-[#4169E1]/10 to-[#960000]/10 rounded-3xl flex items-center justify-center mb-6 rotate-6 shadow-sm">
              <Search className="w-10 h-10 text-muted-foreground/30 -rotate-6" />
            </div>
            <h3 className="text-2xl font-black text-foreground mb-2">No materials found</h3>
            <p className="text-muted-foreground max-w-sm mb-8 leading-relaxed">
              No archival materials match your current filters. Try adjusting your search terms or clearing active filters.
            </p>
            <button
              onClick={() => { setSearch(""); setCategory(""); setAccess(""); setShowOaisOnly(false); setNavigationPath([]); }}
              className="bg-[#4169E1] text-white font-bold px-8 py-3 rounded-xl text-sm hover:bg-[#3558c8] transition-all shadow-lg hover:-translate-y-0.5"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {!isLoading && currentDepth < 3 && (
          <div className="flex flex-col gap-14">
            {(currentDepth === 0
              ? groupedFolders.flatMap((group) =>
                  group.subfondGroups.map((sfGroup) => ({
                    fonds: group.category,
                    subfonds: sfGroup.subfonds,
                    displayName: sfGroup.displayName,
                    folders: sfGroup.folders,
                  }))
                )
              : currentDepth === 1
              ? groupedFolders
                  .filter((group) => group.category === selectedFonds)
                  .flatMap((group) =>
                    group.subfondGroups
                      .filter((sfGroup) => sfGroup.subfonds === selectedSubfonds)
                      .map((sfGroup) => ({
                        fonds: group.category,
                        subfonds: sfGroup.subfonds,
                        displayName: sfGroup.displayName,
                        folders: sfGroup.folders,
                      }))
                  )
              : groupedFolders
                  .filter((group) => group.category === selectedFonds)
                  .flatMap((group) =>
                    group.subfondGroups
                      .filter((sfGroup) => sfGroup.subfonds === selectedSubfonds)
                      .map((sfGroup) => ({
                        fonds: group.category,
                        subfonds: sfGroup.subfonds,
                        displayName: sfGroup.displayName,
                        folders: sfGroup.folders.filter((f) => f.series === selectedSeries),
                      }))
                  )
            ).map((section) => (
              <div key={`${section.fonds}-${section.subfonds}`} className="animate-fade-in">
                <button
                  onClick={() =>
                    setNavigationPath([
                      { level: "fonds", name: section.fonds },
                      { level: "subfonds", name: section.subfonds },
                    ])
                  }
                  className="w-full text-left flex items-center gap-3 mb-6 pb-3 border-b-2 border-[#4169E1]/20"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4169E1]/15 to-[#4169E1]/5 flex items-center justify-center text-[#4169E1] shadow-sm">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-[#0a1628] tracking-tight">{section.displayName || section.subfonds}</h2>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">
                      {section.folders.reduce((s, f) => s + f.count, 0)} materials across {section.folders.length} series
                    </p>
                  </div>
                  <span className="bg-[#4169E1]/10 text-[#4169E1] px-3 py-1 rounded-full text-xs font-bold ml-auto">{section.folders.length} Series</span>
                </button>

                <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "flex flex-col gap-3"}>
                  {section.folders.map((folder, folderIdx) => (
                          viewMode === "grid" ? (
                            <div
                              key={folder.series}
                              onClick={() => {
                                setNavigationPath([
                                  { level: "fonds", name: section.fonds },
                                  { level: "subfonds", name: section.subfonds },
                                  { level: "series", name: folder.series },
                                ]);
                                window.scrollTo({ top: 300, behavior: "smooth" });
                              }}
                              className="group relative h-[380px] bg-transparent cursor-pointer transition-all duration-500 hover:-translate-y-3 pointer-events-auto"
                            >
                              <div className={`h-[45%] rounded-[30px] rounded-b-none bg-gradient-to-br ${CARD_GRADIENTS[folderIdx % CARD_GRADIENTS.length]} relative overflow-hidden flex items-end justify-center pb-4 shadow-sm`}>
                                <div className="absolute inset-0 bg-black/10 transition-opacity group-hover:opacity-0" />
                                <div className="relative w-40 h-32 flex items-center justify-center -mb-8 transition-transform duration-700 group-hover:-translate-y-4">
                                  {folder.coverImages && folder.coverImages.length > 0 ? (
                                    <>
                                      <div className="absolute w-28 h-36 bg-slate-300 rounded-lg -rotate-12 translate-x-4 blur-sm group-hover:blur-0 transition-all duration-700 overflow-hidden border border-white/20">
                                        {folder.coverImages[2] && <img src={folder.coverImages[2]} className="w-full h-full object-cover opacity-60" />}
                                      </div>
                                      <div className="absolute w-28 h-36 bg-slate-200 rounded-lg rotate-6 -translate-x-4 blur-[2px] group-hover:blur-0 transition-all duration-700 overflow-hidden border border-white/30">
                                        {folder.coverImages[1] && <img src={folder.coverImages[1]} className="w-full h-full object-cover opacity-80" />}
                                      </div>
                                      <div className="absolute w-28 h-36 bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden border border-white/40">
                                        <img src={folder.coverImages[0]} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="absolute w-28 h-36 bg-white/40 rounded-lg -rotate-12 translate-x-4 blur-sm group-hover:blur-0 transition-all duration-700" />
                                      <div className="absolute w-28 h-36 bg-white/60 rounded-lg rotate-6 -translate-x-4 blur-[2px] group-hover:blur-0 transition-all duration-700" />
                                      <div className="absolute w-28 h-36 bg-white rounded-lg shadow-2xl flex flex-col p-4">
                                        <div className="w-12 h-1.5 bg-slate-100 rounded-full mb-3" />
                                        <div className="w-full h-1 bg-slate-50 rounded-full mb-1.5" />
                                        <div className="w-full h-1 bg-slate-50 rounded-full mb-1.5" />
                                        <div className="w-full h-1 bg-slate-50 rounded-full mb-1.5" />
                                        <div className="w-2/3 h-1 bg-slate-50 rounded-full" />
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="h-[55%] bg-[#1A1A1E] rounded-[30px] rounded-t-none p-8 flex flex-col relative z-20 shadow-2xl">
                                <div className="absolute -top-6 left-0 h-8 w-32 bg-[#1A1A1E] rounded-t-2xl z-30 flex items-center px-6">
                                  <span className="text-[10px] font-black text-white/80 uppercase tracking-widest truncate">{folder.series.split(" ")[0]}</span>
                                </div>
                                <div className="mt-2">
                                  <h3 className="text-white text-xl font-bold leading-tight line-clamp-2 mb-2 group-hover:text-[#4169E1] transition-colors">{folder.series}</h3>
                                  <p className="text-white/40 text-xs font-medium">{folder.subfondsDisplayName || folder.subfonds}</p>
                                </div>
                                <div className="mt-auto flex items-center justify-between">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-white/30 text-[11px] font-black uppercase tracking-widest">{folder.count} Digital Files</span>
                                  </div>
                                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ArrowUpRight className="w-4 h-4 text-white" />
                                  </div>
                                </div>
                              </div>
                              <div className="absolute inset-0 rounded-[30px] border border-white/5 pointer-events-none" />
                            </div>
                          ) : (
                            <div
                              key={folder.series}
                              onClick={() => {
                                setNavigationPath([
                                  { level: "fonds", name: section.fonds },
                                  { level: "subfonds", name: section.subfonds },
                                  { level: "series", name: folder.series },
                                ]);
                                window.scrollTo({ top: 300, behavior: "smooth" });
                              }}
                              className="bg-white border border-border/60 rounded-[2rem] p-6 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all cursor-pointer group relative overflow-hidden"
                            >
                              <div className="relative h-48 mb-6 flex items-center justify-center">
                                {folder.coverImages.length > 0 ? (
                                  <div className="relative w-full h-full">
                                    {folder.coverImages.slice(0, 3).map((img, idx) => (
                                      <div
                                        key={idx}
                                        className="absolute inset-0 transition-all duration-500 rounded-2xl overflow-hidden border-2 border-white shadow-xl"
                                        style={{ zIndex: 10 - idx, transform: `translateY(${idx * 12}px) scale(${1 - idx * 0.08}) rotate(${idx * 2}deg)`, opacity: 1 - idx * 0.2 }}
                                      >
                                        <img src={img} className="w-full h-full object-cover" alt="" />
                                        <div className="absolute inset-0 bg-black/10 transition-opacity group-hover:opacity-0" />
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className={`w-32 h-40 rounded-2xl bg-gradient-to-br ${CARD_GRADIENTS[folderIdx % CARD_GRADIENTS.length]} flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform relative`}>
                                    <Folder className="w-12 h-12 text-white/40" />
                                    <div className="absolute inset-x-4 bottom-4 h-1 bg-white/20 rounded-full overflow-hidden">
                                      <div className="w-1/2 h-full bg-white/40" />
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="text-[10px] text-[#4169E1] uppercase tracking-[0.2em] font-black">{folder.subfonds}</p>
                                </div>
                                <h3 className="text-xl font-display font-black text-[#0a1628] leading-tight group-hover:text-[#4169E1] transition-colors">{folder.series}</h3>
                                <div className="flex items-center justify-between mt-4">
                                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl">
                                    <Database className="w-3 h-3 text-slate-400" />
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{folder.count} Items</span>
                                  </div>
                                  <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-[#4169E1] group-hover:text-white transition-all shadow-sm group-hover:shadow-[#4169E1]/30 group-hover:-translate-x-1">
                                    <ArrowRight className="w-5 h-5" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══ LEVEL 2: MATERIALS GRID VIEW ═══ */}
        {!isLoading && currentDepth === 3 && level2Materials.length > 0 && viewMode === "grid" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {level2Materials.map((mat: any, i: number) => {
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
                    className="relative bg-white rounded-[28px] border border-slate-100 overflow-hidden group hover:border-[#4169E1]/30 hover:shadow-[0_30px_60px_rgba(0,0,0,0.12)] transition-all duration-700 cursor-pointer flex flex-col h-full hover:-translate-y-2 pointer-events-auto"
                    onMouseEnter={() => setHoveredCard(mat.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    {/* Cover Section */}
                    <div className="h-[220px] shrink-0 relative overflow-hidden">
                      {showApproval && (
                        <div className={`absolute top-4 right-4 z-20 rounded-full ${approvalBadgeClass} text-white text-[9px] font-black uppercase tracking-wider px-3 py-1.5 shadow-xl shadow-black/20 backdrop-blur-md`}>
                          {approvalStatus}
                        </div>
                      )}
                      
                      {hasCover ? (
                        <>
                          <img
                            src={coverImg}
                            alt={mat.title}
                            className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110 ease-out"
                            loading="lazy"
                            decoding="async"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628] via-transparent to-transparent opacity-80" />
                        </>
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${CARD_GRADIENTS[i % CARD_GRADIENTS.length]} relative group-hover:saturate-150 transition-all duration-700`}>
                          <div className="absolute inset-0 opacity-[0.03]">
                            <div className="grid grid-cols-6 gap-px p-4 h-full">
                              {[...Array(24)].map((_, j) => <div key={j} className="bg-white rounded-sm" />)}
                            </div>
                          </div>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="w-16 h-20 bg-white/10 rounded-2xl border border-white/20 flex items-center justify-center mb-4 backdrop-blur-md group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-2xl">
                              <FileText className="w-8 h-8 text-white/60" />
                            </div>
                            <span className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-black drop-shadow-md">{formatLabel}</span>
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        </div>
                      )}

                      {/* Floating Badges */}
                      <div className="absolute top-4 left-4 flex flex-col gap-2">
                        <div className={`inline-flex items-center gap-2 ${acc.bg} ${acc.text} text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl backdrop-blur-xl shadow-xl ${acc.glow} border border-white/10`}>
                          <AccIcon className="w-3.5 h-3.5" />
                          {acc.label}
                        </div>
                        {checkOAISCompliance(mat) && (
                          <div className="inline-flex items-center gap-1.5 bg-white/10 text-white text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-lg backdrop-blur-md border border-white/10 shadow-lg">
                            <CheckCircle className="w-2.5 h-2.5 text-emerald-400" /> OAIS
                          </div>
                        )}
                      </div>

                      {/* Item ID Overlay */}
                      <div className="absolute bottom-4 left-5 right-5 z-10 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                         {hasCover && <h3 className="font-black text-white text-lg leading-tight line-clamp-2 drop-shadow-2xl mb-1 text-balance">
                           {mat.title}
                         </h3>}
                         <p className="text-[9px] font-mono font-black text-white/50 tracking-[0.3em] uppercase drop-shadow-md">{mat.uniqueId || mat.materialId}</p>
                      </div>
                    </div>

                    {/* Metadata Section */}
                    <div className="p-6 flex flex-col flex-1 relative bg-white">
                      {!hasCover && (
                         <h3 className="font-extrabold text-[#0a1628] text-lg leading-snug mb-3 group-hover:text-[#4169E1] transition-colors line-clamp-2 pr-4">
                           {mat.title}
                         </h3>
                      )}

                      {mat.description && (
                        <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2 mb-6 group-hover:text-slate-600 transition-colors">
                          {mat.description}
                        </p>
                      )}

                      <div className="mt-auto space-y-4">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-50">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                               <Tag className="w-3.5 h-3.5 text-[#4169E1]" />
                            </div>
                             <span className="text-[10px] text-slate-600 font-bold tracking-tight truncate max-w-[100px]">
                               {mat.categoryName || mat.hierarchyPath?.split(" > ")[2] || "Archival Core"}
                             </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                               <Calendar className="w-3.5 h-3.5 text-[#4169E1]" />
                            </div>
                            <span className="text-[10px] font-mono font-black text-slate-400">
                              {mat.date ? (isNaN(new Date(mat.date).getTime()) ? "N/A" : new Date(mat.date).getFullYear()) : "N/A"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between group/btn">
                           <div className="flex items-center gap-1.5">
                             <div className="flex -space-x-2">
                               {[...Array(3)].map((_, i) => (
                                 <div key={i} className="w-5 h-5 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#4169E1]/30" />
                                 </div>
                               ))}
                             </div>
                             <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-1">Metadata Verified</span>
                           </div>
                           <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-[#4169E1] border border-slate-100 group-hover/btn:bg-[#4169E1] group-hover/btn:text-white transition-all duration-300 shadow-sm">
                             <ArrowRight className="w-4 h-4" />
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* ═══ LEVEL 2: MATERIALS LIST VIEW ═══ */}
        {!isLoading && currentDepth === 3 && level2Materials.length > 0 && viewMode === "list" && (
          <div className="space-y-3 animate-fade-in">
            {level2Materials.map((mat: any, i: number) => {
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
                             <img src={mat.pageImages[0]} alt={mat.title} className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105" loading="lazy" decoding="async" />
                             <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
                               <span className="text-[9px] font-bold text-white uppercase tracking-widest">{mat.pageImages.length} Pages</span>
                             </div>
                           </div>
                           {/* Mini horizontal strip below main cover */}
                           <div className="h-10 bg-white border-t border-border/50 flex gap-1 p-1 overflow-x-auto invisible group-hover:visible bg-slate-50 shadow-inner custom-scrollbar-mini">
                              {mat.pageImages.slice(1, 10).map((img: string, idx: number) => (
                                <div key={idx} className="w-8 h-full shrink-0 border border-slate-200 rounded overflow-hidden">
                                   <img src={img} alt={`Page ${idx+2}`} className="w-full h-full object-cover" loading="lazy" decoding="async" />
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
                          <img src={coverImg} alt={mat.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" decoding="async" />
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
                          {mat.date ? (isNaN(new Date(mat.date).getTime()) ? "—" : new Date(mat.date).getFullYear()) : "—"}
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
