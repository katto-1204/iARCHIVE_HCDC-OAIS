import { AdminLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui-components";
import { 
  Database, FolderTree, GitPullRequest, Megaphone, Activity, 
  CheckCircle2, Search, ShieldCheck, BarChart3, Plus, 
  ArrowUpRight, Clock, UserCheck, LayoutDashboard, Sparkles
} from "lucide-react";
import { useGetAnnouncements, useGetStats, useGetAccessRequests } from "@workspace/api-client-react";
import { format } from "date-fns";
import { CompletionRing } from "@/components/CompletionRing";
import { ArchivalTree } from "@/components/ArchivalTree";
import { Link } from "wouter";
import * as React from "react";
import { SAMPLE_HIERARCHY } from "@/data/sampleData";

export default function ArchivistDashboard() {
  const { data: announcements } = useGetAnnouncements();
  const activeAnnouncements = (announcements ?? []).filter((a: any) => a.isActive);
  const { data: stats } = useGetStats();
  const { data: pendingRequests } = useGetAccessRequests({ status: "pending" });

  const statCards = [
    { 
      title: "Archival Items", 
      value: stats?.totalMaterials || 0, 
      icon: Database, 
      color: "bg-blue-500", 
      trend: "+12% this month",
      desc: "Total cataloged records"
    },
    { 
      title: "Verified Users", 
      value: stats?.totalUsers || 0, 
      icon: UserCheck, 
      color: "bg-emerald-500", 
      trend: "5 active research tiers",
      desc: "Authorized researchers"
    },
  ];

  return (
    <AdminLayout>
      {/* ─── Command Center Header ─── */}
      <div className="mb-10 p-10 rounded-[3rem] bg-[#050a14] border border-white/5 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,_rgba(65,105,225,0.1),_transparent_50%)]" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-900/10 blur-[120px] rounded-full -ml-48 -mb-48" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-full px-4 py-1.5 text-[10px] font-black mb-4 uppercase tracking-[0.3em] text-blue-400">
              <ShieldCheck className="w-3.5 h-3.5" /> OAIS Preservation Standard
            </div>
            <h1 className="text-5xl font-black text-white tracking-tight leading-none mb-4">
              Cataloging <span className="text-blue-500">Center</span>
            </h1>
            <p className="text-white/40 text-lg font-medium max-w-xl">
              Control center for institutional memory management. Monitor ingestion pipelines, 
              metadata quality, and researcher access protocols.
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-3">
             <Link href="/archivist/collections">
               <button className="bg-blue-600 hover:bg-blue-500 text-white font-black px-8 py-4 rounded-2xl transition-all shadow-xl shadow-blue-600/20 flex items-center gap-2 group active:scale-95">
                 <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" /> Ingest New Material
               </button>
             </Link>
             <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] pr-2">System Status: Nominal</div>
          </div>
        </div>
      </div>

      {/* ─── Metrics Grid ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
        {statCards.map((card, i) => (
          <Card key={i} className="border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden group hover:-translate-y-2 transition-all duration-500">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className={`w-14 h-14 rounded-2xl ${card.color} flex items-center justify-center text-white shadow-lg shadow-${card.color}/20 group-hover:scale-110 transition-transform duration-500`}>
                  <card.icon className="w-7 h-7" />
                </div>
                <div className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">{card.trend}</div>
              </div>
              <h3 className="text-5xl font-black text-[#0a1628] mb-2 tracking-tighter">{card.value}</h3>
              <p className="text-sm font-black text-[#0a1628]/60 uppercase tracking-[0.1em]">{card.title}</p>
              <p className="text-xs text-muted-foreground mt-2 font-medium">{card.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ─── Left Column: Operations ─── */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Metadata Analytics */}
          <Card className="border border-border/50 rounded-[2.5rem] shadow-sm bg-white overflow-hidden">
            <CardHeader className="p-8 border-b border-border/50 bg-muted/20">
              <CardTitle className="text-xl font-black flex items-center gap-3 text-[#0a1628] tracking-tight">
                <BarChart3 className="w-6 h-6 text-blue-500" /> Cataloging Health
              </CardTitle>
            </CardHeader>
            <CardContent className="p-10">
              <div className="flex flex-col md:flex-row items-center justify-around gap-12">
                <div className="flex flex-col items-center gap-4">
                  <CompletionRing percentage={88} size={140} strokeWidth={10} color="#3B82F6" label="Total" />
                  <div className="text-center">
                    <p className="text-xs font-black text-[#0a1628] uppercase tracking-widest">Metadata Quality</p>
                    <p className="text-[10px] text-muted-foreground font-medium mt-1">ISAD(G) Standard Match</p>
                  </div>
                </div>
                
                <div className="flex flex-col items-center gap-4">
                  <CompletionRing percentage={94} size={140} strokeWidth={10} color="#10B981" label="Essential" />
                  <div className="text-center">
                    <p className="text-xs font-black text-[#0a1628] uppercase tracking-widest">Core Compliance</p>
                    <p className="text-[10px] text-muted-foreground font-medium mt-1">Institutional Rules</p>
                  </div>
                </div>

                <div className="hidden md:block w-px h-32 bg-border/50" />

                <div className="space-y-6 flex-1 max-w-xs">
                  <div>
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                      <span>Digitization Progress</span>
                      <span className="text-blue-600">72%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full w-[72%]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                      <span>Indexing Accuracy</span>
                      <span className="text-emerald-600">98%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full w-[98%]" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hierarchy Browser */}
          <Card className="border border-border/50 rounded-[2.5rem] shadow-sm bg-white overflow-hidden">
            <CardHeader className="p-8 border-b border-border/50">
              <CardTitle className="text-xl font-black flex items-center gap-3 text-[#0a1628] tracking-tight">
                <FolderTree className="w-6 h-6 text-[#0a1628]" /> Structural Inventory
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 max-h-[500px] overflow-y-auto custom-scrollbar">
              <div className="bg-muted/10 p-6 rounded-3xl border border-border/30">
                <ArchivalTree node={SAMPLE_HIERARCHY} onSelectItem={() => {}} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── Right Column: Feed & Activity ─── */}
        <div className="lg:col-span-4 space-y-8">
          <Card className="border border-border/50 rounded-[2.5rem] shadow-sm bg-white overflow-hidden">
            <div className="p-6 border-b border-border/50 bg-[#0a1628] text-white">
              <h2 className="text-sm font-black flex items-center gap-2 uppercase tracking-[0.2em]">
                <Megaphone className="w-4 h-4 text-blue-400" /> Admin Feed
              </h2>
            </div>
            <div className="p-0">
              {activeAnnouncements.length > 0 ? (
                <div className="divide-y divide-border/50">
                  {activeAnnouncements.map((ann: any) => (
                    <div key={ann.id} className="p-8 hover:bg-muted/10 transition-colors group">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <h3 className="font-black text-[#0a1628] group-hover:text-blue-600 transition-colors">{ann.title}</h3>
                        <span className="text-[9px] font-black text-muted-foreground/60 whitespace-nowrap bg-muted px-2.5 py-1 rounded-full uppercase tracking-tighter">
                          {ann.createdAt ? format(new Date(ann.createdAt), "MMM d") : "N/A"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{ann.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <Megaphone className="w-10 h-10 text-muted-foreground/20 mx-auto mb-4" />
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">No active bulletins</p>
                </div>
              )}
            </div>
          </Card>

          {/* Quick Shortcuts */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] px-4">Cataloging Shortcuts</h3>
            {[
              { label: "Manage Materials", icon: Database, href: "/archivist/collections", color: "text-blue-500" },
              { label: "Structure Editor", icon: LayoutDashboard, href: "/archivist/categories", color: "text-emerald-500" },
            ].map((s, i) => (
              <Link key={i} href={s.href}>
                <div className="group bg-white p-6 rounded-[2rem] border border-border/50 shadow-sm hover:shadow-xl transition-all duration-300 flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center ${s.color}`}>
                      <s.icon className="w-5 h-5" />
                    </div>
                    <span className="font-black text-[#0a1628] text-sm">{s.label}</span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground/30 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                </div>
              </Link>
            ))}
          </div>

          <Card className="border-none bg-gradient-to-br from-[#0B3D91] to-[#050a14] p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-grid-white opacity-[0.03] pointer-events-none" />
            <div className="relative z-10">
              <Sparkles className="w-8 h-8 text-blue-400 mb-6 group-hover:scale-125 transition-transform duration-500" />
              <h3 className="text-2xl font-black mb-3">System Integrity</h3>
              <p className="text-white/40 text-xs font-bold leading-relaxed mb-8 uppercase tracking-widest">
                All cataloging operations are audited for permanent institutional preservation.
              </p>
              <div className="flex items-center gap-2 text-[9px] font-black text-blue-400 tracking-[0.2em] uppercase">
                <ShieldCheck className="w-4 h-4" /> Secure Session Active
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
