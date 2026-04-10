import * as React from "react";
import { AdminLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui-components";
import { Badge } from "@/components/ui-components";
import { CompletionRing } from "@/components/CompletionRing";
import { Barcode } from "@/components/Barcode";
import {
  Database, CheckCircle2, BarChart3, TrendingUp, ShieldCheck,
  ChevronDown, ChevronUp, Clock, Upload, Edit3, Shield,
  AlertCircle, XCircle, FileText, Activity, Filter, Lock,
} from "lucide-react";
import { Link } from "wouter";
import {
  COMBINED_FIELDS, ISADG_AREAS,
  PENDING_REQUESTS,
  type ArchivalMaterial,
} from "@/data/sampleData";
import { getMaterials, getActivityFeed } from "@/data/storage";
import {
  computeCompletion, computeISADGCompletion, computeDCCompletion,
  computeAreaBreakdown, getEssentialFieldsStatus, getAllFieldValues,
  getCompletionColor, getCompletionCategory, checkOAISCompliance,
  computeDashboardStats,
} from "@/data/metadataUtils";
import { format } from "date-fns";

type FilterTab = "all" | "complete" | "partial" | "incomplete";

const ACTION_ICONS: Record<string, any> = {
  upload: Upload,
  edit: Edit3,
  metadata_update: BarChart3,
  access_change: Shield,
  delete: XCircle,
  request: ShieldCheck,
};

const CHART_DATA = [12, 18, 15, 25, 32, 28, 45, 38, 52, 48, 65, 72];

const ACTION_COLORS: Record<string, string> = {
  upload: "#10B981",
  edit: "#4169E1",
  metadata_update: "#8B5CF6",
  access_change: "#F59E0B",
  delete: "#EF4444",
  request: "#8B5CF6",
};

export default function AdminDashboard() {
  const [activeFilter, setActiveFilter] = React.useState<FilterTab>("all");
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const [materials, setMaterials] = React.useState<ArchivalMaterial[]>(() => getMaterials());
  const [activityFeed] = React.useState(() => getActivityFeed());
  const stats = React.useMemo(() => computeDashboardStats(materials), [materials]);

  // Filter materials
  const filteredMaterials = React.useMemo(() => {
    return materials.filter(m => {
      const pct = computeCompletion(m);
      switch (activeFilter) {
        case "complete": return pct >= 100;
        case "partial": return pct >= 50 && pct < 100;
        case "incomplete": return pct < 50;
        default: return true;
      }
    });
  }, [materials, activeFilter]);

  // Stat cards data
  const statCards = [
    { title: "Total Materials", value: stats.totalMaterials, icon: Database, color: "#4169E1", desc: "Archival items in repository" },
    { title: "Fully Described", value: stats.fullyDescribed, icon: CheckCircle2, color: "#10B981", desc: "100% metadata completion" },
    { title: "Essential Compliance", value: `${stats.essentialCompliance}%`, icon: ShieldCheck, color: "#8B5CF6", desc: "ISAD(G) required fields rate" },
    { title: "Avg. Completion", value: `${stats.avgCompletion}%`, icon: TrendingUp, color: "#F59E0B", desc: "Average metadata filled" },
  ];

  const filterTabs: Array<{ id: FilterTab; label: string; count: number }> = [
    { id: "all", label: "All", count: materials.length },
    { id: "complete", label: "Complete (100%)", count: materials.filter(m => computeCompletion(m) >= 100).length },
    { id: "partial", label: "Partial (50–99%)", count: materials.filter(m => { const p = computeCompletion(m); return p >= 50 && p < 100; }).length },
    { id: "incomplete", label: "Incomplete (<50%)", count: materials.filter(m => computeCompletion(m) < 50).length },
  ];

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between border-b border-border/50 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-[#0B3D91]/10 text-[#0B3D91] border border-[#0B3D91]/20 rounded-full px-3 py-1 text-xs font-bold mb-3 uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4" /> System Administrator
          </div>
          <h1 className="text-4xl font-display font-bold text-[#0a1628]">Metadata & Compliance Dashboard</h1>
          <p className="text-muted-foreground mt-2">ISAD(G) + Dublin Core metadata completeness, OAIS compliance tracking, and collection analytics.</p>
        </div>
        <div className="mt-4 md:mt-0 text-sm text-muted-foreground flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-xl border border-border/50">
          <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
          System Status: <span className="font-semibold text-emerald-600">Online & Secured</span>
        </div>
      </div>

      {/* ═══ Top Section: Charts & Critical Alerts ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Ingestion Trend (Stock Chart) */}
        <Card className="lg:col-span-2 shadow-sm border-border/50 bg-white overflow-hidden">
          <CardHeader className="border-b border-border/50 pb-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2 text-[#0a1628]">
                <TrendingUp className="w-5 h-5 text-emerald-500" /> Ingestion Velocity
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Growth of digital assets over the last 12 weeks.</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-[#0a1628]">+24%</span>
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Outperforming Target</p>
            </div>
          </CardHeader>
          <CardContent className="p-6 h-[200px] flex items-end gap-1">
            {CHART_DATA.map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center group cursor-pointer">
                <div 
                  className="w-full bg-[#4169E1]/10 group-hover:bg-[#4169E1]/30 transition-all rounded-t-sm relative"
                  style={{ height: `${(val / 80) * 100}%` }}
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#0a1628] text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {val}
                  </div>
                </div>
                <span className="text-[8px] mt-2 text-muted-foreground font-bold">W{i+1}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Important: Critical Alerts & Requests */}
        <Card className="shadow-sm border-border/50 bg-[#0a1628] text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full bg-white/5 blur-2xl" />
          <CardHeader className="border-border/10 pb-4 relative z-10">
            <CardTitle className="text-sm flex items-center gap-2 uppercase tracking-widest font-bold">
              <AlertCircle className="w-4 h-4 text-amber-400" /> Attention Required
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 relative z-10">
            <div className="divide-y divide-white/10">
              <div className="px-5 py-3.5 hover:bg-white/5 transition-colors">
                <div className="text-xs font-bold mb-1 flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                   Pending Access Requests
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/60">{PENDING_REQUESTS.length} researchers waiting for review</span>
                  <Link href="/requests">
                    <button className="text-[9px] font-black uppercase text-[#4169E1] hover:text-white transition-colors">Review Queue</button>
                  </Link>
                </div>
              </div>
              <div className="px-5 py-3.5 hover:bg-white/5 transition-colors">
                <div className="text-xs font-bold mb-1 flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-amber-500" />
                   Metadata Incomplete
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/60">{materials.filter(m => computeCompletion(m) < 50).length} records below 50%</span>
                  <button className="text-[9px] font-black uppercase text-[#4169E1] hover:text-white transition-colors" onClick={() => setActiveFilter("incomplete")}>Fix Items</button>
                </div>
              </div>
              <div className="px-5 py-3.5 hover:bg-white/5 transition-colors">
                <div className="text-xs font-bold mb-1 flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-[#10B981]" />
                   OAIS Integrity Scan
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/60">System-wide scan completed successfully</span>
                  <span className="text-[9px] text-emerald-500 font-bold">STABLE</span>
                </div>
              </div>
            </div>
            <div className="p-5 mt-4">
              <button className="w-full bg-[#4169E1] hover:bg-[#3151b1] text-white text-[10px] font-bold py-2.5 rounded-lg transition-all shadow-lg">
                Run System Maintenance
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((card, i) => (
          <div key={i} className="bg-white border border-border/60 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
             <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg" style={{ backgroundColor: card.color + "15" }}>
                   <card.icon className="w-4 h-4" style={{ color: card.color }} />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{card.title}</span>
             </div>
             <p className="text-2xl font-bold text-[#0a1628] leading-none">{card.value}</p>
          </div>
        ))}
      </div>

      {/* ═══ B. Materials Table ═══ */}
      <Card className="shadow-sm border-border/50 bg-white mb-8">
        <CardHeader className="border-b border-border/50 pb-0 px-5 pt-5">
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-[#0a1628]">
              <Database className="w-5 h-5 text-[#4169E1]" /> Materials Overview
            </CardTitle>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Filter className="w-3.5 h-3.5" />
              {filteredMaterials.length} shown
            </div>
          </div>
          {/* Filter Tabs */}
          <div className="flex gap-1 -mb-px">
            {filterTabs.map(tab => (
              <button
                key={tab.id}
                className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                  activeFilter === tab.id
                    ? "border-[#4169E1] text-[#4169E1]"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setActiveFilter(tab.id)}
              >
                {tab.label}
                <span className="ml-1.5 bg-muted/80 px-1.5 py-0.5 rounded text-[10px]">{tab.count}</span>
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Table Header */}
          <div className="grid grid-cols-[140px_80px_1fr_200px_80px_40px] gap-3 px-5 py-3 bg-muted/30 border-b text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            <span>Unique ID</span>
            <span>Barcode</span>
            <span>Title</span>
            <span>Progress</span>
            <span className="text-right">Completion</span>
            <span></span>
          </div>
          {/* Table Rows */}
          <div className="divide-y divide-border/40">
            {filteredMaterials.map(mat => {
              const pct = computeCompletion(mat);
              const color = getCompletionColor(pct);
              const isExpanded = expandedId === mat.uniqueId;
              const isOAIS = checkOAISCompliance(mat);

              return (
                <div key={mat.uniqueId}>
                  {/* Row */}
                  <div
                    className={`grid grid-cols-[140px_80px_1fr_200px_80px_40px] gap-3 px-5 py-3.5 items-center hover:bg-muted/20 transition-colors cursor-pointer ${isExpanded ? "bg-muted/10" : ""}`}
                    onClick={() => setExpandedId(isExpanded ? null : mat.uniqueId)}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="font-mono text-xs font-bold text-[#0a1628]">{mat.uniqueId}</span>
                    </div>
                    <Barcode value={mat.uniqueId} width={70} height={20} />
                    <div className="min-w-0">
                      <span className="text-sm font-semibold text-[#0a1628] truncate block">{mat.title}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        {isOAIS && (
                          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full inline-flex items-center gap-1">
                            <ShieldCheck className="w-2.5 h-2.5" /> OAIS Compliant
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground">{mat.creator}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted/60 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                    <span className="text-right text-sm font-bold" style={{ color }}>
                      {pct}%
                    </span>
                    <div className="flex justify-center">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground/40" />
                      )}
                    </div>
                  </div>

                  {/* ═══ C. Expanded Record Detail Panel ═══ */}
                  {isExpanded && (
                    <RecordDetailPanel material={mat} />
                  )}
                </div>
              );
            })}
            {filteredMaterials.length === 0 && (
              <div className="py-16 text-center text-muted-foreground">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="font-semibold">No materials match this filter.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

        {/* ═══ G. Activity Feed (Now Expanded) ═══ */}
        <Card className="lg:col-span-2 shadow-sm border-border/50 bg-white">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-sm flex items-center gap-2 text-[#0a1628] uppercase tracking-wider font-bold">
              <Clock className="w-4 h-4 text-muted-foreground" /> Activity Feed
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 max-h-[450px] overflow-y-auto">
            <div className="divide-y divide-border/30">
              {activityFeed.map(entry => {
                const ActionIcon = ACTION_ICONS[entry.actionType] || Activity;
                const actionColor = ACTION_COLORS[entry.actionType] || "#64748b";
                return (
                  <div key={entry.id} className="px-5 py-3.5 hover:bg-muted/20 transition-colors">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{ backgroundColor: actionColor + "15" }}
                      >
                        <ActionIcon className="w-3.5 h-3.5" style={{ color: actionColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[#0a1628] leading-relaxed">
                          <span className="font-bold">{entry.user}</span>{" "}
                          <span className="text-muted-foreground">{entry.description}</span>
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-muted-foreground/60">
                            {format(new Date(entry.timestamp), "MMM d, h:mm a")}
                          </span>
                          <span
                            className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                            style={{ color: actionColor, backgroundColor: actionColor + "12" }}
                          >
                            {entry.actionType.replace("_", " ")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
    </AdminLayout>
  );
}

// ═══ Record Detail Panel (expanded view) ═══════════════════════════════════

function RecordDetailPanel({ material }: { material: ArchivalMaterial }) {
  const pct = computeCompletion(material);
  const isadgPct = computeISADGCompletion(material);
  const dcPct = computeDCCompletion(material);
  const areaBreakdown = computeAreaBreakdown(material);
  const essentialStatus = getEssentialFieldsStatus(material);
  const allFields = getAllFieldValues(material);

  return (
    <div className="bg-gradient-to-b from-muted/20 to-white border-t border-border/30 px-5 py-6 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Col 1: ISAD(G) Area Breakdown */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-[#0a1628] uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-3.5 h-3.5 text-[#4169E1]" /> ISAD(G) Areas
          </h4>
          {areaBreakdown.map(({ area, completion, filled, total }) => (
            <div key={area.number} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-foreground/80">
                  {area.number}. {area.name}
                </span>
                <span className="text-[10px] font-bold" style={{ color: area.color }}>
                  {filled}/{total}
                </span>
              </div>
              <div className="h-1.5 bg-muted/60 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${completion}%`, backgroundColor: area.color }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Col 2: Essential Fields + Completion Rings */}
        <div className="space-y-5">
          {/* ═══ D. Essential Fields Panel ═══ */}
          <div>
            <h4 className="text-xs font-bold text-[#0a1628] uppercase tracking-wider flex items-center gap-2 mb-3">
              <AlertCircle className="w-3.5 h-3.5 text-[#960000]" /> Essential Fields
            </h4>
            <div className="space-y-1.5">
              {essentialStatus.map(({ field, filled }) => (
                <div key={field.code} className="flex items-center gap-2">
                  {filled ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                  )}
                  <span className={`text-xs ${filled ? "text-foreground" : "text-red-600 font-semibold"}`}>
                    {field.name}
                  </span>
                  <span className="text-[9px] text-muted-foreground/50 ml-auto">{field.code}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ═══ E. Standard Completion Rings ═══ */}
          <div className="flex items-center justify-center gap-6 pt-2">
            <CompletionRing percentage={isadgPct} size={90} strokeWidth={6} color="#4169E1" label="ISAD(G)" />
            <CompletionRing percentage={dcPct} size={90} strokeWidth={6} color="#0EA5E9" label="Dublin Core" />
          </div>
        </div>

        {/* Col 3-4: Full Metadata Table */}
        <div className="lg:col-span-2">
          <h4 className="text-xs font-bold text-[#0a1628] uppercase tracking-wider flex items-center gap-2 mb-3">
            <FileText className="w-3.5 h-3.5 text-muted-foreground" /> Full Metadata ({allFields.filter(f => f.filled).length}/{allFields.length} fields)
          </h4>
          <div className="max-h-[350px] overflow-y-auto rounded-xl border border-border/50">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 sticky top-0">
                <tr>
                  <th className="text-left py-2 px-3 font-bold text-muted-foreground">Code</th>
                  <th className="text-left py-2 px-3 font-bold text-muted-foreground">Field</th>
                  <th className="text-left py-2 px-3 font-bold text-muted-foreground">Standard</th>
                  <th className="text-left py-2 px-3 font-bold text-muted-foreground">Value</th>
                  <th className="text-center py-2 px-3 font-bold text-muted-foreground w-12">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {allFields.map(({ field, value, filled }) => (
                  <tr key={field.code} className={`hover:bg-muted/10 ${!filled ? "opacity-60" : ""}`}>
                    <td className="py-1.5 px-3 font-mono text-[10px] text-muted-foreground">{field.code}</td>
                    <td className="py-1.5 px-3 font-semibold text-foreground/80 whitespace-nowrap">
                      {field.name}
                      {field.isEssential && <span className="text-red-500 ml-0.5">*</span>}
                    </td>
                    <td className="py-1.5 px-3">
                      {field.standard === "Both" ? (
                        <Badge variant="accent" className="text-[8px] bg-purple-50 text-purple-700 border-purple-200 px-1.5 py-0">Both</Badge>
                      ) : field.standard === "ISAD(G)" ? (
                        <Badge variant="default" className="text-[8px] bg-blue-50 text-blue-700 border-blue-200 px-1.5 py-0">ISAD(G)</Badge>
                      ) : (
                        <Badge variant="success" className="text-[8px] bg-sky-50 text-sky-700 border-sky-200 px-1.5 py-0">DC</Badge>
                      )}
                    </td>
                    <td className="py-1.5 px-3 max-w-[200px] truncate text-foreground/70">
                      {value || <span className="text-muted-foreground/40 italic">—</span>}
                    </td>
                    <td className="py-1.5 px-3 text-center">
                      {filled ? (
                        <span className="text-emerald-500 font-bold">✔</span>
                      ) : (
                        <span className="text-red-400 font-bold">✘</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
