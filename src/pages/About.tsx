import * as React from "react";
import { PublicLayout } from "@/components/layout";
import {
  Database, ShieldCheck, BookOpenText, ScrollText, CheckCircle2, ArrowRight,
  FileSearch, Lock, Shield, GitBranch, Activity, LayoutDashboard, ClipboardList,
  Search, BookOpen, FileText, Eye, ChevronRight
} from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

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

const steps = [
  { num: "01", icon: Search, title: "Browse & Search", desc: "Explore the full archival collection using keyword search, category filters, and date ranges.", color: "bg-[#4169E1]" },
  { num: "02", icon: BookOpen, title: "Request Access", desc: "Submit an access request for restricted materials, providing your research purpose and credentials.", color: "bg-[#960000]" },
  { num: "03", icon: FileText, title: "Interactive Viewing", desc: "Once approved, access archival materials with full preservation metadata attached through our secure viewer.", color: "bg-emerald-600" },
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

export default function About() {
  React.useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.substring(1);
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, []);

  return (
    <PublicLayout>
      <div className="min-h-screen bg-[#f7f8fc] pt-24 pb-16">
        <motion.div
          initial="initial"
          animate="animate"
          variants={staggerContainer}
          className="max-w-5xl mx-auto px-6"
        >
          {/* Hero */}
          <motion.div variants={fadeInUp} className="relative overflow-hidden rounded-3xl border border-border/60 bg-[#0a1628] p-8 md:p-10 shadow-xl shadow-black/10 mb-8">
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: `url(${import.meta.env.BASE_URL}images/hcdchero.png)` }} />
            <div className="absolute inset-0 bg-gradient-to-br from-[#3a0000]/85 via-[#240000]/50 to-[#0a1628]/85" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-white/10 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-5">
                <Database className="w-3.5 h-3.5 text-[#4169E1]" />
                About iArchive
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
                Institutional Digital Archives<br />
                for Holy Cross of Davao College
              </h1>
              <p className="text-white/70 leading-relaxed max-w-3xl">
                iArchive provides systematic digital access to Holy Cross of Davao College's historical materials.
                This web-based platform enables administrators to catalog and preserve institutional records while offering
                researchers, students, alumni, and the community searchable access to yearbooks, photographs, newspapers,
                and historical documents—transforming institutional heritage into accessible educational resources.
              </p>
              <div className="mt-7 flex flex-col sm:flex-row gap-3">
                <Link href="/collections">
                  <button className="inline-flex items-center justify-center gap-2 bg-[#4169E1] hover:bg-[#3558c8] text-white font-semibold px-6 py-3 rounded-xl transition-colors">
                    Browse Collections <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
                <Link href="/terms">
                  <button className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
                    Terms of Use
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Core cards */}
          <motion.div variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <motion.div variants={fadeInUp} className="bg-white rounded-2xl border border-border/60 shadow-sm p-7">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="w-5 h-5 text-[#4169E1]" />
                <h2 className="text-xl font-bold text-[#0a1628]">Mission</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                To safeguard Holy Cross of Davao College's institutional heritage through systematic digitization and
                standardized archival practices, bridging the past and present by providing accessible digital access
                to historical materials. iArchive fosters educational discovery, supports scholarly research, and strengthens
                community connections, illuminating the institution's identity, achievements, and evolution for students,
                alumni, researchers, and all stakeholders across generations.
              </p>
            </motion.div>
            <motion.div variants={fadeInUp} className="bg-white rounded-2xl border border-border/60 shadow-sm p-7">
              <div className="flex items-center gap-3 mb-4">
                <BookOpenText className="w-5 h-5 text-[#960000]" />
                <h2 className="text-xl font-bold text-[#0a1628]">Usually Archived</h2>
              </div>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                {["Yearbooks", "Book of Abstracts", "Newsletters", "Short Videos", "Institutional records and historical documents"].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#4169E1] mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>

          {/* ─── WHY IARCHIVE / FEATURES ─── */}
          <motion.div id="features" variants={fadeInUp} className="mb-8">
            <div className="text-center mb-10">
              <p className="text-[10px] font-bold text-[#4169E1] uppercase tracking-[0.2em] mb-3">Why iArchive</p>
              <h2 className="text-3xl font-bold text-[#0a1628]">
                Built for <span className="font-serif italic text-[#4169E1]">archival excellence</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  variants={fadeInUp}
                  className="bg-white rounded-2xl border border-border/60 shadow-sm p-6 hover:shadow-lg hover:border-[#4169E1]/30 transition-all duration-300 group"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#0a1628]/5 group-hover:bg-[#4169E1] flex items-center justify-center mb-4 transition-colors duration-300">
                    <f.icon className="w-5 h-5 text-[#0a1628] group-hover:text-white transition-colors duration-300" />
                  </div>
                  <h3 className="text-base font-bold text-[#0a1628] mb-2 group-hover:text-[#4169E1] transition-colors">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ─── ARCHIVAL FRAMEWORK ─── */}
          <motion.div id="how-it-works" variants={fadeInUp} className="mb-8">
            <div className="text-center mb-10">
              <p className="text-[10px] font-bold text-[#960000] uppercase tracking-[0.3em] mb-3">Infrastructure &amp; Logic</p>
              <h2 className="text-3xl font-bold text-[#0a1628]">
                Archival <span className="text-[#4169E1]">Framework</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  variants={fadeInUp}
                  className="bg-white rounded-2xl border border-border/60 shadow-sm p-7 text-center group hover:shadow-lg transition-all duration-300"
                >
                  <div className="relative mx-auto mb-6 w-fit">
                    <div className={`w-20 h-20 rounded-2xl ${step.color} shadow-lg flex items-center justify-center`}>
                      <step.icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -top-2 -left-2 w-8 h-8 bg-white border-2 border-[#4169E1] rounded-lg flex items-center justify-center text-xs font-black text-[#0a1628] shadow-md">
                      {step.num}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-[#0a1628] mb-3">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ─── ACCESS LEVELS ─── */}
          <motion.div variants={fadeInUp} className="mb-8">
            <div className="text-center mb-10">
              <p className="text-xs font-semibold text-[#960000] uppercase tracking-widest mb-3">Permissions Framework</p>
              <h2 className="text-3xl font-bold text-[#0a1628]">
                Material: <span className="font-serif italic text-[#4169E1]">Access Levels</span>
              </h2>
              <p className="mt-3 text-muted-foreground max-w-xl mx-auto text-sm">
                iArchive enforces strict access control so every material is shared only with the right audience.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {accessLevels.map((al, i) => (
                <motion.div key={i} variants={fadeInUp} className={`rounded-2xl border-2 ${al.border} ${al.bg} p-7 hover:-translate-y-1 transition-all duration-300`}>
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
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* OAIS section */}
          <motion.div id="about-oais" variants={fadeInUp} className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
            <div className="px-7 py-5 border-b border-border/60 bg-[#f7f8fc]">
              <div className="flex items-center gap-3">
                <ScrollText className="w-5 h-5 text-[#4169E1]" />
                <h2 className="text-xl font-bold text-[#0a1628]">About OAIS</h2>
                <span className="ml-auto text-xs font-semibold text-muted-foreground uppercase tracking-widest">ISO 14721</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                A reference model for long-term digital preservation.
              </p>
            </div>
            <div className="p-7">
              <p className="text-sm text-muted-foreground leading-relaxed">
                iArchive aligns with the Open Archival Information System (OAIS, ISO 14721) reference model to structure long-term digital
                preservation workflows: ingest, archival storage, data management, administration, preservation planning, and access.
                This ensures archival objects remain authentic, discoverable, and usable over time despite changes in formats and technology.
              </p>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { t: "Ingest", d: "Submission of digital objects (SIP) into the repository." },
                  { t: "Archival Storage", d: "Preservation packaging (AIP) and integrity controls." },
                  { t: "Access", d: "Role-based delivery with request/approval for restricted items." },
                ].map((c) => (
                  <div key={c.t} className="rounded-2xl border border-border/60 bg-white p-5">
                    <p className="text-xs font-bold uppercase tracking-widest text-[#4169E1]">{c.t}</p>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{c.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </PublicLayout>
  );
}
