import * as React from "react";
import { AdminLayout } from "@/components/layout";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Modal } from "@/components/ui-components";
import { CompletionRing } from "@/components/CompletionRing";
import { Barcode } from "@/components/Barcode";
import {
  Database, CheckCircle2, BarChart3, TrendingUp, ShieldCheck,
  ChevronDown, ChevronUp, Clock, Upload, Edit3, Shield,
  AlertCircle, XCircle, FileText, Activity, Filter, Lock, Mail, MessageSquare, Trash2, Info, Sparkles, CheckCircle,
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
import { useGetMaterials, useGetFeedbacks, useMarkFeedbackRead, useGetAuditLogs, useDeleteMaterial, useDeleteFeedback } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { deleteMaterial as deleteMaterialLocal } from "@/data/storage";
import { cn } from "@/lib/utils";

type FilterTab = "all" | "complete" | "partial" | "incomplete";
type DashboardView = "dashboard" | "feedback";

const ACTION_ICONS: Record<string, any> = {
  upload: Upload,
  submit: Upload,
  approve: ShieldCheck,
  reject: XCircle,
  edit: Edit3,
  metadata_update: BarChart3,
  access_change: Shield,
  delete: XCircle,
  request: ShieldCheck,
};

const getApprovalStatus = (material: ArchivalMaterial) => material.approvalStatus || "approved";
const getMaterialDisplayId = (material: any) => material.uniqueId || material.materialId || material.id || "N/A";

const buildIngestionSeries = (materials: ArchivalMaterial[]) => {
  const now = new Date();
  const weeks: number[] = Array.from({ length: 12 }, () => 0);
  const start = new Date(now);
  start.setDate(start.getDate() - 7 * 11);
  start.setHours(0, 0, 0, 0);

  let hasRealDates = false;
  materials.forEach((material) => {
    const dateStr = material.createdAt || material.ingestDate;
    if (!dateStr) return;
    const dt = new Date(dateStr);
    if (Number.isNaN(dt.getTime())) return;
    if (dt >= start && dt <= now) {
      hasRealDates = true;
      const diffWeeks = Math.floor((dt.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
      if (diffWeeks >= 0 && diffWeeks < 12) {
        weeks[diffWeeks] += 1;
      }
    }
  });

  if (!hasRealDates && materials.length > 0) {
    const recentWeeks = Math.min(materials.length, 6);
    materials.forEach((_, idx) => {
      const weekIdx = 12 - recentWeeks + (idx % recentWeeks);
      if (weekIdx >= 0 && weekIdx < 12) weeks[weekIdx] += 1;
    });
  }

  return weeks;
};

const ACTION_COLORS: Record<string, string> = {
  upload: "#10B981",
  submit: "#F59E0B",
  approve: "#10B981",
  reject: "#EF4444",
  edit: "#4169E1",
  metadata_update: "#8B5CF6",
  access_change: "#F59E0B",
  delete: "#EF4444",
  request: "#8B5CF6",
};

export default function AdminDashboard() {
  const [activeFilter, setActiveFilter] = React.useState<FilterTab>("all");
  const [activeView, setActiveView] = React.useState<DashboardView>("dashboard");
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [materialToDelete, setMaterialToDelete] = React.useState<any>(null);
  const [deleteNotFound, setDeleteNotFound] = React.useState(false);
  const [selectedMaterialIds, setSelectedMaterialIds] = React.useState<Record<string, boolean>>({});
  const [bulkDeleteOpen, setBulkDeleteOpen] = React.useState(false);
  const [bulkDeleting, setBulkDeleting] = React.useState(false);
  const [bulkNotFoundCount, setBulkNotFoundCount] = React.useState(0);

  const { data: materialsData } = useGetMaterials({ limit: 1000 });
  const { data: feedbackData } = useGetFeedbacks();
  const { data: auditData } = useGetAuditLogs({ limit: 15 });
  const markRead = useMarkFeedbackRead();
  const deleteMat = useDeleteMaterial();
  const { toast } = useToast();
  
  const [materials, setMaterials] = React.useState<ArchivalMaterial[]>([]);

  React.useEffect(() => {
    if (materialsData?.materials) {
      setMaterials(materialsData.materials);
    } else {
      setMaterials([]);
    }
  }, [materialsData]);
  const feedbacks = feedbackData || [];
  const activityFeed = auditData?.logs ?? [];
  
  const stats = React.useMemo(() => computeDashboardStats(materials), [materials]);
  
  const unreadFeedbackCount = React.useMemo(() => feedbacks.filter((f: any) => f.status === 'unread').length, [feedbacks]);

  const ingestionSeries = React.useMemo(() => buildIngestionSeries(materials), [materials]);
  const maxIngestion = Math.max(...ingestionSeries, 1);
  const weeklySeries = React.useMemo(() => {
    const labels = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
    const points = ingestionSeries.slice(-7);
    return labels.map((label, idx) => ({ label, value: points[idx] ?? 0 }));
  }, [ingestionSeries]);
  const stockChartPoints = React.useMemo(() => {
    if (weeklySeries.length === 0) return "";
    const weekMax = Math.max(...weeklySeries.map((p) => p.value), 1);
    return weeklySeries
      .map((val, i) => {
        const x = (i / (weeklySeries.length - 1 || 1)) * 100;
        const y = 100 - (val.value / weekMax) * 85;
        return `${x},${y}`;
      })
      .join(" ");
  }, [weeklySeries]);
  const totalIngested = ingestionSeries.reduce((a, b) => a + b, 0);
  const pendingApprovals = React.useMemo(
    () => materials.filter((m) => getApprovalStatus(m) === "pending").length,
    [materials],
  );
  const lastWeek = ingestionSeries[ingestionSeries.length - 1] || 0;
  const prevWeek = ingestionSeries[ingestionSeries.length - 2] || 0;
  const growthPct = prevWeek ? Math.round(((lastWeek - prevWeek) / prevWeek) * 100) : (lastWeek > 0 ? 100 : 0);
  const growthLabel = `${growthPct >= 0 ? "+" : ""}${growthPct}%`;
  const growthText = prevWeek ? (growthPct >= 0 ? "Outperforming Target" : "Below Target") : (lastWeek > 0 ? "New Ingest Cycle" : `${totalIngested} total ingested`);
  
  const MetricSparklineCard = ({
    title,
    value,
    deltaLabel,
    series,
    labels,
    color = "#16a34a",
  }: {
    title: string;
    value: React.ReactNode;
    deltaLabel?: string;
    series: number[];
    labels: string[];
    color?: string;
  }) => {
    const max = Math.max(...series, 1);
    const points = series
      .map((v, i) => {
        const x = (i / (series.length - 1 || 1)) * 100;
        const y = 100 - (v / max) * 85;
        return { x, y, v };
      });
    const polyPoints = points.map((p) => `${p.x},${p.y}`).join(" ");

    return (
      <div className="bg-white border border-border/60 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#0a1628]">{title}</h3>
              <span className="text-muted-foreground text-xs font-black border border-border/60 rounded-full px-2 py-0.5">i</span>
            </div>
            <div className="mt-2 text-5xl font-black text-[#0a1628] leading-none">{value}</div>
          </div>
          {deltaLabel && (
            <div
              className={cn(
                "shrink-0 text-sm font-black px-3 py-1 rounded-xl border",
                deltaLabel.startsWith("+")
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-red-50 text-red-700 border-red-200",
              )}
            >
              {deltaLabel}
            </div>
          )}
        </div>

        <div className="mt-4">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-[92px]">
            <defs>
              <linearGradient id={`sparkFill-${title.replace(/\s+/g, "-")}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.18" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>
            <polygon points={`${polyPoints} 100,100 0,100`} fill={`url(#sparkFill-${title.replace(/\s+/g, "-")})`} />
            <polyline points={polyPoints} fill="none" stroke={color} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
          <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
            <span>{labels[0] ?? ""}</span>
            <span>{labels[labels.length - 1] ?? ""}</span>
          </div>
        </div>
      </div>
    );
  };

  const completionBuckets = React.useMemo(() => {
    const buckets = [
      { label: "100%", range: [100, 100], color: "#10B981", count: 0 },
      { label: "75–99%", range: [75, 99], color: "#4169E1", count: 0 },
      { label: "50–74%", range: [50, 74], color: "#F59E0B", count: 0 },
      { label: "25–49%", range: [25, 49], color: "#F97316", count: 0 },
      { label: "0–24%", range: [0, 24], color: "#EF4444", count: 0 },
    ];
    materials.forEach(m => {
      const pct = computeCompletion(m);
      for (const b of buckets) {
        if (pct >= b.range[0] && pct <= b.range[1]) { b.count++; break; }
      }
    });
    return buckets;
  }, [materials]);
  const maxBucket = Math.max(...completionBuckets.map(b => b.count), 1);

  const typeDistribution = React.useMemo(() => {
    const types = { document: 0, image: 0, video: 0, other: 0 };
    materials.forEach(m => {
      const ft = (m.fileType || m.format || "").toLowerCase();
      if (ft.includes("pdf") || ft.includes("doc") || ft.includes("text") || ft.includes("application")) types.document++;
      else if (ft.includes("image") || ft.includes("jpg") || ft.includes("png")) types.image++;
      else if (ft.includes("video") || ft.includes("mp4")) types.video++;
      else types.other++;
    });
    return [
      { label: "Documents", count: types.document, color: "#4169E1", icon: "📄" },
      { label: "Images", count: types.image, color: "#10B981", icon: "🖼️" },
      { label: "Videos", count: types.video, color: "#8B5CF6", icon: "🎬" },
      { label: "Other", count: types.other, color: "#64748B", icon: "📦" },
    ];
  }, [materials]);
  const totalTyped = typeDistribution.reduce((a, b) => a + b.count, 0) || 1;

  const oaisRate = React.useMemo(() => {
    if (materials.length === 0) return 0;
    return Math.round((materials.filter(m => checkOAISCompliance(m)).length / materials.length) * 100);
  }, [materials]);

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

  const selectedIds = React.useMemo(
    () => Object.keys(selectedMaterialIds).filter((id) => selectedMaterialIds[id]),
    [selectedMaterialIds]
  );

  const toggleSelected = (id: string, next?: boolean) => {
    setSelectedMaterialIds((prev) => {
      const value = typeof next === "boolean" ? next : !prev[id];
      const updated = { ...prev, [id]: value };
      if (!value) delete updated[id];
      return updated;
    });
  };

  const clearSelected = () => setSelectedMaterialIds({});

  const allShownSelected = React.useMemo(() => {
    if (filteredMaterials.length === 0) return false;
    return filteredMaterials.every((m: any) => !!selectedMaterialIds[m.id]);
  }, [filteredMaterials, selectedMaterialIds]);

  const someShownSelected = React.useMemo(() => {
    if (filteredMaterials.length === 0) return false;
    const any = filteredMaterials.some((m: any) => !!selectedMaterialIds[m.id]);
    return any && !allShownSelected;
  }, [filteredMaterials, selectedMaterialIds, allShownSelected]);

  const statCards = [
    { title: "Total Materials", value: stats.totalMaterials, icon: Database, color: "#4169E1" },
    { title: "Fully Described", value: stats.fullyDescribed, icon: CheckCircle2, color: "#10B981" },
    { title: "Essential Compliance", value: `${stats.essentialCompliance}%`, icon: ShieldCheck, color: "#8B5CF6" },
    { title: "Avg. Completion", value: `${stats.avgCompletion}%`, icon: TrendingUp, color: "#F59E0B" },
  ];

  const filterTabs: Array<{ id: FilterTab; label: string; count: number }> = [
    { id: "all", label: "All", count: materials.length },
    { id: "complete", label: "Complete (100%)", count: materials.filter(m => computeCompletion(m) >= 100).length },
    { id: "partial", label: "Partial (50–99%)", count: materials.filter(m => { const p = computeCompletion(m); return p >= 50 && p < 100; }).length },
    { id: "incomplete", label: "Incomplete (<50%)", count: materials.filter(m => computeCompletion(m) < 50).length },
  ];

  const compactFeedback = (feedbacks as any[])
    .slice()
    .sort((a: any, b: any) => new Date(b.createdAt || b.date || 0).getTime() - new Date(a.createdAt || a.date || 0).getTime())
    .slice(0, 6);

  return (
    <AdminLayout>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-black text-[#0a1628] tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Ingestion analytics with quick feedback inbox.</p>
        </div>
        <Link href="/admin/collections">
          <Button className="bg-[#0a1628] hover:bg-[#142742] text-white font-bold rounded-xl h-10 px-4">
            View Materials
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 mb-10">
        <MetricSparklineCard
          title="Ingestion"
          value={lastWeek}
          deltaLabel={growthLabel}
          series={weeklySeries.map((p) => p.value)}
          labels={weeklySeries.map((p) => p.label)}
          color="#16a34a"
        />

        <div className="bg-white border border-border/60 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#4169E1]" />
              <h3 className="text-sm font-black text-[#0a1628]">Feedback</h3>
            </div>
            {unreadFeedbackCount > 0 && (
              <span className="text-[11px] font-black bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-full">
                {unreadFeedbackCount} new
              </span>
            )}
          </div>

          <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
            {compactFeedback.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No feedback yet.
              </div>
            ) : (
              compactFeedback.map((f: any) => (
                <button
                  key={f.id}
                  onClick={() => {
                    if (f.status === "unread") markRead.mutate({ id: f.id });
                    setActiveView("feedback");
                  }}
                  className={cn(
                    "w-full text-left rounded-xl border px-4 py-3 transition-all",
                    f.status === "unread"
                      ? "border-[#4169E1]/30 bg-[#4169E1]/5 hover:bg-[#4169E1]/10"
                      : "border-border/50 bg-white hover:bg-muted/30"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-bold text-[#0a1628] truncate">{f.name || "Anonymous"}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{f.date || ""}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{f.message}</p>
                </button>
              ))
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-border/50 flex justify-between items-center">
            <span className="text-xs text-muted-foreground">{feedbacks.length} total</span>
            <button
              className="text-xs font-black text-[#4169E1] hover:underline"
              onClick={() => setActiveView("feedback")}
            >
              Open inbox →
            </button>
          </div>
        </div>
      </div>

      {activeView === "feedback" && (
        <div className="animate-fade-in mb-10">
          <FeedbackView />
        </div>
      )}

      <Card className="shadow-sm border-border/50 bg-white mb-8">
        <CardHeader className="border-b border-border/50 pb-0 px-5 pt-5">
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-[#0a1628]">
              <Database className="w-5 h-5 text-[#4169E1]" /> Materials Overview
            </CardTitle>
            <div className="flex items-center gap-2">
              {selectedIds.length > 0 && (
                <>
                  <span className="text-xs font-bold text-slate-500">{selectedIds.length} selected</span>
                  <Button
                    variant="destructive"
                    className="h-8 px-3 rounded-lg text-xs font-black"
                    onClick={() => {
                      setBulkNotFoundCount(0);
                      setBulkDeleteOpen(true);
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-2" />
                    Delete selected
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 px-3 rounded-lg text-xs font-black"
                    onClick={clearSelected}
                  >
                    Clear
                  </Button>
                </>
              )}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Filter className="w-3.5 h-3.5" />
                {filteredMaterials.length} shown
              </div>
            </div>
          </div>
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
          <div className="grid grid-cols-[34px_140px_80px_1fr_180px_80px_40px_40px] gap-3 px-5 py-3 bg-muted/30 border-b text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            <span className="flex items-center justify-center">
              <input
                aria-label="Select all shown materials"
                type="checkbox"
                className="h-3.5 w-3.5 accent-[#4169E1]"
                checked={allShownSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someShownSelected;
                }}
                onChange={(e) => {
                  const next = e.target.checked;
                  setSelectedMaterialIds((prev) => {
                    const updated = { ...prev };
                    for (const m of filteredMaterials as any[]) {
                      if (next) updated[m.id] = true;
                      else delete updated[m.id];
                    }
                    return updated;
                  });
                }}
              />
            </span>
            <span>Unique ID</span>
            <span>Barcode</span>
            <span>Title</span>
            <span>Progress</span>
            <span className="text-right">Completion</span>
            <span></span>
            <span></span>
          </div>
          <div className="divide-y divide-border/40">
            {filteredMaterials.map(mat => {
              const pct = computeCompletion(mat);
              const color = getCompletionColor(pct);
              const isExpanded = expandedId === mat.id;
              const isOAIS = checkOAISCompliance(mat);

              return (
                <div key={mat.id}>
                  <div
                    className={`grid grid-cols-[34px_140px_80px_1fr_180px_80px_40px_40px] gap-3 px-5 py-3.5 items-center hover:bg-muted/20 transition-colors cursor-pointer ${isExpanded ? "bg-muted/10" : ""}`}
                    onClick={() => setExpandedId(isExpanded ? null : mat.id)}
                  >
                    <div className="flex items-center justify-center">
                      <input
                        aria-label={`Select material ${getMaterialDisplayId(mat)}`}
                        type="checkbox"
                        className="h-3.5 w-3.5 accent-[#4169E1]"
                        checked={!!selectedMaterialIds[mat.id]}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => toggleSelected(mat.id, e.target.checked)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="font-mono text-xs font-bold text-[#0a1628]">{getMaterialDisplayId(mat)}</span>
                    </div>
                    <Barcode value={getMaterialDisplayId(mat)} width={70} height={20} />
                    <div className="min-w-0">
                      <span className="text-sm font-semibold text-[#0a1628] truncate block">{mat.title}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        {isOAIS && (
                          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full inline-flex items-center gap-1">
                            <ShieldCheck className="w-2.5 h-2.5" /> OAIS Aligned
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
                      <button
                        className="p-1.5 rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMaterialToDelete(mat);
                          setDeleteConfirmOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex justify-center">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground/40" />
                      )}
                    </div>
                  </div>

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

        <Card className="lg:col-span-2 shadow-sm border-border/50 bg-white">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-sm flex items-center gap-2 text-[#0a1628] uppercase tracking-wider font-bold">
              <Clock className="w-4 h-4 text-muted-foreground" /> Activity Feed
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 max-h-[450px] overflow-y-auto">
            <div className="divide-y divide-border/30">
              {activityFeed.length === 0 && (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  <Activity className="w-8 h-8 mx-auto mb-3 opacity-20" />
                  <p>No activity recorded yet.</p>
                </div>
              )}
              {activityFeed.map((entry: any, idx: number) => {
                const actionType = entry.actionType || entry.action || "edit";
                const actionColor = ACTION_COLORS[actionType] || "#94a3b8";
                const ActionIcon = ACTION_ICONS[actionType] || Activity;
                const dateStr = entry.timestamp || entry.createdAt;
                const validDate = dateStr && !isNaN(new Date(dateStr).getTime()) ? new Date(dateStr) : new Date();
                return (
                  <div key={entry.id ? `audit-${entry.id}` : `idx-${idx}`} className="px-5 py-3.5 hover:bg-muted/20 transition-colors">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{ backgroundColor: actionColor + "15" }}
                      >
                        <ActionIcon className="w-3.5 h-3.5" style={{ color: actionColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[#0a1628] leading-relaxed">
                          <span className="font-bold">{entry.user || entry.userName || "System"}</span>{" "}
                          <span className="text-muted-foreground">{entry.description || entry.details || "Performed an action"}</span>
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-muted-foreground/60">
                            {format(validDate, "MMM d, h:mm a")}
                          </span>
                          <span
                            className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                            style={{ color: actionColor, backgroundColor: actionColor + "12" }}
                          >
                            {actionType.replace("_", " ")}
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
      

      <Modal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Confirm Deletion"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl text-red-700 border border-red-100 font-semibold text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            This action is permanent and cannot be undone.
          </div>
          {deleteNotFound && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl text-amber-800 border border-amber-200 font-semibold text-sm">
              <Info className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <div className="font-black">Cloud record not found.</div>
                <div className="text-[12px] font-medium text-amber-800/80 mt-1 leading-relaxed">
                  This material does not exist in Firestore/API anymore (404). Clicking delete will still remove the orphan record from the dashboard/local cache.
                </div>
              </div>
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <span className="font-bold text-[#0a1628]">"{materialToDelete?.title}"</span>? 
            All associated metadata and file references will be removed from the archive.
          </p>
          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => { setDeleteConfirmOpen(false); setDeleteNotFound(false); }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              className="flex-1"
              isLoading={deleteMat.isPending}
              onClick={() => {
                if (materialToDelete) {
                  setDeleteNotFound(false);
                  deleteMat.mutate(materialToDelete.id, {
                    onSuccess: () => {
                      toast({ title: "Material deleted", description: "The record has been permanently removed." });
                      setMaterials(prev => prev.filter(m => m.id !== materialToDelete.id));
                      setDeleteConfirmOpen(false);
                      setMaterialToDelete(null);
                      setDeleteNotFound(false);
                    },
                    onError: (err: any) => {
                      const status = err?.status || err?.response?.status;
                      if (status === 404) {
                        // Orphan/local-only record: allow deletion from local cache so user can clean up UI.
                        try { deleteMaterialLocal(materialToDelete.id); } catch {}
                        setMaterials(prev => prev.filter(m => m.id !== materialToDelete.id));
                        toast({
                          title: "Orphan record removed",
                          description: "Cloud record was not found (404). Removed from local cache/dashboard.",
                        });
                        setDeleteConfirmOpen(false);
                        setMaterialToDelete(null);
                        setDeleteNotFound(false);
                        return;
                      }
                      toast({
                        variant: "destructive",
                        title: "Delete failed",
                        description: err?.message || "Unable to delete material.",
                      });
                    }
                  });
                }
              }}
            >
              Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        title="Confirm Bulk Deletion"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl text-red-700 border border-red-100 font-semibold text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            This action is permanent and cannot be undone.
          </div>
          <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl text-amber-800 border border-amber-200 font-semibold text-sm">
            <Info className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-[12px] font-medium text-amber-800/80 leading-relaxed">
              If some records are already missing in Firestore/API (404), we will still remove them from the dashboard/local cache.
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            You are about to delete <span className="font-black text-[#0a1628]">{selectedIds.length}</span> material{selectedIds.length === 1 ? "" : "s"}.
          </p>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setBulkDeleteOpen(false)}
              disabled={bulkDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              isLoading={bulkDeleting}
              onClick={async () => {
                const ids = [...selectedIds];
                if (ids.length === 0) {
                  setBulkDeleteOpen(false);
                  return;
                }
                setBulkDeleting(true);
                let notFound = 0;
                for (const id of ids) {
                  try {
                    await (deleteMat as any).mutateAsync(id);
                  } catch (err: any) {
                    const status = err?.status || err?.response?.status;
                    if (status === 404) {
                      notFound += 1;
                      try { deleteMaterialLocal(id); } catch {}
                    } else {
                      toast({
                        variant: "destructive",
                        title: "Delete failed",
                        description: err?.message || `Unable to delete ${id}`,
                      });
                    }
                  }
                }
                setBulkNotFoundCount(notFound);
                setMaterials((prev) => prev.filter((m) => !selectedMaterialIds[m.id]));
                clearSelected();
                setBulkDeleting(false);
                setBulkDeleteOpen(false);
                toast({
                  title: "Bulk delete complete",
                  description: notFound > 0
                    ? `Deleted selected materials. ${notFound} were not found in the cloud (404) and were removed locally.`
                    : "Deleted selected materials.",
                });
              }}
            >
              Delete selected
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}

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

        <div className="space-y-5">
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

          <div className="flex items-center justify-center gap-6 pt-2">
            <CompletionRing percentage={isadgPct} size={90} strokeWidth={6} color="#4169E1" label="ISAD(G)" />
            <CompletionRing percentage={dcPct} size={90} strokeWidth={6} color="#0EA5E9" label="Dublin Core" />
          </div>
        </div>

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

function FeedbackView() {
  const { data: feedbackData } = useGetFeedbacks();
  const markReadMutation = useMarkFeedbackRead();
  const deleteFeedbackMutation = useDeleteFeedback();
  const feedbacks = Array.isArray(feedbackData) ? feedbackData : [];
  const [selectedFeedback, setSelectedFeedback] = React.useState<any>(null);
  const [feedbackToDelete, setFeedbackToDelete] = React.useState<any>(null);
  const [feedbackDeleteOpen, setFeedbackDeleteOpen] = React.useState(false);

  const handleMarkRead = (id: string) => {
    markReadMutation.mutate({ id });
  };

  const getStatusColor = (type: string) => {
    switch (type) {
      case 'Bug Report': return 'bg-red-50 text-red-600 border-red-100';
      case 'Suggestion': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Compliment': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'Bug Report': return <AlertCircle className="w-4 h-4" />;
      case 'Suggestion': return <Info className="w-4 h-4" />;
      case 'Compliment': return <Sparkles className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-border/40 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <MessageSquare className="w-16 h-16" />
          </div>
          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Submissions</h4>
          <div className="text-4xl font-black text-[#0a1628]">{feedbacks.length}</div>
          <p className="text-[10px] text-muted-foreground mt-2 font-medium">Accumulated platform feedback</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-border/40 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-red-500">
            <AlertCircle className="w-16 h-16" />
          </div>
          <h4 className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-1">Critical Bugs</h4>
          <div className="text-4xl font-black text-red-600">{feedbacks.filter(f => f.type === 'Bug Report').length}</div>
          <p className="text-[10px] text-red-400 mt-2 font-medium">Requires immediate attention</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-border/40 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-[#4169E1]">
            <Info className="w-16 h-16" />
          </div>
          <h4 className="text-[10px] font-black uppercase tracking-widest text-[#4169E1]/60 mb-1">Suggestions</h4>
          <div className="text-4xl font-black text-[#4169E1]">{feedbacks.filter(f => f.type === 'Suggestion').length}</div>
          <p className="text-[10px] text-[#4169E1]/60 mt-2 font-medium">Feature requests & ideas</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-border/40 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-emerald-500">
            <Sparkles className="w-16 h-16" />
          </div>
          <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">Love & Praise</h4>
          <div className="text-4xl font-black text-emerald-600">{feedbacks.filter(f => f.type === 'Compliment').length}</div>
          <p className="text-[10px] text-emerald-400 mt-2 font-medium">Positive user sentiment</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-1">
             <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Recent Inboxes</h3>
             <Badge variant="outline" className="text-[9px] font-bold">{feedbacks.filter(f => f.status === 'unread').length} New</Badge>
          </div>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {feedbacks.map((f: any) => (
              <div 
                key={f.id} 
                onClick={() => {
                  setSelectedFeedback(f);
                  if (f.status === 'unread') handleMarkRead(f.id);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer group ${
                  selectedFeedback?.id === f.id 
                    ? 'border-[#4169E1] bg-[#4169E1]/5 shadow-sm' 
                    : 'border-border/40 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter border ${getStatusColor(f.type)}`}>
                    {f.type}
                  </div>
                  {f.status === 'unread' && <div className="w-2 h-2 rounded-full bg-[#4169E1] animate-pulse" />}
                </div>
                <h5 className="text-sm font-bold text-[#0a1628] line-clamp-1">{f.name || 'Anonymous User'}</h5>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                  {f.message}
                </p>
                <div className="flex items-center justify-between mt-3 text-[10px] text-slate-400 font-medium">
                   <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> {f.date}</div>
                   <div className="group-hover:text-[#4169E1] transition-colors">View Details →</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3">
          {selectedFeedback ? (
            <Card className="h-full border-border/50 shadow-xl overflow-hidden rounded-3xl bg-white flex flex-col">
               <div className={`h-2 ${getStatusColor(selectedFeedback.type).split(' ')[0]}`} />
               <div className="p-8 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-8">
                     <div>
                        <div className="flex items-center gap-2 mb-3">
                           <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${getStatusColor(selectedFeedback.type)}`}>
                              {getIcon(selectedFeedback.type)}
                           </div>
                           <span className="text-xs font-black uppercase tracking-widest text-slate-400">{selectedFeedback.type}</span>
                        </div>
                        <h2 className="text-3xl font-display font-black text-[#0a1628]">{selectedFeedback.name || 'Anonymous'}</h2>
                        <p className="text-sm text-slate-400 flex items-center gap-2 mt-1 font-medium">
                           <Mail className="w-4 h-4" /> {selectedFeedback.email || 'No email provided'}
                        </p>
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Submitted On</p>
                        <p className="text-sm font-bold text-[#0a1628]">{selectedFeedback.date}</p>
                     </div>
                  </div>

                  <div className="bg-slate-50/50 border border-border/40 rounded-[2rem] p-8 mb-8 relative">
                     <div className="absolute -top-4 left-8 bg-white border border-border/40 px-4 py-1 rounded-full flex items-center gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-[#4169E1]" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Message Body</span>
                     </div>
                     <p className="text-lg text-slate-600 leading-relaxed font-medium italic">
                        "{selectedFeedback.message}"
                     </p>
                  </div>

                  <div className="mt-auto pt-8 border-t border-border/40 flex items-center justify-between">
                     <div className="flex gap-3">
                        <Button variant="outline" className="rounded-xl border-slate-200 hover:bg-slate-50 text-xs font-bold h-10 px-6">
                           <Mail className="w-4 h-4 mr-2" /> Reply via Email
                        </Button>
                        <Button
                          variant="ghost"
                          className="rounded-xl text-red-500 hover:bg-red-50 text-xs font-bold h-10 px-6"
                          onClick={() => {
                            setFeedbackToDelete(selectedFeedback);
                            setFeedbackDeleteOpen(true);
                          }}
                        >
                           <Trash2 className="w-4 h-4 mr-2" /> Delete Archive
                        </Button>
                     </div>
                     <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 rounded-lg py-1 px-4 font-black uppercase tracking-widest text-[9px]">
                        Verified Submission
                     </Badge>
                  </div>
               </div>
            </Card>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-slate-50/50 border border-dashed border-slate-200 rounded-[3rem] p-12 text-center">
               <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-6">
                  <MessageSquare className="w-10 h-10 text-slate-200" />
               </div>
               <h3 className="text-xl font-bold text-slate-400">Select a feedback to view details</h3>
               <p className="text-sm text-slate-300 max-w-xs mt-2">Manage user suggestions, complaints, and compliments from this centralized panel.</p>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={feedbackDeleteOpen}
        onClose={() => setFeedbackDeleteOpen(false)}
        title="Delete Feedback"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl text-red-700 border border-red-100 font-semibold text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            This action is permanent and cannot be undone.
          </div>
          <p className="text-sm text-muted-foreground">
            Delete feedback from <span className="font-black text-[#0a1628]">{feedbackToDelete?.name || "Anonymous"}</span>?
          </p>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setFeedbackDeleteOpen(false)}
              disabled={deleteFeedbackMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              isLoading={deleteFeedbackMutation.isPending}
              onClick={async () => {
                const id = feedbackToDelete?.id;
                if (!id) return;
                try {
                  await (deleteFeedbackMutation as any).mutateAsync({ id });
                  if (selectedFeedback?.id === id) setSelectedFeedback(null);
                  setFeedbackDeleteOpen(false);
                  setFeedbackToDelete(null);
                } catch (err) {
                  // api-client-react will throw; keep modal open so user can retry.
                }
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
