import { Link } from "wouter";
import { AdminLayout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui-components";
import { BookOpen, Search, Shield, Megaphone, ArrowRight, Clock, Star, ArrowUpRight, FileText, CheckCircle2, XCircle } from "lucide-react";
import { useGetAnnouncements, useGetMaterials, useGetAccessRequests } from "@workspace/api-client-react";
import { format } from "date-fns";
import * as React from "react";
import { getMaterialById } from "@/data/storage";

export default function StudentDashboard() {
  const [tab, setTab] = React.useState<"overview" | "accessed">("overview");
  const { data: announcements } = useGetAnnouncements();
  const activeAnnouncements = (announcements ?? []).filter((a: any) => a.isActive);
  const { data: materialsData, isLoading: isMaterialsLoading } = useGetMaterials({ access: "public", limit: 5 });
  const { data: approvedRequests, isLoading: isApprovedLoading } = useGetAccessRequests({ status: "approved" });
  const { data: pendingRequests, isLoading: isPendingLoading } = useGetAccessRequests({ status: "pending" });
  const { data: rejectedRequests, isLoading: isRejectedLoading } = useGetAccessRequests({ status: "rejected" });
  const isRequestsLoading = isApprovedLoading || isPendingLoading || isRejectedLoading;

  const allRequests = React.useMemo(() => {
    return [
      ...(pendingRequests?.requests || []).map((r: any) => ({ ...r, status: "pending" })),
      ...(approvedRequests?.requests || []).map((r: any) => ({ ...r, status: "approved" })),
      ...(rejectedRequests?.requests || []).map((r: any) => ({ ...r, status: "rejected" })),
    ];
  }, [pendingRequests?.requests, approvedRequests?.requests, rejectedRequests?.requests]);

  const statusOrder = ["borrow", "request", "decision"] as const;

  const getStatusTone = (status: string) => {
    if (status === "approved") return { bg: "bg-emerald-500", text: "text-emerald-700", chip: "bg-emerald-50 border-emerald-200" };
    if (status === "rejected") return { bg: "bg-red-500", text: "text-red-700", chip: "bg-red-50 border-red-200" };
    return { bg: "bg-amber-500", text: "text-amber-700", chip: "bg-amber-50 border-amber-200" };
  };

  return (
    <AdminLayout>
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between border-b border-border/50 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-[#960000]/10 text-[#960000] border border-[#960000]/20 rounded-full px-3 py-1 text-xs font-bold mb-3 uppercase tracking-widest">
            <BookOpen className="w-4 h-4" /> User Portal
          </div>
          <h1 className="text-4xl font-display font-bold text-[#0a1628]">Research Dashboard</h1>
          <p className="text-muted-foreground mt-2">Manage your archival research and access approved restricted materials.</p>
        </div>
        <div className="flex gap-2 bg-muted/50 p-1.5 rounded-2xl border border-border/50">
          <button 
            onClick={() => setTab("overview")}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${tab === "overview" ? "bg-[#960000] text-white shadow-lg shadow-[#960000]/20" : "text-muted-foreground hover:text-foreground hover:bg-white"}`}
          >
            Overview
          </button>
          <button 
            onClick={() => setTab("accessed")}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${tab === "accessed" ? "bg-[#960000] text-white shadow-lg shadow-[#960000]/20" : "text-muted-foreground hover:text-foreground hover:bg-white"}`}
          >
            Accessed Materials
            {approvedRequests?.total ? approvedRequests.total : 0 > 0 && <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${tab === "accessed" ? "bg-white text-[#960000]" : "bg-[#960000] text-white"}`}>{approvedRequests?.total}</span>}
          </button>
        </div>
      </div>

      {tab === "overview" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/collections" className="group block">
                <Card className="h-full border-border/50 shadow-sm hover:shadow-md transition-all hover:border-[#960000]/30 hover:-translate-y-1 bg-white cursor-pointer overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 rounded-full bg-[#960000]/5 group-hover:bg-[#960000]/10 transition-colors" />
                  <CardContent className="p-6 relative z-10 flex flex-col h-full">
                    <div className="w-10 h-10 rounded-xl bg-[#960000]/10 flex items-center justify-center mb-4 text-[#960000] group-hover:scale-110 transition-transform">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-[#0a1628] mb-1">Public Resources</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed flex-grow">Explore yearbooks, photos, and institutional publications.</p>
                    <ArrowRight className="w-4 h-4 text-[#960000] mt-4 opacity-0 group-hover:opacity-100 transition-opacity -ml-2 group-hover:ml-0" />
                  </CardContent>
                </Card>
              </Link>

              <Link href="/collections" className="group block">
                <Card className="h-full border-border/50 shadow-sm hover:shadow-md transition-all hover:border-[#960000]/30 hover:-translate-y-1 bg-white cursor-pointer overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 rounded-full bg-[#960000]/5 group-hover:bg-[#960000]/10 transition-colors" />
                  <CardContent className="p-6 relative z-10 flex flex-col h-full">
                    <div className="w-10 h-10 rounded-xl bg-[#960000]/10 flex items-center justify-center mb-4 text-[#960000] group-hover:scale-110 transition-transform">
                      <Search className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-[#0a1628] mb-1">Discover Options</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed flex-grow">Use advanced search and filters to find records.</p>
                    <ArrowRight className="w-4 h-4 text-[#960000] mt-4 opacity-0 group-hover:opacity-100 transition-opacity -ml-2 group-hover:ml-0" />
                  </CardContent>
                </Card>
              </Link>

              <button onClick={() => setTab("accessed")} className="group block text-left w-full">
                <Card className="h-full border-border/50 shadow-sm hover:shadow-md transition-all hover:border-[#960000]/30 hover:-translate-y-1 bg-white cursor-pointer overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 rounded-full bg-[#960000]/5 group-hover:bg-[#960000]/10 transition-colors" />
                  <CardContent className="p-6 relative z-10 flex flex-col h-full">
                    <div className="w-10 h-10 rounded-xl bg-[#960000]/10 flex items-center justify-center mb-4 text-[#960000] group-hover:scale-110 transition-transform">
                      <Shield className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-[#0a1628] mb-1">Approved Assets</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed flex-grow">Access restricted items granted by the archivist.</p>
                    <ArrowRight className="w-4 h-4 text-[#960000] mt-4 opacity-0 group-hover:opacity-100 transition-opacity -ml-2 group-hover:ml-0" />
                  </CardContent>
                </Card>
              </button>
            </div>

            <Card className="border-none shadow-md overflow-hidden bg-gradient-to-r from-[#960000] to-[#7a0000] text-white">
              <CardContent className="p-8 md:p-10 relative">
                <div className="absolute top-0 right-0 w-64 h-64 -mr-20 -mt-20 rounded-full bg-white/10 blur-3xl pointer-events-none" />
                <div className="relative z-10 max-w-lg">
                  <h2 className="text-2xl font-bold mb-3">Begin Your Research</h2>
                  <p className="text-white/80 text-sm leading-relaxed mb-6">
                    Ready to dive into the Holy Cross of Davao College archives? Start browsing thousands of historical materials curated by our expert archivists.
                  </p>
                  <Link href="/collections">
                    <button className="bg-white text-[#960000] font-bold py-3 px-6 rounded-xl hover:bg-red-50 transition-colors shadow-lg active:scale-95">
                      Browse the Collection
                    </button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar: Announcements & Recent */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="shadow-sm border-border/50 bg-white">
              <div className="p-4 border-b border-border/50 bg-muted/20">
                <h2 className="text-sm font-bold flex items-center gap-2 text-[#0a1628] uppercase tracking-wider">
                  <Megaphone className="w-4 h-4 text-[#960000]" /> Notice Board
                </h2>
              </div>
              <div className="p-0 max-h-[400px] overflow-y-auto custom-scroll">
                {activeAnnouncements.length > 0 ? (
                  <div className="divide-y divide-border/50">
                    {activeAnnouncements.map((ann: any) => (
                      <div key={ann.id} className="p-5 hover:bg-muted/30 transition-colors group">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-bold text-sm text-[#0a1628] group-hover:text-[#960000] transition-colors">{ann.title}</h3>
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

            <Card className="shadow-sm border-border/50 bg-white">
              <div className="p-4 border-b border-border/50 bg-muted/20">
                <h2 className="text-sm font-bold flex items-center gap-2 text-[#0a1628] uppercase tracking-wider">
                  <BookOpen className="w-4 h-4 text-emerald-600" /> Accessible to You
                </h2>
              </div>
              <div className="p-0">
                {isMaterialsLoading ? (
                  <div className="divide-y divide-border/50">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="p-4">
                        <div className="h-4 w-2/3 bg-muted/40 rounded animate-pulse" />
                        <div className="h-3 w-1/3 bg-muted/30 rounded mt-2 animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : (materialsData?.materials?.length ?? 0) > 0 ? (
                  <div className="divide-y divide-border/50">
                    {materialsData?.materials?.slice(0, 4).map((mat: any) => (
                      <Link key={mat.id} href={`/materials/${mat.id}`}>
                        <div className="p-4 hover:bg-muted/30 transition-colors group cursor-pointer flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-sm text-[#0a1628] group-hover:text-[#960000] transition-colors line-clamp-1">{mat.title}</h3>
                            <p className="text-xs text-muted-foreground mt-1">{mat.categoryName || 'General Collection'}</p>
                          </div>
                          <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-50 group-hover:opacity-100 group-hover:text-[#960000]" />
                        </div>
                      </Link>
                    ))}
                    <Link href="/collections?access=public">
                      <div className="p-3 text-center text-xs font-semibold text-[#4169E1] hover:bg-muted/30 transition-colors cursor-pointer bg-muted/10">
                        View all public resources →
                      </div>
                    </Link>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <Star className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
                    <p className="text-xs text-muted-foreground">Your reading history will appear here once you start exploring materials.</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {isRequestsLoading ? (
               [...Array(4)].map((_, i) => (
                <div key={i} className="h-56 bg-white border border-border/50 rounded-2xl animate-pulse" />
              ))
            ) : (allRequests.length ?? 0) > 0 ? (
              allRequests.map((req: any) => {
                const tone = getStatusTone(req.status);
                const material = req.materialId ? getMaterialById(req.materialId) : undefined;
                const coverUrl = material?.thumbnailUrl || material?.pageImages?.[0] || req.materialCover;
                const requestTitle = req.materialTitle && req.materialTitle !== "Unknown Material" ? req.materialTitle : undefined;
                const displayTitle = material?.title || requestTitle || "Untitled Material";
                const StatusIcon = req.status === "approved" ? CheckCircle2 : req.status === "rejected" ? XCircle : Clock;
                return (
                  <Link key={req.id} href={req.materialId ? `/materials/${req.materialId}` : "/collections"}> 
                    <Card className="h-full border-border/60 shadow-sm hover:shadow-lg transition-all hover:border-[#960000]/30 hover:-translate-y-1 bg-white cursor-pointer group overflow-hidden">
                      <CardContent className="p-0">
                        <div className="flex flex-col md:flex-row">
                          <div className="flex-1 p-6">
                            <div className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${tone.chip} ${tone.text}`}>
                              <StatusIcon className="w-3 h-3" /> {req.status}
                            </div>
                            <h3 className="mt-3 font-bold text-lg text-[#0a1628] group-hover:text-[#960000] transition-colors line-clamp-2">
                              {displayTitle}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              Requested {format(new Date(req.createdAt), "MMM d, yyyy")}
                            </p>

                            <div className="mt-5">
                              <div className="grid grid-cols-3 items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                <div className="flex flex-col items-center gap-2">
                                  <span className={req.status !== "rejected" ? "text-[#0a1628]" : ""}>Borrow</span>
                                  <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center ${req.status !== "rejected" ? "border-emerald-500 text-emerald-500" : "border-muted text-muted-foreground"}`}>
                                    <CheckCircle2 className="w-4 h-4" />
                                  </div>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                  <span className={req.status !== "rejected" ? "text-[#0a1628]" : ""}>Request</span>
                                  <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center ${req.status !== "rejected" ? "border-emerald-500 text-emerald-500" : "border-muted text-muted-foreground"}`}>
                                    <CheckCircle2 className="w-4 h-4" />
                                  </div>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                  <span className={req.status === "approved" ? "text-emerald-600" : req.status === "rejected" ? "text-red-600" : "text-amber-600"}>
                                    {req.status === "pending" ? "Pending" : req.status}
                                  </span>
                                  <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center ${req.status === "approved" ? "border-emerald-500 text-emerald-500" : req.status === "rejected" ? "border-red-500 text-red-500" : "border-amber-500 text-amber-500"}`}>
                                    {req.status === "approved" ? <CheckCircle2 className="w-4 h-4" /> : req.status === "rejected" ? <XCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                  </div>
                                </div>
                              </div>
                              <div className="mt-3 grid grid-cols-3 items-center gap-2">
                                <div className="h-1 rounded-full bg-emerald-500" />
                                <div className={`h-1 rounded-full ${req.status === "pending" ? "bg-amber-400" : req.status === "approved" ? "bg-emerald-500" : "bg-red-500"}`} />
                                <div className={`h-1 rounded-full ${req.status === "approved" ? "bg-emerald-500" : req.status === "rejected" ? "bg-red-500" : "bg-muted"}`} />
                              </div>
                            </div>
                          </div>

                          <div className="md:w-48 w-full bg-muted/20 border-l border-border/60 flex items-center justify-center p-4">
                            <div className="w-full h-48 md:h-40 rounded-xl overflow-hidden bg-white border border-border/60">
                              {coverUrl ? (
                                <img src={coverUrl} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <FileText className="w-8 h-8 text-muted-foreground/40" />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })
            ) : (
              <div className="col-span-full py-24 text-center bg-white rounded-3xl border border-dashed border-border/80">
                <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-10 h-10 text-muted-foreground/30" />
                </div>
                <h3 className="text-xl font-bold text-[#0a1628] mb-2">No access requests yet</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mb-8 text-sm">
                  Start a request from any restricted material and track its status here.
                </p>
                <Link href="/collections">
                  <button className="bg-[#0a1628] text-white font-bold py-3 px-8 rounded-xl hover:bg-[#1a1a1a] transition-all">
                    Find Materials to Request
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
