import * as React from "react";
import { PublicLayout } from "@/components/layout";
import { Database, ShieldCheck, BookOpenText, ScrollText, CheckCircle2, ArrowRight } from "lucide-react";
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

export default function About() {
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

          {/* OAIS section */}
          <motion.div variants={fadeInUp} className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
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
