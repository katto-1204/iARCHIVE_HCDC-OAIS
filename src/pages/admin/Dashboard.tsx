import * as React from "react";
import { AdminLayout } from "@/components/layout";
import { Button, Card, CardContent, CardHeader, CardTitle, Modal } from "@/components/ui-components";
import { CompletionRing } from "@/components/CompletionRing";
import { Barcode } from "@/components/Barcode";
import {
   Database, CheckCircle2, BarChart3, TrendingUp, ShieldCheck,
   ChevronDown, ChevronUp, Clock, Upload, Edit3, Shield,
   AlertCircle, XCircle, FileText, Activity, Filter, Lock, Mail, MessageSquare, Trash2, Info, Sparkles, CheckCircle,
   ArrowUpRight, Users, Zap, Search, Layers, History, Megaphone, Heart
} from "lucide-react";
import { Link } from "wouter";
import { type ArchivalMaterial } from "@/data/sampleData";
import {
   computeCompletion, computeISADGCompletion, computeDCCompletion,
   computeAreaBreakdown, getEssentialFieldsStatus, getAllFieldValues,
   getCompletionColor, getCompletionCategory, checkOAISCompliance,
   computeDashboardStats,
} from "@/data/metadataUtils";
import { format } from "date-fns";
import {
   useGetMaterials, useGetFeedbacks, useMarkFeedbackRead,
   useGetAuditLogs, useDeleteMaterial, useGetStats, useGetAnnouncements
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function AdminDashboard() {
   const { data: materialsData } = useGetMaterials({ limit: 1000 });
   const { data: feedbackData } = useGetFeedbacks();
   const { data: auditData } = useGetAuditLogs({ limit: 10 });
   const { data: globalStats } = useGetStats();
   const { data: announcements } = useGetAnnouncements();
   const { toast } = useToast();

   const [expandedId, setExpandedId] = React.useState<string | null>(null);

   const materials = materialsData?.materials || [];
   const feedbacks = feedbackData || [];
   const activityFeed = auditData?.logs ?? [];
   const stats = computeDashboardStats(materials);

   const activeAnnouncements = (announcements || []).filter((a: any) => a.isActive);

   return (
      <AdminLayout>
         {/* ─── Elite Command Center Header ─── */}
         <div className="relative mb-12 p-12 rounded-[3.5rem] overflow-hidden bg-[#0a1628] text-white shadow-2xl border border-white/5">
            <div className="absolute inset-0 bg-gradient-to-br from-[#960000]/30 via-transparent to-black/60 pointer-events-none" />
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/10 blur-[120px] rounded-full -mr-32 -mt-32" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12">
               <div className="max-w-3xl">
                  <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-full px-5 py-2 text-[10px] font-black mb-8 uppercase tracking-[0.4em]">
                     <ShieldCheck className="w-4 h-4 text-red-500" /> Administrative Authority
                  </div>
                  <h1 className="text-6xl font-black mb-6 tracking-tight leading-[1.1]">
                     IARCHIVE<span className="text-red-600">Command</span> Center
                  </h1>
                  <p className="text-white/50 text-xl font-medium leading-relaxed max-w-2xl">
                     Precision oversight of Holy Cross of Davao College's digital memory.
                     Real-time synchronization across ingestion pipelines and archival compliance.
                  </p>
               </div>

               <div className="grid grid-cols-2 gap-4 lg:w-96 shrink-0">
                  <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[2rem] p-6 text-center">
                     <div className="text-4xl font-black text-red-500 mb-1">{globalStats?.totalMaterials || 0}</div>
                     <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Total Records</div>
                  </div>
                  <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[2rem] p-6 text-center">
                     <div className="text-4xl font-black text-white mb-1">{globalStats?.totalUsers || 0}</div>
                     <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Managed Users</div>
                  </div>
               </div>
            </div>
         </div>

         {/* ─── Metric Sparkline Grid ─── */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {[
               { label: "Archival Growth", value: "+12.4%", desc: "Volume increase this month", color: "bg-emerald-500", icon: Zap },
               { label: "Audit Health", value: "99.9%", desc: "Consistency across logs", color: "bg-blue-600", icon: ShieldCheck },
               { label: "Access Requests", value: materials.filter(m => m.accessTier === "restricted").length, desc: "Pending authorization", color: "bg-amber-500", icon: GitPullRequest },
               { label: "Feedback Loop", value: feedbacks.filter((f: any) => f.status === 'unread').length, desc: "Awaiting administrator response", color: "bg-red-600", icon: MessageSquare },
            ].map((m, i) => (
               <Card key={i} className="border-none shadow-xl bg-white rounded-[2.5rem] p-8 hover:-translate-y-2 transition-all duration-500 group">
                  <div className="flex items-start justify-between mb-6">
                     <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform duration-500 group-hover:scale-110", m.color)}>
                        <m.icon className="w-7 h-7" />
                     </div>
                     <div className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest">Active Status</div>
                  </div>
                  <h3 className="text-4xl font-black text-[#0a1628] mb-1 tracking-tight">{m.value}</h3>
                  <p className="text-[10px] font-black text-[#0a1628]/60 uppercase tracking-[0.1em]">{m.label}</p>
                  <p className="text-xs text-muted-foreground mt-3 font-medium">{m.desc}</p>
               </Card>
            ))}
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

            {/* ─── Main Content Column ─── */}
            <div className="lg:col-span-8 space-y-10">

               {/* Metadata Analytics Table */}
               <Card className="border border-border/50 rounded-[3rem] shadow-sm bg-white overflow-hidden">
                  <div className="p-8 border-b border-border/50 bg-muted/20 flex items-center justify-between">
                     <h2 className="text-xl font-black flex items-center gap-3 text-[#0a1628]">
                        <Layers className="w-6 h-6 text-red-600" /> Registry Insights
                     </h2>
                     <Link href="/admin/collections">
                        <button className="text-[10px] font-black text-red-600 uppercase tracking-widest hover:underline flex items-center gap-2">
                           Manage All <ArrowUpRight className="w-3 h-3" />
                        </button>
                     </Link>
                  </div>
                  <div className="p-0 overflow-x-auto">
                     <table className="w-full text-left border-collapse">
                        <thead>
                           <tr className="bg-muted/5 border-b border-border/50 text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
                              <th className="px-8 py-5">Record Profile</th>
                              <th className="px-8 py-5">Classification</th>
                              <th className="px-8 py-5">Integrity</th>
                              <th className="px-8 py-5 text-right">Completion</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                           {materials.slice(0, 6).map((mat) => {
                              const pct = computeCompletion(mat);
                              const color = getCompletionColor(pct);
                              return (
                                 <tr key={mat.id} className="hover:bg-muted/10 transition-colors group">
                                    <td className="px-8 py-6">
                                       <div className="flex items-center gap-4">
                                          <div className="w-12 h-14 rounded-xl bg-muted/20 flex items-center justify-center shrink-0 border border-border/50">
                                             <FileText className="w-6 h-6 text-muted-foreground/30" />
                                          </div>
                                          <div className="min-w-0">
                                             <div className="text-sm font-bold text-[#0a1628] truncate group-hover:text-red-600 transition-colors">{mat.title}</div>
                                             <div className="text-[10px] font-black text-muted-foreground/60 uppercase mt-1 tracking-widest">{mat.uniqueId || 'HCDC-AR-001'}</div>
                                          </div>
                                       </div>
                                    </td>
                                    <td className="px-8 py-6">
                                       <span className="inline-flex items-center gap-1.5 text-[9px] font-black px-2.5 py-1 rounded-full border border-border/50 bg-muted/30 text-muted-foreground uppercase tracking-widest">
                                          <Shield className="w-3 h-3" /> {mat.accessTier}
                                       </span>
                                    </td>
                                    <td className="px-8 py-6">
                                       <div className="flex items-center gap-2">
                                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                          <span className="text-[10px] font-black text-[#0a1628] uppercase tracking-widest">Compliant</span>
                                       </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                       <div className="flex items-center justify-end gap-3">
                                          <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                                             <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                                          </div>
                                          <span className="text-xs font-black" style={{ color }}>{pct}%</span>
                                       </div>
                                    </td>
                                 </tr>
                              );
                           })}
                        </tbody>
                     </table>
                  </div>
               </Card>

               {/* Operational Metrics */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Card className="border border-border/50 rounded-[3rem] shadow-sm bg-white p-10 flex flex-col items-center text-center">
                     <CompletionRing percentage={stats.essentialCompliance} size={180} strokeWidth={12} color="#EF4444" label="Compliance" />
                     <h3 className="text-xl font-black text-[#0a1628] mt-8 mb-2 tracking-tight">Institutional Compliance</h3>
                     <p className="text-xs text-muted-foreground font-medium max-w-[240px]">Adherence to HCDC's essential metadata protocols and archival standards.</p>
                  </Card>

                  <Card className="border border-border/50 rounded-[3rem] shadow-sm bg-white p-10 flex flex-col items-center text-center">
                     <CompletionRing percentage={stats.avgCompletion} size={180} strokeWidth={12} color="#4169E1" label="Average" />
                     <h3 className="text-xl font-black text-[#0a1628] mt-8 mb-2 tracking-tight">Systematic Integrity</h3>
                     <p className="text-xs text-muted-foreground font-medium max-w-[240px]">Overall documentation progress across all sub-fonds and categories.</p>
                  </Card>
               </div>
            </div>

            {/* ─── Side Intelligence Column ─── */}
            <div className="lg:col-span-4 space-y-10">

               {/* Real-time Announcements Engagement */}
               <Card className="border border-border/50 rounded-[3rem] shadow-sm bg-white overflow-hidden">
                  <div className="p-8 border-b border-border/50 bg-[#0a1628] text-white">
                     <h2 className="text-sm font-black flex items-center gap-3 uppercase tracking-[0.2em]">
                        <Megaphone className="w-4 h-4 text-red-600" /> Announcements
                     </h2>
                  </div>
                  <div className="divide-y divide-border/30">
                     {activeAnnouncements.slice(0, 3).map((ann: any) => (
                        <div key={ann.id} className="p-8 hover:bg-muted/5 transition-colors group">
                           <h3 className="font-bold text-[#0a1628] mb-3 line-clamp-1 group-hover:text-red-600 transition-colors">{ann.title}</h3>
                           <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1.5 text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
                                 <Heart className="w-3.5 h-3.5 text-red-500" /> {ann.likes?.length || 0}
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
                                 <MessageSquare className="w-3.5 h-3.5 text-blue-500" /> {ann.comments?.length || 0}
                              </div>
                              <Link href="/admin/announcements" className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button className="text-[9px] font-black text-red-600 uppercase tracking-widest">Details →</button>
                              </Link>
                           </div>
                        </div>
                     ))}
                  </div>
               </Card>

               {/* Critical Feedback Inbox */}
               <Card className="border border-border/50 rounded-[3rem] shadow-sm bg-white overflow-hidden">
                  <div className="p-8 border-b border-border/50 bg-muted/20 flex items-center justify-between">
                     <h2 className="text-sm font-black flex items-center gap-3 text-[#0a1628] uppercase tracking-[0.2em]">
                        <Mail className="w-4 h-4 text-[#0a1628]" /> User Feedback
                     </h2>
                     {feedbacks.filter((f: any) => f.status === 'unread').length > 0 && (
                        <span className="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse">NEW</span>
                     )}
                  </div>
                  <div className="p-0">
                     <div className="divide-y divide-border/30">
                        {feedbacks.slice(0, 4).map((f: any) => (
                           <div key={f.id} className="p-8 hover:bg-muted/5 transition-colors">
                              <div className="flex items-center justify-between mb-2">
                                 <span className="text-[10px] font-black text-[#0a1628] uppercase tracking-widest">{f.name || 'Anonymous'}</span>
                                 <span className="text-[9px] text-muted-foreground/40 font-bold uppercase">
                                     {f.createdAt ? (() => {
                                        const d = new Date(f.createdAt);
                                        return isNaN(d.getTime()) ? "N/A" : format(d, "MMM d");
                                     })() : "N/A"}
                                  </span>
                              </div>
                              <p className="text-xs text-muted-foreground font-medium line-clamp-2 leading-relaxed">{f.message}</p>
                           </div>
                        ))}
                     </div>
                     <Link href="/admin/feedback">
                        <button className="w-full py-6 text-[10px] font-black text-muted-foreground hover:text-[#0a1628] hover:bg-muted/10 transition-all uppercase tracking-[0.2em] border-t border-border/30">
                           Open Full Inbox
                        </button>
                     </Link>
                  </div>
               </Card>

               {/* Security & Audit Trail */}
               <Card className="border-none bg-gradient-to-br from-[#0a1628] to-[#050a14] p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 -mr-10 -mt-10 bg-red-600/10 rounded-full blur-2xl" />
                  <div className="relative z-10">
                     <History className="w-10 h-10 text-red-600 mb-8" />
                     <h3 className="text-2xl font-black mb-4">Integrity Logs</h3>
                     <div className="space-y-4 mb-8">
                        {activityFeed.slice(0, 3).map((log: any, idx: number) => (
                           <div key={idx} className="flex gap-4">
                              <div className="w-1 h-auto bg-white/10 rounded-full" />
                              <div className="min-w-0">
                                 <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-0.5">{log.action}</p>
                                 <p className="text-[11px] text-white/80 font-medium line-clamp-1">{log.details}</p>
                              </div>
                           </div>
                        ))}
                     </div>
                     <Link href="/admin/audit">
                        <button className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black py-4 rounded-2xl transition-all text-[10px] uppercase tracking-[0.2em]">
                           Explore Audit Trail
                        </button>
                     </Link>
                  </div>
               </Card>
            </div>
         </div>
      </AdminLayout>
   );
}

const GitPullRequest = ({ className }: { className?: string }) => <Activity className={className} />;
