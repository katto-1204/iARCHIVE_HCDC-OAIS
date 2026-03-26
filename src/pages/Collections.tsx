import * as React from "react";
import { Link } from "wouter";
import { Search, SlidersHorizontal, Lock, Unlock, ShieldAlert, FileText, Database, X, ChevronRight, ArrowRight, User } from "lucide-react";
import { useGetMaterials, useGetCategories, useGetMe } from "@workspace/api-client-react";

const ACCESS_COLORS = {
  public: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500", label: "Public" },
  restricted: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500", label: "Restricted" },
  confidential: { bg: "bg-red-50", text: "text-[#960000]", border: "border-red-200", dot: "bg-[#960000]", label: "Confidential" },
} as const;

const CARD_COLORS = ["bg-[#0a1628]", "bg-[#4169E1]", "bg-[#960000]", "bg-slate-700", "bg-indigo-800"];

export default function Collections() {
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [category, setCategory] = React.useState<string>("");
  const [access, setAccess] = React.useState<string>("");
  const [showFilters, setShowFilters] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: categories } = useGetCategories();
  const { data, isLoading } = useGetMaterials({ search: debouncedSearch, category, access: access as any, limit: 24 });
  const { data: user } = useGetMe();

  const roleBranding = {
    admin: { bg: "bg-[#002366]", label: "Admin" }, // Deep Royal Blue
    archivist: { bg: "bg-black", label: "Archivist" },
    student: { bg: "bg-[#960000]", label: "Student" }, // Red
  }[user?.role as string] || { bg: "bg-[#0a1628]", label: "" };

  const activeFilters = [
    category && { key: "category", label: categories?.find(c => c.id === category)?.name || category, clear: () => setCategory("") },
    access && { key: "access", label: ACCESS_COLORS[access as keyof typeof ACCESS_COLORS]?.label || access, clear: () => setAccess("") },
  ].filter(Boolean) as { key: string; label: string; clear: () => void }[];

  return (
    <div className="min-h-screen bg-[#f7f8fc] font-sans">
      {/* ─── HEADER ─── */}
      <header className={`${roleBranding.bg} border-b border-white/10 sticky top-0 z-50 transition-colors duration-500`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4 group">
            <img src={`${import.meta.env.BASE_URL}logos/iarchive%20white%20logo.png`} alt="iArchive logo" className="h-11 w-auto object-contain drop-shadow-lg group-hover:scale-105 transition-transform duration-300" />
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
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-white/40 uppercase tracking-tighter">{roleBranding.label}</span>
                <span className="text-sm font-semibold text-white">{user.name}</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                <User className="w-5 h-5 text-white/70" />
              </div>
            </div>
          ) : (
            <Link href="/login">
              <button className="text-sm font-bold text-white bg-[#4169E1] px-5 py-2 rounded-lg hover:bg-[#3558c8] transition-all shadow-lg shadow-black/20">Sign In</button>
            </Link>
          )}
        </div>
      </header>

      {/* ─── HERO BAR ─── */}
      <div className="bg-[#0a1628] pb-10 pt-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-6">
            <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-2">DIGITAL ARCHIVAL REPOSITORY</p>
            <h1 className="text-4xl font-bold text-white">
              Browse the <span className="font-serif italic text-[#4169E1]">Archive</span>
            </h1>
          </div>
          {/* Search Bar */}
          <div className="flex gap-3">
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/40" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search titles, creators, identifiers, descriptions..."
                className="w-full h-12 bg-white/10 border border-white/20 rounded-xl pl-12 pr-4 text-white placeholder:text-white/40 focus:outline-none focus:border-[#4169E1]/60 focus:bg-white/15 transition-all text-sm"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 h-12 rounded-xl border text-sm font-semibold transition-colors ${showFilters ? 'bg-[#4169E1] border-[#4169E1] text-white' : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20'}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters {activeFilters.length > 0 && <span className="bg-white/20 rounded-full w-5 h-5 flex items-center justify-center text-xs">{activeFilters.length}</span>}
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 bg-white/10 border border-white/20 rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-white/60 text-xs font-bold uppercase tracking-wider block mb-2">Collection Series</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#4169E1]/60 [&>option]:bg-[#0a1628] [&>option]:text-white"
                >
                  <option value="">All Series</option>
                  {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-white/60 text-xs font-bold uppercase tracking-wider block mb-2">Access Level</label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { id: "", label: "All" },
                    { id: "public", label: "Public" },
                    { id: "restricted", label: "Restricted" },
                    { id: "confidential", label: "Confidential" },
                  ].map(a => (
                    <button
                      key={a.id}
                      onClick={() => setAccess(a.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${access === a.id ? 'bg-[#4169E1] text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {activeFilters.map(f => (
                <button
                  key={f.key}
                  onClick={f.clear}
                  className="inline-flex items-center gap-1.5 bg-[#4169E1]/30 border border-[#4169E1]/50 text-white text-xs font-medium px-3 py-1 rounded-full hover:bg-[#4169E1]/50 transition-colors"
                >
                  {f.label} <X className="w-3 h-3" />
                </button>
              ))}
              {activeFilters.length > 0 && (
                <button
                  onClick={() => { setCategory(""); setAccess(""); setSearch(""); }}
                  className="text-white/50 text-xs hover:text-white transition-colors px-2"
                >
                  Clear all
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── RESULTS ─── */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Result count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Searching..." : (
              <span><span className="font-bold text-foreground">{data?.total ?? 0}</span> archival materials found</span>
            )}
          </p>
          {data && (data.materials?.length ?? 0) > 0 && (
            <p className="text-xs text-muted-foreground">
              Showing {data.materials?.length ?? 0} of {data.total ?? 0}
            </p>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-border/60 overflow-hidden animate-pulse">
                <div className="h-40 bg-muted" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-muted rounded w-1/3" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && (data?.materials?.length ?? 0) === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mb-6">
              <Search className="w-9 h-9 text-muted-foreground/40" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No materials found</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              No archival materials match your current search. Try adjusting your search terms or clearing filters.
            </p>
            <button
              onClick={() => { setSearch(""); setCategory(""); setAccess(""); }}
              className="bg-[#4169E1] text-white font-semibold px-6 py-2.5 rounded-lg text-sm hover:bg-[#3558c8] transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* Materials Grid */}
        {!isLoading && (data?.materials?.length ?? 0) > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {data?.materials?.map((mat, i) => {
              const acc = ACCESS_COLORS[mat.access as keyof typeof ACCESS_COLORS];
              return (
                <Link key={mat.id} href={`/materials/${mat.id}`}>
                  <div className="bg-white rounded-2xl border border-border/60 overflow-hidden group hover:border-[#4169E1]/30 hover:shadow-lg hover:shadow-[#4169E1]/5 transition-all duration-300 cursor-pointer">
                    {/* Thumbnail / Color preview */}
                    <div className={`h-40 relative overflow-hidden ${mat.thumbnailUrl ? 'bg-muted' : CARD_COLORS[i % CARD_COLORS.length]}`}>
                      {mat.thumbnailUrl ? (
                        <img
                          src={mat.thumbnailUrl}
                          alt={mat.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-6 relative">
                          <div className="absolute inset-0 opacity-5">
                            <div className="grid grid-cols-5 gap-1 p-2">
                              {[...Array(20)].map((_, j) => <div key={j} className="h-4 bg-white rounded" />)}
                            </div>
                          </div>
                          <FileText className="w-10 h-10 text-white/30 group-hover:scale-110 transition-transform duration-300" />
                          <span className="text-[10px] text-white/30 uppercase tracking-widest mt-2 font-bold">
                            {mat.format?.split('/')[1]?.toUpperCase() || 'DOC'}
                          </span>
                        </div>
                      )}
                      {/* Access badge */}
                      {acc && (
                        <div className={`absolute top-3 left-3 inline-flex items-center gap-1.5 ${acc.bg} ${acc.text} ${acc.border} border text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full backdrop-blur-sm bg-opacity-90`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${acc.dot}`} />
                          {acc.label}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <p className="text-[10px] font-mono text-muted-foreground/70 mb-1.5 uppercase tracking-wider">{mat.materialId}</p>
                      <h3 className="font-bold text-[#0a1628] text-sm leading-snug mb-2 group-hover:text-[#4169E1] transition-colors line-clamp-2 h-10">
                        {mat.title}
                      </h3>
                      
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                        <span className="text-[11px] text-muted-foreground font-medium truncate max-w-[110px]">
                          {mat.categoryName || "Uncategorized"}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-medium">
                          {mat.date ? new Date(mat.date).getFullYear() : "—"}
                        </span>
                      </div>

                      {/* Request Access Button for restricted items */}
                      {(mat.access === "restricted" || mat.access === "confidential") && (user?.role !== "admin" && user?.role !== "archivist") && (
                        <div onClick={(e) => e.stopPropagation()}>
                          <Link href={`/request-access?materialId=${mat.id}`}>
                            <button className="w-full mt-4 bg-[#960000] hover:bg-[#7a0000] text-white text-[10px] font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-inner">
                              <Lock className="w-3 h-3" /> Request Access
                            </button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── FOOTER ─── */}
      <footer className="bg-[#0a1628] border-t border-white/10 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[#4169E1] flex items-center justify-center">
              <Database className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-white/60 text-sm">iArchive · Holy Cross of Davao College</span>
          </div>
          <p className="text-white/30 text-xs">© 2026 HCDC. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
