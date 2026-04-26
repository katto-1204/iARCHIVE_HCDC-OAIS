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
                iArchive is a web-based digital archival collection system developed for Holy Cross of Davao College (HCDC) that allows users to store, organize, and access the institution's historical records online. It enables authorized administrators and archivists to upload, catalog, and manage digitized materials such as yearbooks, photographs, and publications, while providing students, alumni, researchers, and the broader community with searchable access to these collections through a secure, role-based platform.
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
          <motion.div variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div variants={fadeInUp} className="bg-white rounded-2xl border border-border/60 shadow-sm p-7">
              <div className="flex items-center gap-3 mb-4">
                <Eye className="w-5 h-5 text-[#4169E1]" />
                <h2 className="text-xl font-bold text-[#0a1628]">Vision</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                To be a reliable digital archive that preserves institutional heritage and broadens access to valuable records, fostering knowledge, research, and community connections for present and future generation.
              </p>
            </motion.div>
            <motion.div variants={fadeInUp} className="bg-white rounded-2xl border border-border/60 shadow-sm p-7">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="w-5 h-5 text-[#960000]" />
                <h2 className="text-xl font-bold text-[#0a1628]">Mission</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                <strong>iArchive is committed to:</strong><br/><br/>
                Broadening the reach and access of archival collections for students, researchers, alumni, and the public community.<br/><br/>
                Supporting research, learning, and heritage preservation by making institutional resources more accessible and useful.
              </p>
            </motion.div>
            <motion.div variants={fadeInUp} className="bg-white rounded-2xl border border-border/60 shadow-sm p-7">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h2 className="text-xl font-bold text-[#0a1628]">Goals</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                <strong>iArchive aims to:</strong><br/><br/>
                Digitize and preserve institutional records to protect valuable materials from physical deterioration and loss.<br/><br/>
                Promote institutional memory and engagement by making historical records available for education, research, and community use.
              </p>
            </motion.div>
          </motion.div>        </motion.div>
      </div>
    </PublicLayout>
  );
}
