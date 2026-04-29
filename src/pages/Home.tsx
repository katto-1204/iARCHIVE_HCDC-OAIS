import * as React from "react";
import { Link, useLocation } from "wouter";
import {
  Search, Database, Lock, Users, ChevronRight, ArrowRight, LayoutDashboard,
  FolderOpen, Eye, ClipboardList, Settings, LogIn, Sparkles, Menu, X, CheckCircle
} from "lucide-react";
import { PublicLayout } from "@/components/layout";
import { PublicNavbar } from "@/components/PublicNavbar";
import { Button } from "@/components/ui-components";
import { useGetStats, useGetCategories, useGetMaterials, useGetMe } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [, setLocation] = useLocation();
  const { data: stats, isError: statsError } = useGetStats();
  const { data: categories, isError: categoriesError } = useGetCategories();
  const { data: materials, isError: materialsError } = useGetMaterials({ limit: 1000 });
  const { data: user } = useGetMe();
  const [scrollY, setScrollY] = React.useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    if (statsError || categoriesError || materialsError) {
      toast({ title: "Connection Issue", description: "Some archive data could not be loaded. Please refresh.", variant: "destructive" });
    }
  }, [statsError, categoriesError, materialsError]);

  React.useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-visible");
            // Also apply to children with reveal-up
            entry.target.querySelectorAll('.reveal-up').forEach(c => c.classList.add('reveal-visible'));

            const children = entry.target.querySelectorAll('[data-stagger]');
            children.forEach((child, idx) => {
              (child as HTMLElement).style.transitionDelay = `${idx * 120}ms`;
              child.classList.add('reveal-visible');
              child.querySelectorAll('.reveal-up').forEach(c => c.classList.add('reveal-visible'));
            });
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px -50px 0px' },
    );

    const observeNodes = () => {
      document.querySelectorAll("[data-reveal], .reveal-up, [data-stagger]").forEach((el) => observer.observe(el));
    };

    observeNodes();
    const mo = new MutationObserver(observeNodes);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => { observer.disconnect(); mo.disconnect(); };
  }, []);


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
      actions: ["Browse public collections", "Search materials", "Request restricted access", "View preservation metadata"],
      cta: "Register Now",
      href: "/register",
    },
  ];

  const catColors = [
    "bg-[#0a1628]",
    "bg-[#960000]",
    "bg-[#1a3a6e]",
    "bg-[#4169E1]",
    "bg-slate-700",
  ];

  const featuredCollections = React.useMemo(() => {
    const cats = Array.isArray(categories) ? categories : [];
    // Only consider subfonds for featured collections on the landing page
    const subfonds = cats.filter((c: any) => c.level === "subfonds");

    return subfonds
      .sort((a: any, b: any) => {
        // Primary sort: isFeatured flag
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        // Secondary sort: material count
        return (b.materialCount || 0) - (a.materialCount || 0);
      })
      .slice(0, 3) // Show top 3
      .map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description || `Collection of ${item.name}`,
        materialCount: item.materialCount,
        href: `/collections?subfonds=${encodeURIComponent(item.name)}`,
      }));
  }, [categories]);

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ─── NAVBAR ─── */}
      <PublicNavbar isTransparentOnTop={true} />

      {/* Error toasts replace the old banner */}



      {/* ─── HERO ─── */}
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center overflow-hidden bg-[#0a1628] pt-24">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{
            backgroundImage: `url(${import.meta.env.BASE_URL}images/hcdchero.png)`,
            transform: `translateY(${scrollY * 0.1}px)`,
          }}
        />
        <div className="absolute inset-0">
          {/* Dark red hero wash */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#3a0000]/95 via-[#240000]/70 to-[#0a1628]/85" />
          {/* Static glows - removed float animations */}
          <div className="absolute -top-24 -right-24 h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(150,0,0,0.4),_transparent_55%)] blur-3xl" />
          <div className="absolute -bottom-32 -left-32 h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(65,105,225,0.2),_transparent_58%)] blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(150,0,0,0.1),_transparent_60%)] blur-2xl" />
          {/* Soft grain */}
          <div className="absolute inset-0 opacity-[0.06] mix-blend-overlay pointer-events-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22160%22%20height%3D%22160%22%3E%3Cfilter%20id%3D%22n%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.9%22%20numOctaves%3D%223%22%20stitchTiles%3D%22stitch%22/%3E%3C/filter%3E%3Crect%20width%3D%22160%22%20height%3D%22160%22%20filter%3D%22url(%23n)%22%20opacity%3D%220.55%22/%3E%3C/svg%3E')]" />
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white to-transparent" />
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto hero-content" style={{ opacity: Math.max(1 - scrollY / 600, 0) }}>
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-8">
            <Sparkles className="w-3.5 h-3.5 text-[#ff4444]" />
            <span className="text-white/80 text-xs font-medium tracking-widest uppercase">Holy Cross of Davao College · Est. 1951</span>
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.08] mb-6">
            Preserving HCDC's<br />
            <span className="font-serif italic text-white/90">institutional memory,</span><br />
            <span className="font-serif italic text-white/90">digitally <span className="text-[#ff2222] drop-shadow-[0_0_20px_rgba(255,34,34,0.5)]">forever.</span></span>
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto mb-10 leading-relaxed font-light">
            iArchive is HCDC's secure, OAIS-aligned digital repository — built to preserve, organize,
            and provide controlled access to the institution's historical records and research materials.
          </p>
          <div className="flex justify-center">
            <Link href="/collections">
              <button className="inline-flex items-center gap-2 bg-[#4169E1] hover:bg-[#3558c8] text-white font-semibold px-8 py-3.5 rounded-full transition-colors shadow-lg">
                <Search className="w-4 h-4" /> Explore Archive
              </button>
            </Link>
          </div>
        </div>

        {/* Mini stats strip inside hero bottom */}
        <div className="relative z-10 mt-16 flex items-center gap-12 bg-white/5 border border-white/10 backdrop-blur-md rounded-full px-10 py-5 animate-fade-in-up" style={{ animationDelay: '1s' }}>
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


      {/* ─── FEATURED COLLECTIONS ─── */}
      <section className="py-20 bg-white" data-reveal>
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
            {(featuredCollections.length > 0
              ? featuredCollections
              : [
                { id: "1", name: "Yearbooks", description: "Annual yearbook collection" },
                { id: "2", name: "Faculty Publications", description: "Academic research and publications" },
                { id: "3", name: "Digital Materials", description: "Born-digital institutional records" },
              ]
            ).map((cat, i) => (
              <Link key={cat.id} href={(cat as any).href || `/collections?category=${cat.id}`}>
                <div data-stagger className={`reveal-up ${catColors[i % catColors.length]} rounded-2xl overflow-hidden group cursor-pointer hover:scale-[1.03] transition-all duration-500 shadow-lg hover:shadow-2xl h-[340px] flex flex-col`}>
                  <div className="h-40 flex items-center justify-center relative overflow-hidden shrink-0">
                    <div className="absolute inset-0 opacity-10">
                      <div className="grid grid-cols-6 gap-2 p-4">
                        {[...Array(24)].map((_, j) => <div key={j} className="h-6 bg-white rounded" />)}
                      </div>
                    </div>
                    <FolderOpen className="w-16 h-16 text-white/30 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-1">COLLECTION SERIES</p>
                    <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 leading-snug">{cat.name}</h3>
                    <p className="text-sm text-white/60 line-clamp-2 flex-1">{cat.description || 'Archival materials from this institutional collection series.'}</p>
                    {!!(cat as any).materialCount && (
                      <p className="text-[11px] text-white/70 font-semibold mt-2">{(cat as any).materialCount} materials</p>
                    )}
                    <div className="mt-3 flex items-center gap-2 text-white/70 text-sm font-medium group-hover:text-white transition-colors">
                      Browse Series <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DARK PREVIEW SECTION ─── */}
      <section className="py-20 bg-[#0a1628] relative overflow-hidden" data-reveal>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#4169E1/20,_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_#960000/15,_transparent_60%)]" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left: Admin preview mockup */}
            <div className="reveal-up bg-[#111d30] rounded-2xl border border-white/10 overflow-hidden shadow-2xl" data-stagger>
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
            <div className="reveal-up" data-stagger>
              <p className="text-xs font-semibold text-[#4169E1] uppercase tracking-widest mb-4">ADMIN CONTROL CENTER</p>
              <h2 className="text-4xl font-bold text-white mb-6">
                Preserving HCDC's<br />
                <span className="font-serif italic text-white/80">Institutional Memory</span>
              </h2>
              <p className="text-white/60 leading-relaxed mb-8">
                A comprehensive administrative dashboard gives archivists full control over the ingestion pipeline, metadata quality, user access, and system integrity — aligned with OAIS and the ISO 14721:2012 preservation framework.
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

      {/* ─── WHO USES IARCHIVE ─── */}
      <section className="py-20 bg-[#f7f8fc]" data-reveal>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-semibold text-[#4169E1] uppercase tracking-widest mb-3">FOR EVERYONE AT HCDC</p>
            <h2 className="text-4xl font-bold text-[#0a1628]">Who Uses <span className="font-serif italic text-[#4169E1]">iArchive</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {userTypes.map((u, i) => (
              <div key={i} data-stagger className={`reveal-up ${u.color} ${u.border || ''} rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-500`}>
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
      <section className="py-14 bg-[#0a1628]" data-reveal>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { num: `${stats?.totalMaterials ?? 8}`, label: "Archival Materials", color: "text-[#4169E1]" },
              { num: "25+", label: "Years of History", color: "text-[#ff2222]" },
              { num: `${stats?.totalCategories ?? 5}`, label: "Archival Sub-fonds", color: "text-[#4169E1]" },
              { num: "3", label: "Access Tiers", color: "text-white" },
            ].map((s, i) => (
              <div key={i} data-stagger className="reveal-up">
                <div className={`text-5xl font-bold ${s.color} mb-2`}>{s.num}</div>
                <div className="text-sm text-white/40 uppercase tracking-widest">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-24 bg-white reveal-up" id="contact" data-reveal>
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

      {/* ─── PREMIUM FOOTER ─── */}
      <footer className="bg-[#050a14] border-t border-white/5 pt-20 pb-10 relative overflow-hidden">
        {/* Abstract background glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#4169E1]/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
            <div className="md:col-span-4">
              <div className="flex items-center gap-3 mb-6 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4169E1] to-[#2a4dbd] flex items-center justify-center shadow-lg shadow-[#4169E1]/20 group-hover:scale-110 transition-transform">
                  <Database className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-black text-xl tracking-tight leading-none">iArchive</span>
                  <span className="text-[9px] font-black tracking-[0.2em] text-[#4169E1] uppercase">Digital Repository</span>
                </div>
              </div>
              <p className="text-white/40 text-sm leading-relaxed max-w-sm mb-8">
                Holy Cross of Davao College's official digital archival collection system. Ensuring institutional memory is preserved, protected, and accessible for future generations using OAIS standards.
              </p>
              <div className="flex items-center gap-4">
                {/* Social placeholders or badges */}
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-[#4169E1] hover:border-[#4169E1]/30 transition-all cursor-pointer">
                  <span className="text-[10px] font-bold">HCDC</span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-[#4169E1] hover:border-[#4169E1]/30 transition-all cursor-pointer">
                  <span className="text-[10px] font-bold">ARC</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 md:ml-auto">
              <h4 className="text-white font-bold text-xs mb-6 uppercase tracking-[0.2em] text-white/80">Platform</h4>
              <ul className="space-y-4">
                {[{ l: "Browse Archive", h: "/collections" }, { l: "About iArchive", h: "/about" }, { l: "Features", h: "/features" }, { l: "System Login", h: "/login" }, { l: "Register", h: "/register" }].map((lnk, i) => (
                  <li key={i}><Link href={lnk.h} className="text-white/40 hover:text-[#4169E1] text-sm transition-colors font-medium">{lnk.l}</Link></li>
                ))}
              </ul>
            </div>

            <div className="md:col-span-3">
              <h4 className="text-white font-bold text-xs mb-6 uppercase tracking-[0.2em] text-white/80">Archival Standards</h4>
              <ul className="space-y-4">
                {["OAIS (ISO 14721:2012)", "ISAD(G) 2nd Edition", "Dublin Core Metadata Set", "SHA-256 Data Integrity"].map((s, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-white/30 text-sm font-medium">
                    <div className="w-1 h-1 rounded-full bg-[#4169E1]" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            <div className="md:col-span-3">
              <h4 className="text-white font-bold text-xs mb-6 uppercase tracking-[0.2em] text-white/80">Support</h4>
              <Link href="/feedback">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-[#4169E1]/30 hover:bg-[#4169E1]/5 transition-all group cursor-pointer">
                  <p className="text-white font-bold text-sm mb-1 group-hover:text-[#4169E1] transition-colors">Submit Feedback</p>
                  <p className="text-white/40 text-[11px] leading-tight">Help us improve the HCDC digital experience.</p>
                </div>
              </Link>
            </div>
          </div>

          <div className="border-t border-white/5 pt-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col md:items-start items-center">
              <p className="text-white/30 text-[11px] font-medium uppercase tracking-wider mb-1">© 2026 Holy Cross of Davao College</p>
              <p className="text-white/20 text-[9px]">Designed & Engineered for Institutional Excellence.</p>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/terms" className="text-white/30 hover:text-white text-[10px] uppercase font-bold tracking-widest transition-colors">Terms of Use</Link>
              <Link href="/privacy" className="text-white/30 hover:text-white text-[10px] uppercase font-bold tracking-widest transition-colors">Privacy Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
