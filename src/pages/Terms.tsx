import * as React from "react";
import { Link } from "wouter";
import { ArrowLeft, ShieldCheck, FileText, Scale, Lock, Eye, CheckCircle2, Database } from "lucide-react";
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

export default function Terms() {
  const sections = [
    { id: "acceptance", title: "Acceptance of Terms", icon: CheckCircle2, content: "By accessing or using the iArchive platform (the \"System\") of Holy Cross of Davao College (HCDC), you acknowledge that you have read, understood, and agree to be bound by these Terms of Use and all applicable laws and regulations in the Philippines, including the Data Privacy Act of 2012." },
    { id: "access", title: "Authorized Access", icon: Lock, content: "Access to specific archival materials is granted based on user roles and institutional affiliation. Restricted and confidential materials require explicit approval from the HCDC Archiving Department. Users are prohibited from sharing their credentials or attempting to bypass security measures to access unauthorized content." },
    { id: "usage", title: "Intellectual Property & Usage", icon: Scale, content: "Materials in the iArchive are protected by copyright and other intellectual property rights. Unless otherwise specified (e.g., Public Domain or Creative Commons), digital objects are provided for personal research, teaching, and private study only. Commercial use or redistribution without written consent from HCDC or the original rights holder is strictly prohibited." },
    { id: "privacy", title: "Data Privacy & Ethical Use", icon: Eye, content: "iArchive collects and processes personal information in accordance with the HCDC Privacy Policy. Users must handle all data obtained through the System ethically and legally, particularly when archival records contain sensitive personal information or represent cultural heritage." },
    { id: "preservation", title: "Preservation & Integrity", icon: Database, content: "The archival integrity of digital objects is maintained through industry-standard fixity checks (SHA-256). Users shall not alter, deface, or misrepresent the material or metadata found within the System. Any identified discrepancies should be reported to the System Administrator." },
  ];

  return (
    <div className="min-h-screen bg-[#f7f8fc] font-sans selection:bg-[#4169E1]/20">
      {/* ─── NAVBAR ─── */}
      <header className="bg-white border-b border-border/70 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0a1628] flex items-center justify-center text-white">
               <Database className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-[#0a1628]">iArchive</span>
          </Link>
          <Link href="/collections">
             <button className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-[#4169E1] transition-colors cursor-pointer">
               <ArrowLeft className="w-4 h-4" /> Back to Research
             </button>
          </Link>
        </div>
      </header>

      {/* ─── HERO HEADER ─── */}
      <motion.div 
        initial="initial"
        animate="animate"
        variants={staggerContainer}
        className="bg-[#0a1628] py-20 relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#4169E1]/20 rounded-full blur-[100px]" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#960000]/10 rounded-full blur-[100px]" />
        
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full mb-6">
            <ShieldCheck className="w-4 h-4 text-[#4169E1]" />
            <span className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em]">Institutional Policy Framework</span>
          </motion.div>
          <motion.h1 variants={fadeInUp} className="text-5xl md:text-6xl font-display font-bold text-white mb-6 tracking-tight">Terms of <span className="text-[#4169E1]">Service</span></motion.h1>
          <motion.p variants={fadeInUp} className="text-lg text-white/50 max-w-2xl mx-auto leading-relaxed">
            Ensuring the ethical preservation and authorized access of Holy Cross of Davao College's digital archival heritage.
          </motion.p>
        </div>
      </motion.div>

      {/* ─── CONTENT GRID ─── */}
      <main className="max-w-6xl mx-auto px-6 py-16">
        <motion.div 
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-12"
        >
          
          <div className="space-y-12">
            {sections.map((section, idx) => (
              <motion.section 
                key={section.id} 
                id={section.id} 
                variants={fadeInUp}
                className="bg-white p-8 md:p-10 rounded-3xl border border-border/50 shadow-sm hover:shadow-md transition-shadow group scroll-mt-24"
              >
                <div className="flex items-start gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-[#f7f8fc] border border-border/60 flex items-center justify-center shrink-0 group-hover:bg-[#4169E1]/5 group-hover:border-[#4169E1]/20 transition-colors">
                    <section.icon className="w-6 h-6 text-[#0a1628] group-hover:text-[#4169E1] transition-colors" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#4169E1] uppercase tracking-widest mb-1 block">Article {idx + 1}</span>
                    <h2 className="text-2xl font-bold text-[#0a1628] mb-4 tracking-tight">{section.title}</h2>
                    <p className="text-muted-foreground leading-relaxed text-base">
                      {section.content}
                    </p>
                  </div>
                </div>
              </motion.section>
            ))}

            <motion.div variants={fadeInUp} className="bg-[#4169E1]/5 border border-[#4169E1]/20 p-8 rounded-3xl text-center">
              <p className="text-sm text-[#002366] font-medium italic">
                "Preserving the past, defining the present, and shaping the future of HCDC archival records."
              </p>
            </motion.div>
          </div>

          {/* SIDEBAR NAVIGATION */}
          <aside className="hidden lg:block space-y-8 sticky top-24 h-fit">
            <motion.div variants={fadeInUp} className="bg-white p-6 rounded-2xl border border-border/50 shadow-sm">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 px-2">Quick Navigation</h3>
              <nav className="space-y-1">
                {sections.map(s => (
                  <a 
                    key={s.id} 
                    href={`#${s.id}`} 
                    className="block px-3 py-2 text-sm font-medium text-foreground/70 hover:text-[#4169E1] hover:bg-[#4169E1]/5 rounded-lg transition-all"
                  >
                    {s.title}
                  </a>
                ))}
              </nav>
            </motion.div>

            <motion.div variants={fadeInUp} className="bg-[#0a1628] p-6 rounded-2xl border border-white/5 text-white">
              <FileText className="w-8 h-8 text-[#4169E1] mb-4" />
              <h4 className="font-bold mb-2">Need Clarification?</h4>
              <p className="text-xs text-white/50 leading-relaxed mb-4">
                For questions regarding data access, reproduction rights, or archival policies, please contact our team.
              </p>
              <button className="w-full bg-[#4169E1] text-white text-[11px] font-bold py-2 rounded-lg hover:bg-[#3558c8] transition-colors uppercase tracking-wider cursor-pointer">
                Contact Archives
              </button>
            </motion.div>
          </aside>

        </motion.div>
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="bg-white border-t border-border/70 py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-[#f7f8fc] border border-border flex items-center justify-center">
                <Database className="w-4 h-4 text-muted-foreground" />
             </div>
             <p className="text-sm text-muted-foreground font-medium">Last Updated: March 2026</p>
          </div>
          <div className="flex items-center gap-8">
            <a href="#" className="text-xs font-bold text-muted-foreground hover:text-[#0a1628] uppercase tracking-widest">Privacy Policy</a>
            <a href="#" className="text-xs font-bold text-muted-foreground hover:text-[#0a1628] uppercase tracking-widest">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
