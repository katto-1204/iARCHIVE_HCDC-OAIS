import * as React from "react";
import { Link } from "wouter";
import {
  Search, Shield, Database, Lock, CheckCircle, GitBranch, BookOpen,
  Users, FileSearch, ChevronRight, Download, ArrowRight, LayoutDashboard,
  FolderOpen, Eye, ClipboardList, Settings, LogIn
} from "lucide-react";
import { PublicLayout } from "@/components/layout";
import { Button } from "@/components/ui-components";
import { useGetStats, useGetCategories, useGetMaterials } from "@workspace/api-client-react";

export default function Home() {
  const { data: stats, isError: statsError } = useGetStats();
  const { data: categories, isError: categoriesError } = useGetCategories();
  const { data: materials, isError: materialsError } = useGetMaterials({ params: { limit: 3 } });
  const [scrollY, setScrollY] = React.useState(0);

  React.useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("reveal-visible");
        });
      },
      { threshold: 0.12 },
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const features = [
    { icon: FileSearch, title: "Full-Text Search", desc: "Search across all metadata fields including ISAD(G) descriptions, identifiers, and Dublin Core elements." },
    { icon: Database, title: "ISAD(G) Metadata", desc: "Full compliance with international standards for archival description and metadata structure." },
    { icon: Lock, title: "Role-Based Access Control", desc: "Granular permissions separating Public, Restricted, and Confidential materials by user clearance." },
    { icon: Shield, title: "Preservation Integrity", desc: "Automated SHA-256 fixity checks and OAIS-compliant AIP generation keep records verifiably authentic." },
    { icon: GitBranch, title: "Access Request Workflow", desc: "Researchers can petition for restricted material access with an integrated approval system." },
    { icon: CheckCircle, title: "Audit Logging", desc: "Every action is recorded. Know exactly who viewed, downloaded, or modified any record." },
  ];

  const accessLevels = [
    {
      label: "PUBLIC",
      title: "Open Access",
      color: "text-[#4169E1]",
      border: "border-[#4169E1]/30",
      bg: "bg-[#4169E1]/5",
      dot: "bg-[#4169E1]",
      desc: "Freely accessible to all visitors. No account required to view or download these materials.",
      examples: ["HCDC Yearbooks", "Historical photographs", "Public bulletins"],
    },
    {
      label: "CONFIDENTIAL",
      title: "Confidential Materials",
      color: "text-[#960000]",
      border: "border-[#960000]/30",
      bg: "bg-[#960000]/5",
      dot: "bg-[#960000]",
      desc: "Strictly protected records accessible only to administrators and designated archivists.",
      examples: ["Administrative records", "Personnel files", "Financial documents"],
    },
    {
      label: "RESTRICTED",
      title: "Restricted Access",
      color: "text-amber-600",
      border: "border-amber-300",
      bg: "bg-amber-50",
      dot: "bg-amber-500",
      desc: "Requires an approved access request. Researchers and faculty may apply for permission.",
      examples: ["Student research theses", "Faculty publications", "Institutional surveys"],
    },
  ];

  const userTypes = [
    {
      role: "Administrator",
      icon: Settings,
      color: "bg-[#0a1628]",
      textColor: "text-white",
      desc: "Full system control including user management, material ingestion, and audit oversight.",
      actions: ["Manage all users", "Approve/reject access requests", "Configure system settings", "View complete audit logs"],
      cta: "Login as Admin",
      href: "/login",
    },
    {
      role: "Archivist",
      icon: Database,
      color: "bg-[#4169E1]",
      textColor: "text-white",
      desc: "Responsible for cataloguing materials, managing metadata, and processing access requests.",
      actions: ["Ingest new materials", "Edit ISAD(G) metadata", "Process access requests", "Generate preservation reports"],
      cta: "Login as Archivist",
      href: "/login",
    },
    {
      role: "Public User",
      icon: Users,
      color: "bg-white",
      textColor: "text-foreground",
      border: "border border-border",
      desc: "Browse public collections freely. Register to request access to restricted materials.",
      actions: ["Browse public collections", "Search materials", "Request restricted access", "Download public items"],
      cta: "Register Now",
      href: "/register",
    },
  ];

  const steps = [
    { num: "01", icon: Search, title: "Browse & Search", desc: "Explore the full archival collection using keyword search, category filters, and date ranges.", color: "bg-[#4169E1]" },
    { num: "02", icon: BookOpen, title: "Request Access", desc: "Submit an access request for restricted materials, providing your research purpose and credentials.", color: "bg-[#960000]" },
    { num: "03", icon: Download, title: "View & Download", desc: "Once approved, access and download archival materials with full preservation metadata attached.", color: "bg-emerald-600" },
  ];

  const catColors = [
    "bg-[#0a1628]",
    "bg-[#960000]",
    "bg-[#1a3a6e]",
    "bg-[#4169E1]",
    "bg-slate-700",
  ];

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ─── NAVBAR ─── */}
      <header className="fixed top-4 inset-x-0 z-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="h-16 flex items-center justify-between px-5 rounded-2xl bg-[#0a1628]/85 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/30">
          <Link href="/" className="flex items-center gap-2.5">
            <img src={`${import.meta.env.BASE_URL}logos/iarchive%20white%20logo.png`} alt="iArchive logo" className="h-8 w-auto object-contain" />
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
            <Link href="/collections" className="hover:text-white transition-colors">Collections</Link>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <Link href="/about" className="hover:text-white transition-colors">About OAIS</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          </nav>
          <Link href="/login">
            <button className="flex items-center gap-2 bg-[#960000] hover:bg-[#7a0000] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
              <LogIn className="w-4 h-4" /> Login
            </button>
          </Link>
          </div>
        </div>
      </header>

      {(statsError || categoriesError || materialsError) && (
        <div className="fixed top-16 inset-x-0 z-40 bg-[#960000] text-white text-center text-xs py-2">
          Some archive data could not be loaded. Please refresh or try again shortly.
        </div>
      )}

      {/* ─── HERO ─── */}
      <section className="relative min-h-[88vh] flex flex-col items-center justify-center overflow-hidden bg-[#0a1628] pt-24">
        <div
          className="absolute inset-0 bg-cover bg-center scale-105 opacity-55"
          style={{
            backgroundImage: `url(${import.meta.env.BASE_URL}images/hcdchero.png)`,
            transform: `translateY(${Math.min(scrollY * 0.25, 120)}px) scale(1.08)`,
          }}
        />
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#4a0000]/85 via-[#2f0000]/55 to-[#0a1628]/75" />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto reveal-up" data-reveal>
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4169E1] animate-pulse" />
            <span className="text-white/80 text-xs font-medium tracking-widest uppercase">Holy Cross of Davao College · Est. 1951</span>
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.08] mb-6">
            Preserving HCDC's<br />
            <span className="font-serif italic text-white/90">institutional memory,</span><br />
            <span className="font-serif italic text-white/90">digitally <span className="text-[#4169E1]">forever.</span></span>
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto mb-10 leading-relaxed font-light">
            iArchive is HCDC's secure, OAIS-compliant digital repository — built to preserve, organize,
            and provide controlled access to the institution's historical records and research materials.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/collections">
              <button className="inline-flex items-center gap-2 bg-[#4169E1] hover:bg-[#3558c8] text-white font-semibold px-7 py-3.5 rounded-lg transition-all shadow-lg shadow-[#4169E1]/30 hover:shadow-xl hover:shadow-[#4169E1]/40">
                <Search className="w-4 h-4" /> Explore Archive
              </button>
            </Link>
            <Link href="/login">
              <button className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-7 py-3.5 rounded-lg transition-all backdrop-blur-sm">
                Login to iArchive <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>

        {/* Mini stats strip inside hero bottom */}
        <div className="relative z-10 mt-16 flex items-center gap-12 bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl px-10 py-5">
          {[
            { num: stats?.totalMaterials ?? "—", label: "Materials" },
            { num: stats?.totalCategories ?? "—", label: "Collections" },
            { num: "1951", label: "Oldest Record" },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl font-bold text-white">{s.num}</div>
              <div className="text-xs text-white/50 uppercase tracking-widest mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <section className="bg-white border-b border-border/60 py-4 reveal-up" data-reveal>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex items-center gap-6 flex-1 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{stats?.totalMaterials || 0} <span className="text-[#4169E1]">Materials</span></span>
              <span className="w-px h-4 bg-border" />
              <span className="font-semibold text-foreground">{stats?.totalCategories || 0} <span className="text-[#960000]">Series</span></span>
              <span className="w-px h-4 bg-border" />
              <span className="font-semibold text-foreground">{stats?.totalUsers || 0} <span className="text-foreground/60">Users</span></span>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  placeholder="Quick search..."
                  className="pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-muted/40 focus:outline-none focus:border-[#4169E1] w-56 transition-all"
                  onKeyDown={(e) => { if (e.key === 'Enter') window.location.href = '/collections'; }}
                />
              </div>
              <Link href="/collections">
                <button className="bg-[#0a1628] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#4169E1] transition-colors">
                  Search
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURED COLLECTIONS ─── */}
      <section className="py-20 bg-white reveal-up" data-reveal>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-semibold text-[#4169E1] uppercase tracking-widest mb-2">BROWSE OUR ARCHIVE</p>
              <h2 className="text-4xl font-bold text-[#0a1628]">
                Featured <span className="text-[#4169E1]">Collections</span>
              </h2>
            </div>
            <Link href="/collections">
              <button className="flex items-center gap-2 text-sm font-semibold text-[#4169E1] border border-[#4169E1]/30 px-4 py-2 rounded-lg hover:bg-[#4169E1]/5 transition-colors">
                View All Collections <ChevronRight className="w-4 h-4" />
              </button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(Array.isArray(categories)
              ? categories.slice(0, 3)
              : [
                  { id: "1", name: "Yearbooks", description: "Annual yearbook collection" },
                  { id: "2", name: "Faculty Publications", description: "Academic research and publications" },
                  { id: "3", name: "Digital Materials", description: "Born-digital institutional records" },
                ]
            ).map((cat, i) => (
              <Link key={cat.id} href={`/collections?category=${cat.id}`}>
                <div className={`${catColors[i % catColors.length]} rounded-2xl overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform duration-300 shadow-lg`}>
                  <div className="h-44 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10">
                      <div className="grid grid-cols-6 gap-2 p-4">
                        {[...Array(24)].map((_, j) => <div key={j} className="h-6 bg-white rounded" />)}
                      </div>
                    </div>
                    <FolderOpen className="w-16 h-16 text-white/30 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div className="p-5">
                    <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-1">COLLECTION SERIES</p>
                    <h3 className="text-xl font-bold text-white mb-2">{cat.name}</h3>
                    <p className="text-sm text-white/60 line-clamp-2">{cat.description || 'Archival materials from this institutional collection series.'}</p>
                    <div className="mt-4 flex items-center gap-2 text-white/70 text-sm font-medium group-hover:text-white transition-colors">
                      Browse Series <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="py-20 bg-[#f7f8fc] reveal-up" data-reveal>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-semibold text-[#4169E1] uppercase tracking-widest mb-3">WHY IARCHIVE</p>
            <h2 className="text-4xl font-bold text-[#0a1628]">
              Built for <span className="font-serif italic text-[#4169E1]">archival excellence</span>
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              iArchive implements strict international standards to ensure digital materials remain
              accessible, authentic, and securely preserved for generations.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-white rounded-2xl p-7 border border-border/60 hover:border-[#4169E1]/30 hover:shadow-lg hover:shadow-[#4169E1]/5 transition-all duration-300 group">
                <div className="w-12 h-12 rounded-xl bg-[#4169E1]/10 flex items-center justify-center mb-5 group-hover:bg-[#4169E1]/20 transition-colors">
                  <f.icon className="w-6 h-6 text-[#4169E1]" />
                </div>
                <h3 className="text-lg font-bold text-[#0a1628] mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-semibold text-[#960000] uppercase tracking-widest mb-3">GETTING STARTED</p>
            <h2 className="text-4xl font-bold text-[#0a1628]">
              How <span className="font-serif italic text-[#4169E1]">iArchive</span> Works
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-10 left-[22%] right-[22%] h-px bg-gradient-to-r from-[#4169E1]/30 via-[#960000]/30 to-emerald-500/30" />
            {steps.map((step, i) => (
              <div key={i} className="text-center relative">
                <div className={`w-20 h-20 ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                  <step.icon className="w-9 h-9 text-white" />
                </div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 bg-white border border-border text-xs font-bold text-muted-foreground px-2 py-0.5 rounded-full">{step.num}</div>
                <h3 className="text-xl font-bold text-[#0a1628] mb-3">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DARK PREVIEW SECTION ─── */}
      <section className="py-20 bg-[#0a1628] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#4169E1/20,_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_#960000/15,_transparent_60%)]" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left: Admin preview mockup */}
            <div className="bg-[#111d30] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
              <div className="border-b border-white/10 px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#960000]/70" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
                </div>
                <div className="flex-1 mx-4 bg-white/5 rounded px-3 py-1 text-xs text-white/30 font-mono">iarchive.hcdc.edu.ph/admin</div>
              </div>
              <div className="flex h-64">
                <div className="w-44 bg-[#4169E1]/20 border-r border-white/10 p-3 space-y-1.5">
                  {[{ icon: LayoutDashboard, l: "Dashboard" }, { icon: Database, l: "Collections" }, { icon: FolderOpen, l: "Categories" }, { icon: Users, l: "Users" }, { icon: ClipboardList, l: "Audit Logs" }].map((item, i) => (
                    <div key={i} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium ${i === 0 ? 'bg-[#4169E1] text-white' : 'text-white/50 hover:bg-white/10'}`}>
                      <item.icon className="w-3.5 h-3.5" />
                      {item.l}
                    </div>
                  ))}
                </div>
                <div className="flex-1 p-4 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {[{ l: "Materials", n: stats?.totalMaterials ?? 8, c: "text-[#4169E1]" }, { l: "Pending", n: stats?.pendingRequests ?? 0, c: "text-[#960000]" }, { l: "Users", n: stats?.totalUsers ?? 3, c: "text-emerald-400" }].map((s, i) => (
                      <div key={i} className="bg-white/5 rounded-xl p-3">
                        <div className={`text-xl font-bold ${s.c}`}>{s.n}</div>
                        <div className="text-[10px] text-white/40 uppercase tracking-wider">{s.l}</div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 space-y-2">
                    <div className="text-xs text-white/40 font-semibold uppercase tracking-wider">Recent Activity</div>
                    {["Material ingested: HCDC Yearbook 2023", "User approved: researcher@hcdc.edu.ph", "Access request granted for thesis materials"].map((a, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-white/60">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#4169E1]" />
                        {a}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {/* Right: Copy */}
            <div>
              <p className="text-xs font-semibold text-[#4169E1] uppercase tracking-widest mb-4">ADMIN CONTROL CENTER</p>
              <h2 className="text-4xl font-bold text-white mb-6">
                Preserving HCDC's<br />
                <span className="font-serif italic text-white/80">Institutional Memory</span>
              </h2>
              <p className="text-white/60 leading-relaxed mb-8">
                A comprehensive administrative dashboard gives archivists full control over the ingestion pipeline, metadata quality, user access, and system integrity — all compliant with OAIS and ISO 14721:2012 preservation standards.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                {["ISAD(G) Cataloguing", "Dublin Core Metadata", "Access Request Review", "Audit Trail Export"].map((f, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm text-white/70">
                    <CheckCircle className="w-4 h-4 text-[#4169E1] shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <Link href="/login">
                  <button className="bg-[#4169E1] hover:bg-[#3558c8] text-white font-semibold px-6 py-3 rounded-lg transition-colors text-sm">
                    Explore Archive
                  </button>
                </Link>
                <Link href="/register">
                  <button className="border border-white/20 hover:bg-white/10 text-white font-semibold px-6 py-3 rounded-lg transition-colors text-sm">
                    Request Access
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── ACCESS LEVELS ─── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-semibold text-[#960000] uppercase tracking-widest mb-3">PERMISSIONS FRAMEWORK</p>
            <h2 className="text-4xl font-bold text-[#0a1628]">
              Material: <span className="font-serif italic text-[#4169E1]">Access Levels</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              iArchive enforces strict access control so every material is shared only with the right audience.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {accessLevels.map((al, i) => (
              <div key={i} className={`rounded-2xl border-2 ${al.border} ${al.bg} p-7`}>
                <div className="flex items-center gap-2 mb-4">
                  <span className={`w-2.5 h-2.5 rounded-full ${al.dot}`} />
                  <span className={`text-xs font-bold tracking-widest ${al.color}`}>{al.label}</span>
                </div>
                <h3 className="text-xl font-bold text-[#0a1628] mb-3">{al.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">{al.desc}</p>
                <div className="space-y-2">
                  {al.examples.map((ex, j) => (
                    <div key={j} className="flex items-center gap-2 text-sm text-foreground/70">
                      <ChevronRight className={`w-3.5 h-3.5 ${al.color}`} />
                      {ex}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHO USES IARCHIVE ─── */}
      <section className="py-20 bg-[#f7f8fc]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-semibold text-[#4169E1] uppercase tracking-widest mb-3">FOR EVERYONE AT HCDC</p>
            <h2 className="text-4xl font-bold text-[#0a1628]">Who Uses <span className="font-serif italic text-[#4169E1]">iArchive</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {userTypes.map((u, i) => (
              <div key={i} className={`${u.color} ${u.border || ''} rounded-2xl overflow-hidden shadow-lg`}>
                <div className="p-7">
                  <div className={`w-12 h-12 rounded-xl ${i === 2 ? 'bg-[#4169E1]/10' : 'bg-white/15'} flex items-center justify-center mb-5`}>
                    <u.icon className={`w-6 h-6 ${i === 2 ? 'text-[#4169E1]' : 'text-white'}`} />
                  </div>
                  <h3 className={`text-xl font-bold mb-3 ${u.textColor}`}>{u.role}</h3>
                  <p className={`text-sm leading-relaxed mb-5 ${i === 2 ? 'text-muted-foreground' : 'text-white/70'}`}>{u.desc}</p>
                  <ul className="space-y-2 mb-6">
                    {u.actions.map((a, j) => (
                      <li key={j} className={`flex items-center gap-2 text-sm ${i === 2 ? 'text-foreground/70' : 'text-white/60'}`}>
                        <CheckCircle className={`w-3.5 h-3.5 shrink-0 ${i === 2 ? 'text-[#4169E1]' : 'text-white/40'}`} />
                        {a}
                      </li>
                    ))}
                  </ul>
                  <Link href={u.href}>
                    <button className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${i === 2 ? 'bg-[#4169E1] text-white hover:bg-[#3558c8]' : 'bg-white/15 hover:bg-white/25 text-white'}`}>
                      {u.cta}
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STATS COUNTER BAR ─── */}
      <section className="py-14 bg-[#0a1628]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { num: `${stats?.totalMaterials ?? 8}`, label: "Archival Materials", color: "text-[#4169E1]" },
              { num: "25+", label: "Years of History", color: "text-[#960000]" },
              { num: `${stats?.totalCategories ?? 5}`, label: "Collection Series", color: "text-[#4169E1]" },
              { num: "3", label: "Access Tiers", color: "text-white" },
            ].map((s, i) => (
              <div key={i}>
                <div className={`text-5xl font-bold ${s.color} mb-2`}>{s.num}</div>
                <div className="text-sm text-white/40 uppercase tracking-widest">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-24 bg-white" id="contact">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-xs font-semibold text-[#4169E1] uppercase tracking-widest mb-4">GET STARTED TODAY</p>
          <h2 className="text-5xl font-bold text-[#0a1628] mb-6">
            Access HCDC's <span className="font-serif italic text-[#4169E1]">Preserved</span><br />Heritage
          </h2>
          <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
            Join researchers, alumni, faculty, and students accessing Holy Cross of Davao College's rich institutional history through iArchive.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <button className="inline-flex items-center gap-2 bg-[#0a1628] hover:bg-[#4169E1] text-white font-semibold px-8 py-3.5 rounded-lg transition-colors text-sm">
                Request an Account
              </button>
            </Link>
            <Link href="/collections">
              <button className="inline-flex items-center gap-2 border-2 border-[#4169E1]/30 hover:border-[#4169E1] text-[#4169E1] font-semibold px-8 py-3.5 rounded-lg transition-colors text-sm">
                Browse Collections <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-[#0a1628] border-t border-white/10 py-14">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#4169E1] flex items-center justify-center">
                  <Database className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-bold text-lg">iArchive</span>
              </div>
              <p className="text-white/40 text-sm leading-relaxed max-w-xs">
                Holy Cross of Davao College's official digital archival collection system. OAIS-compliant and ISO 14721:2012 certified.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Navigate</h4>
              <ul className="space-y-2.5">
                {[{ l: "Collections", h: "/collections" }, { l: "Login", h: "/login" }, { l: "Register", h: "/register" }].map((lnk, i) => (
                  <li key={i}><Link href={lnk.h} className="text-white/40 hover:text-white text-sm transition-colors">{lnk.l}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Standards</h4>
              <ul className="space-y-2.5">
                {["OAIS (ISO 14721)", "ISAD(G)", "Dublin Core", "SHA-256 Fixity"].map((s, i) => (
                  <li key={i} className="text-white/40 text-sm">{s}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/30 text-sm">© 2026 Holy Cross of Davao College. iArchive Digital Archival Collection System.</p>
            <p className="text-white/20 text-xs">All rights reserved. Unauthorized reproduction prohibited.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
