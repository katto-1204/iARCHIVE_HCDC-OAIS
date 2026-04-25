import { AdminLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui-components";
import { Database, FolderTree, GitPullRequest, Megaphone, Activity, CheckCircle2, Search, ShieldCheck, BarChart3 } from "lucide-react";
import { useGetAnnouncements } from "@workspace/api-client-react";
import { format } from "date-fns";
import { SAMPLE_MATERIALS, SAMPLE_HIERARCHY } from "@/data/sampleData";
import { computeDashboardStats } from "@/data/metadataUtils";
import { CompletionRing } from "@/components/CompletionRing";
import { ArchivalTree } from "@/components/ArchivalTree";
import { Link } from "wouter";

export default function ArchivistDashboard() {
  const { data: announcements } = useGetAnnouncements();
  const activeAnnouncements = (announcements ?? []).filter((a: any) => a.isActive);
  const stats = computeDashboardStats(SAMPLE_MATERIALS);

  const statCards = [
    { title: "Total Materials", value: stats.totalMaterials, icon: Database, color: "#0a1628" },
    { title: "Fully Described", value: stats.fullyDescribed, icon: CheckCircle2, color: "#10B981" },
    { title: "Avg. Completion", value: `${stats.avgCompletion}%`, icon: BarChart3, color: "#F59E0B" },
  ];

  return (
    <AdminLayout>
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between border-b border-border/50 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-[#0a1628]/10 text-[#0a1628] border border-[#0a1628]/20 rounded-full px-3 py-1 text-xs font-bold mb-3 uppercase tracking-widest">
            <Database className="w-4 h-4" /> Archivist Workspace
          </div>
          <h1 className="text-4xl font-display font-bold text-[#0a1628]">Cataloging & Access Workflow</h1>
          <p className="text-muted-foreground mt-2">Metadata enrichment, controlled access review, and preserving HCDC history.</p>
        </div>
        <div className="mt-4 md:mt-0 text-sm font-medium text-muted-foreground bg-muted/50 px-4 py-2 rounded-xl border border-border/50 flex flex-col items-end">
          <span className="text-[#0a1628]">Shift Active</span>
          <span className="text-xs font-normal flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-500" /> OAIS Aligned Mode
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {statCards.map((card, i) => (
          <Card key={i} className="border-border/50 shadow-sm hover:shadow-md transition-shadow bg-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full opacity-10 transition-transform group-hover:scale-110" style={{ backgroundColor: card.color }} />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: card.color + "15" }}>
                  <card.icon className="w-6 h-6" style={{ color: card.color }} />
                </div>
                <Activity className="w-4 h-4 text-muted-foreground/30" />
              </div>
              <h3 className="text-4xl font-bold font-display text-[#0a1628] mb-1">{card.value}</h3>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{card.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Completion Overview */}
          <Card className="shadow-sm border-border/50 bg-white">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-[#0a1628]">
                <BarChart3 className="w-5 h-5 text-[#4169E1]" /> Completion Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-8">
                <CompletionRing percentage={stats.avgCompletion} size={100} strokeWidth={7} color="#4169E1" label="Overall Average" />
                <CompletionRing percentage={stats.essentialCompliance} size={100} strokeWidth={7} color="#10B981" label="Essential Fields" />
              </div>
            </CardContent>
          </Card>

          {/* Archival Hierarchy Browser */}
          <Card className="shadow-sm border-border/50 bg-white">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-[#0a1628]">
                <FolderTree className="w-5 h-5 text-[#0a1628]" /> Archival Hierarchy
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 max-h-[400px] overflow-y-auto">
              <ArchivalTree
                node={SAMPLE_HIERARCHY}
                onSelectItem={(id) => {
                  // Navigate to material
                }}
              />
            </CardContent>
          </Card>

          {/* Tasks */}
          <Card className="shadow-sm border-border/50 bg-white">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-[#0a1628]">
                <CheckCircle2 className="w-5 h-5 text-[#0a1628]" /> Tasks & Workflow
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                <Link href="/archivist/requests">
                  <div className="p-6 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                        <GitPullRequest className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#0a1628]">Review Pending Access Requests</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">Review researcher access requests for restricted materials.</p>
                      </div>
                    </div>
                    <span className="text-[#0a1628] text-sm font-semibold">→</span>
                  </div>
                </Link>
                <Link href="/archivist/collections">
                  <div className="p-6 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <Database className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#0a1628]">Catalog New Materials</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">Upload and apply ISAD(G) metadata to archival items.</p>
                      </div>
                    </div>
                    <span className="text-[#0a1628] text-sm font-semibold">→</span>
                  </div>
                </Link>
                <div className="p-6 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                      <Search className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#0a1628]">Verify Metadata Completeness</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Check ISAD(G) compliance and fill in missing fields.</p>
                    </div>
                  </div>
                  <button className="text-[#0a1628] text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-[#0a1628]/10 transition-colors">Run Scan →</button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div>
          <Card className="shadow-sm border-border/50 bg-white">
            <div className="p-4 border-b border-border/50 bg-muted/20">
              <h2 className="text-sm font-bold flex items-center gap-2 text-[#0a1628] uppercase tracking-wider">
                <Megaphone className="w-4 h-4 text-[#0a1628]" /> Notice Board
              </h2>
            </div>
            <div className="p-0 max-h-[500px] overflow-y-auto custom-scroll">
              {activeAnnouncements.length > 0 ? (
                <div className="divide-y divide-border/50">
                  {activeAnnouncements.map((ann: any) => (
                    <div key={ann.id} className="p-5 hover:bg-muted/30 transition-colors group">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold text-sm text-[#0a1628] group-hover:text-[#0a1628] transition-colors">{ann.title}</h3>
                        <span className="text-[10px] font-medium text-muted-foreground/60 whitespace-nowrap bg-muted px-2 py-0.5 rounded-full">
                          {format(new Date(ann.createdAt), "MMM d")}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{ann.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Megaphone className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-xs text-muted-foreground">No recent announcements from the admin office.</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
