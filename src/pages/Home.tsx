import * as React from "react";
import { Link, useLocation } from "wouter";
import {
  Search, Shield, Database, Lock, CheckCircle, GitBranch, BookOpen,
  Users, FileSearch, ChevronRight, ArrowRight, LayoutDashboard,
  FolderOpen, Eye, ClipboardList, Settings, LogIn, Sparkles, Activity,
  FileText, ShieldCheck, Menu, X
} from "lucide-react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { PublicLayout } from "@/components/layout";
import { Button } from "@/components/ui-components";
import { useGetStats, useGetCategories, useGetMaterials, useGetMe } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [, setLocation] = useLocation();
  const targetRef = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: targetRef });
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-82%"]);

  // Smoother transition for the transform
  const springX = useSpring(x, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });
  const { data: stats, isError: statsError } = useGetStats();
  const { data: categories, isError: categoriesError } = useGetCategories();
  const { data: materials, isError: materialsError } = useGetMaterials({ limit: 3 });
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

  const features = [
    { icon: FileSearch, title: "Full-Text Search", desc: "Instantly search across millions of metadata fields, ISAD(G) descriptions, and Dublin Core elements with OCR-powered accuracy." },
    { icon: Database, title: "ISAD(G) Metadata", desc: "Rigorous adherence to international archival standards ensures every record is described with its full multi-level provenance." },
    { icon: Lock, title: "Role-Based Access", desc: "Advanced security protocols separate Public, Restricted, and Confidential materials based on verified institutional clearance levels." },
    { icon: Shield, title: "Fixity & Integrity", desc: "Automated SHA-256 bit-level checks ensure your archival information packages (AIP) remain authentic and unaltered over decades." },
    { icon: GitBranch, title: "Request Workflow", desc: "A streamlined researcher portal for petitioning access to restricted items, integrated directly with archivist approval queues." },
    { icon: Activity, title: "Audit & Compliance", desc: "Complete transparency with granular activity logs tracking every view and modification for institutional oversight." },
    { icon: LayoutDashboard, title: "OAIS Aligned", desc: "Built on the ISO 14721:2012 framework, managing the full lifecycle from SIP ingestion to DIP access." },
    { icon: ClipboardList, title: "Login Monitoring", desc: "Proactive security tracking for all user sessions, ensuring archival access remains within authorized institutional boundaries." },
  ];

  const accessLevels = [
    {
      label: "PUBLIC",
      title: "Open Access",
      color: "text-[#4169E1]",
      border: "border-[#4169E1]/30",
      bg: "bg-[#4169E1]/5",
      dot: "bg-[#4169E1]",
      desc: "Freely accessible to all visitors. No account required to view these materials.",
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
      actions: ["Browse public collections", "Search materials", "Request restricted access", "View preservation metadata"],
      cta: "Register Now",
      href: "/register",
    },
  ];

  const steps = [
    { num: "01", icon: Search, title: "Browse & Search", desc: "Explore the full archival collection using keyword search, category filters, and date ranges.", color: "bg-[#4169E1]" },
    { num: "02", icon: BookOpen, title: "Request Access", desc: "Submit an access request for restricted materials, providing your research purpose and credentials.", color: "bg-[#960000]" },
    { num: "03", icon: FileText, title: "Interactive Viewing", desc: "Once approved, access archival materials with full preservation metadata attached through our secure viewer.", color: "bg-emerald-600" },
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
        <div className="max-w-5xl mx-auto px-4">
          <div className={`h-14 flex items-center justify-between px-5 rounded-full transition-all duration-500 shadow-2xl ring-1 ring-white/5 ${scrollY > 500
            ? 'bg-[#6b0000] border border-[#960000]/40 shadow-[#960000]/25'
            : 'bg-[#5a0000]/60 backdrop-blur-2xl border border-red-400/15 shadow-[#960000]/20'
            }`}>
            <Link href="/" className="flex items-center gap-4">
              <img src={`${import.meta.env.BASE_URL}logos/iarchive%20white%20logo.png`} alt="iArchive logo" className="h-11 w-auto object-contain" />
            </Link>
            <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-white/70">
              <Link href="/collections">
                <button className="hover:text-white hover:bg-white/10 px-3.5 py-1.5 rounded-full transition-all cursor-pointer">Collections</button>
              </Link>
              <button onClick={() => {
                const el = document.getElementById('features');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }} className="hover:text-white hover:bg-white/10 px-3.5 py-1.5 rounded-full transition-all cursor-pointer">Features</button>
              <Link href="/about">
                <button className="hover:text-white hover:bg-white/10 px-3.5 py-1.5 rounded-full transition-all cursor-pointer">About iARCHIVE</button>
              </Link>
              <Link href="/terms">
                <button className="hover:text-white hover:bg-white/10 px-3.5 py-1.5 rounded-full transition-all cursor-pointer">Terms</button>
              </Link>
            </nav>
            {user ? (
              <div className="hidden md:flex">
                <Link href={user.role === 'admin' ? "/admin" : user.role === 'archivist' ? "/archivist" : "/student"}>
                  <button className="flex items-center gap-2 bg-[#4169E1] hover:bg-[#3558c8] text-white text-sm font-semibold px-4 py-1.5 rounded-full transition-all border border-[#4169E1] hover:border-white/20 cursor-pointer shadow-lg shadow-black/20">
                    <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                  </button>
                </Link>
              </div>
            ) : (
              <div className="hidden md:flex">
                <Link href="/login">
                  <button className="flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white text-sm font-semibold px-4 py-1.5 rounded-full transition-all border border-white/10 hover:border-white/20 cursor-pointer">
                    <LogIn className="w-3.5 h-3.5" /> Login
                  </button>
                </Link>
              </div>
            )}

            <button
              className="md:hidden p-2 text-white/80 hover:text-white"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm">
            <div className="absolute right-0 top-0 bottom-0 w-64 bg-[#0a1628] border-l border-white/10 shadow-2xl p-6 flex flex-col">
              <div className="flex justify-between items-center mb-10">
                <span className="text-white font-display font-bold">Menu</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-white/60 hover:text-white bg-white/5 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-col gap-4 text-white font-medium">
                <Link href="/collections">
                  <span className="py-2 border-b border-white/10 block cursor-pointer" onClick={() => setMobileMenuOpen(false)}>Collections</span>
                </Link>
                <button
                  className="py-2 border-b border-white/10 text-left"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    const el = document.getElementById('how-it-works');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Features
                </button>
                <Link href="/about">
                  <span className="py-2 border-b border-white/10 block cursor-pointer" onClick={() => setMobileMenuOpen(false)}>About iARCHIVE</span>
                </Link>
                <Link href="/terms">
                  <span className="py-2 border-b border-white/10 block cursor-pointer" onClick={() => setMobileMenuOpen(false)}>Terms</span>
                </Link>
              </div>
              <div className="mt-auto">
                {user ? (
                  <Link href={user.role === 'admin' ? "/admin" : user.role === 'archivist' ? "/archivist" : "/student"}>
                    <button className="w-full flex justify-center items-center gap-2 bg-[#4169E1] text-white py-3 rounded-xl font-bold">
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </button>
                  </Link>
                ) : (
                  <Link href="/login">
                    <button className="w-full flex justify-center items-center gap-2 bg-white/10 text-white py-3 rounded-xl font-bold">
                      <LogIn className="w-4 h-4" /> Login
                    </button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Error toasts replace the old banner */}



      {/* ─── HERO ─── */}
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center overflow-hidden bg-[#0a1628] pt-24">
        <div
          className="absolute inset-0 bg-cover bg-center scale-110 opacity-12"
          style={{
            backgroundImage: `url(${import.meta.env.BASE_URL}images/hcdchero.png)`,
            transform: `translateY(${Math.min(scrollY * 0.35, 160)}px) scale(1.1)`,
            transition: 'transform 0.1s linear',
          }}
        />
        <div className="absolute inset-0">
          {/* Dark red hero wash */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#3a0000]/95 via-[#240000]/70 to-[#0a1628]/85" />
          {/* Animated glows - more vivid */}
          <div className="absolute -top-24 -right-24 h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(150,0,0,0.6),_transparent_55%)] blur-3xl animate-float-slow" />
          <div className="absolute -bottom-32 -left-32 h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(65,105,225,0.3),_transparent_58%)] blur-3xl animate-float-slower" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(150,0,0,0.15),_transparent_60%)] blur-2xl animate-pulse-glow" />
          {/* Soft grain */}
          <div className="absolute inset-0 opacity-[0.06] mix-blend-overlay pointer-events-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22160%22%20height%3D%22160%22%3E%3Cfilter%20id%3D%22n%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.9%22%20numOctaves%3D%223%22%20stitchTiles%3D%22stitch%22/%3E%3C/filter%3E%3Crect%20width%3D%22160%22%20height%3D%22160%22%20filter%3D%22url(%23n)%22%20opacity%3D%220.55%22/%3E%3C/svg%3E')]" />
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white to-transparent" />
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto hero-content" style={{ transform: `translateY(${Math.min(scrollY * -0.15, 0)}px)`, opacity: Math.max(1 - scrollY / 600, 0) }}>
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <Sparkles className="w-3.5 h-3.5 text-[#ff4444] animate-pulse" />
            <span className="text-white/80 text-xs font-medium tracking-widest uppercase">Holy Cross of Davao College · Est. 1951</span>
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.08] mb-6 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            Preserving HCDC's<br />
            <span className="font-serif italic text-white/90">institutional memory,</span><br />
            <span className="font-serif italic text-white/90">digitally <span className="text-[#ff2222] drop-shadow-[0_0_20px_rgba(255,34,34,0.5)]">forever.</span></span>
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto mb-10 leading-relaxed font-light animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            iArchive is HCDC's secure, OAIS-compliant digital repository — built to preserve, organize,
            and provide controlled access to the institution's historical records and research materials.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
            <Link href="/collections">
              <button className="inline-flex items-center gap-2 bg-[#4169E1] hover:bg-[#3558c8] text-white font-semibold px-7 py-3.5 rounded-full transition-all shadow-lg shadow-[#4169E1]/30 hover:shadow-xl hover:shadow-[#4169E1]/40 hover:scale-105">
                <Search className="w-4 h-4" /> Explore Archive
              </button>
            </Link>
            <Link href="/login">
              <button className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-7 py-3.5 rounded-full transition-all backdrop-blur-sm hover:scale-105">
                Login to iArchive <ArrowRight className="w-4 h-4" />
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
            {(Array.isArray(categories)
              ? categories.slice(0, 3)
              : [
                { id: "1", name: "Yearbooks", description: "Annual yearbook collection" },
                { id: "2", name: "Faculty Publications", description: "Academic research and publications" },
                { id: "3", name: "Digital Materials", description: "Born-digital institutional records" },
              ]
            ).map((cat, i) => (
              <Link key={cat.id} href={`/collections?category=${cat.id}`}>
                <div data-stagger className={`reveal-up ${catColors[i % catColors.length]} rounded-2xl overflow-hidden group cursor-pointer hover:scale-[1.03] transition-all duration-500 shadow-lg hover:shadow-2xl`}>
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

      {/* ─── FEATURES SECTION (Responsive) ─── */}
      <section className="bg-[#f7f8fc] py-20 md:py-0">
        {/* Mobile View: Vertical Stack */}
        <div className="md:hidden px-6 space-y-8 text-center">
          <div className="mb-12">
            <p className="text-[10px] font-bold text-[#4169E1] uppercase tracking-[0.2em] mb-4">Why iArchive</p>
            <h2 className="text-4xl font-bold text-[#0a1628] leading-tight">
              Built for <span className="font-serif italic text-[#4169E1]">archival excellence</span>
            </h2>
          </div>
          {features.map((f, i) => (
            <div key={i} className="bg-white p-8 rounded-3xl border border-border/50 shadow-sm text-left">
              <div className="w-12 h-12 rounded-xl bg-[#0a1628]/5 flex items-center justify-center mb-6">
                <f.icon className="w-6 h-6 text-[#0a1628]" />
              </div>
              <h3 className="text-xl font-bold text-[#0a1628] mb-3">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
          <Link href="/collections">
            <Button className="w-full mt-8 bg-[#0a1628] text-white">Explore Full Archive</Button>
          </Link>
        </div>

        {/* Desktop View: Horizontal Scroll */}
        <div ref={targetRef} className="hidden md:block relative h-[400vh]">
          <div className="sticky top-0 flex h-screen items-center overflow-hidden">
            <div className="absolute inset-x-0 top-20 text-center z-20 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="max-w-2xl mx-auto px-6"
              >
                <p className="text-xs font-bold text-[#4169E1] uppercase tracking-[0.2em] mb-4">Why iArchive</p>
                <h2 className="text-5xl font-bold text-[#0a1628] leading-tight">
                  Built for <span className="font-serif italic text-[#4169E1] relative">
                    archival excellence
                    <svg className="absolute -bottom-2 lg:-bottom-3 left-0 w-full h-3 text-[#960000] opacity-40" viewBox="0 0 100 20" preserveAspectRatio="none">
                      <path d="M0 10 Q 50 20 100 10" stroke="currentColor" strokeWidth="4" fill="none" />
                    </svg>
                  </span>
                </h2>
              </motion.div>
            </div>

            <motion.div style={{ x: springX }} className="flex gap-10 px-24">
              {features.map((f, i) => (
                <div
                  key={i}
                  className="group relative h-[320px] w-[500px] overflow-hidden rounded-[2.5rem] bg-white border border-border/50 shadow-sm transition-all duration-700 hover:shadow-2xl hover:border-[#4169E1]/40 shrink-0"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#4169E1]/5 via-white to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <div className="p-8 flex items-start gap-8 h-full relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-[#0a1628]/5 group-hover:bg-[#4169E1] flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500 shadow-sm">
                      <f.icon className="w-8 h-8 text-[#0a1628] group-hover:text-white transition-colors duration-500" />
                    </div>
                    <div className="flex flex-col justify-center h-full">
                      <h3 className="text-2xl font-bold text-[#0a1628] mb-3 group-hover:text-[#4169E1] transition-colors">{f.title}</h3>
                      <p className="text-muted-foreground leading-relaxed text-[15px] font-light group-hover:text-[#0a1628]/80 transition-colors">
                        {f.desc}
                      </p>
                      {f.title === "OAIS Aligned" ? (
                        <Link href="/about#about-oais">
                          <div className="mt-6 flex items-center gap-2 text-[#4169E1] font-bold text-[10px] uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 group-hover:translate-x-3 transition-all duration-500 cursor-pointer">
                            View Capability <ArrowRight className="w-3 h-3" />
                          </div>
                        </Link>
                      ) : (
                        <div className="mt-6 flex items-center gap-2 text-[#4169E1] font-bold text-[10px] uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 group-hover:translate-x-3 transition-all duration-500">
                          View Capability <ArrowRight className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Decorative element - subtle grid pattern on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] pointer-events-none transition-opacity duration-700 bg-[radial-gradient(#0a1628_1px,transparent_1px)] [background-size:20px_20px]" />
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#4169E1]/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                </div>
              ))}

              {/* View Collection Card - Matching style */}
              <div className="h-[320px] w-[500px] flex items-center justify-center shrink-0">
                <Link href="/collections">
                  <div className="flex flex-col items-center gap-6 group cursor-pointer">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="w-20 h-20 rounded-3xl bg-[#0a1628] flex items-center justify-center text-white shadow-2xl transition-all duration-500 group-hover:bg-[#4169E1]"
                    >
                      <Search className="w-7 h-7" />
                    </motion.div>
                    <div className="text-center">
                      <h4 className="text-xl font-bold text-[#0a1628] mb-1">Access the Full Archive</h4>
                      <p className="text-[#4169E1] text-[10px] uppercase tracking-[0.3em] font-black">Begin Research Pipeline →</p>
                    </div>
                  </div>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS (CIRCUIT MILESTONE) ─── */}
      <section id="how-it-works" className="py-28 bg-[#fdfdfd] relative overflow-hidden" data-reveal>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <p className="text-[10px] font-bold text-[#960000] uppercase tracking-[0.4em] mb-4 opacity-70">Infrastructure & Logic</p>
            <h2 className="text-5xl font-bold text-[#0a1628] tracking-tight">
              Archival <span className="text-[#4169E1]">Framework</span>
            </h2>
            <div className="mt-6 flex justify-center gap-1.5">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-border" />
              ))}
            </div>
          </div>

          <div className="relative">
            {/* High-Fidelity Circuit SVG Background */}
            <div className="hidden md:block absolute inset-0 -top-10 pointer-events-none">
              <svg className="w-full h-40" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="circuit-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#4169E1" />
                    <stop offset="50%" stopColor="#960000" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
                {/* Horizontal segment 1 */}
                <motion.path
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                  d="M 16.6 75 L 25 75 L 25 40 L 41.6 40"
                  fill="none" stroke="url(#circuit-grad)" strokeWidth="2" strokeDasharray="6 6"
                />
                {/* Horizontal segment 2 */}
                <motion.path
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
                  d="M 58.3 40 L 75 40 L 75 75 L 83.3 75"
                  fill="none" stroke="url(#circuit-grad)" strokeWidth="2" strokeDasharray="6 6"
                />
              </svg>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative lg:px-12">
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.2, duration: 0.6 }}
                  className="relative flex flex-col items-center text-center group"
                >
                  {/* Step Node */}
                  <div className="relative mb-8">
                    <div className={`w-28 h-28 rounded-3xl ${step.color} shadow-xl flex items-center justify-center relative z-20 overflow-hidden`}>
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
                      <step.icon className="w-10 h-10 text-white relative z-10 group-hover:scale-110 transition-transform duration-500" />
                    </div>

                    {/* Pulsing Outer Ring */}
                    <div className="absolute -inset-4 border border-[#4169E1]/10 rounded-full animate-[ping_3s_infinite] opacity-50" />

                    {/* Index Label - Fixed visibility & type safe */}
                    <div className="absolute -top-3 -left-3 w-10 h-10 bg-white border-2 border-[#4169E1] rounded-xl flex items-center justify-center text-xs font-black text-[#0a1628] shadow-xl z-30">
                      {parseInt(String(step.num)) < 10 ? `0${step.num}` : step.num}
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-[#0a1628] mb-4">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-[15px] font-medium max-w-[260px]">
                    {step.desc}
                  </p>

                  <div className="mt-10 h-1 w-12 bg-border group-hover:w-20 group-hover:bg-[#4169E1] transition-all duration-700 rounded-full" />
                </motion.div>
              ))}
            </div>
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
      <section className="py-20 bg-white" data-reveal>
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
              <div key={i} data-stagger className={`reveal-up rounded-2xl border-2 ${al.border} ${al.bg} p-7 hover:-translate-y-1 transition-all duration-500`}>
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
              { num: `${stats?.totalCategories ?? 5}`, label: "Collection Series", color: "text-[#4169E1]" },
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
