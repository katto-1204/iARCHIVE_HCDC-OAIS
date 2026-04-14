import { Link } from "wouter";
import { AdminLayout } from "@/components/layout";
import { Card, CardContent, Button, Input } from "@/components/ui-components";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Search, Shield, Megaphone, ArrowRight, Clock, Star, ArrowUpRight, FileText, CheckCircle2, XCircle, User, Mail, School, Info, Calendar, ShieldCheck, Save, X } from "lucide-react";
import { useGetAnnouncements, useGetMaterials, useGetAccessRequests, useGetMe, useUpdateMe } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import * as React from "react";
import { getMaterialById } from "@/data/storage";

export default function StudentDashboard() {
  const [tab, setTab] = React.useState<"overview" | "accessed" | "profile">("overview");
  const { data: user } = useGetMe();
  const { data: announcements } = useGetAnnouncements();
  const activeAnnouncements = (announcements ?? []).filter((a: any) => a.isActive);
  const { data: materialsData } = useGetMaterials({ access: "public", limit: 5 });
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

  const { mutate: updateMe, isPending: isUpdating } = useUpdateMe();
  const { toast } = useToast();
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [editForm, setEditForm] = React.useState({ name: "", institution: "", purpose: "" });

  React.useEffect(() => {
    if (user) {
      setEditForm({
        name: user.name || "",
        institution: user.institution || "",
        purpose: user.purpose || ""
      });
    }
  }, [user]);

  const handleUpdateProfile = () => {
    updateMe(editForm, {
      onSuccess: () => {
        toast({ title: "Profile Updated", description: "Your profile information has been successfully updated." });
        setIsEditModalOpen(false);
      },
      onError: () => {
        toast({ title: "Update Failed", description: "Could not update your profile. Please try again.", variant: "destructive" });
      }
    });
  };

  const statusOrder = ["borrow", "request", "decision"] as const;

  const getStatusTone = (status: string) => {
    if (status === "approved") return { bg: "bg-emerald-500", text: "text-emerald-700", chip: "bg-emerald-50 border-emerald-200" };
    if (status === "rejected") return { bg: "bg-red-500", text: "text-red-700", chip: "bg-red-50 border-red-200" };
    return { bg: "bg-amber-500", text: "text-amber-700", chip: "bg-amber-50 border-amber-200" };
  };

  return (
    <>
      <AdminLayout>
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between border-b border-border/50 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#960000]/10 text-[#960000] border border-[#960000]/20 rounded-full px-3 py-1 text-xs font-bold mb-3 uppercase tracking-widest">
              <BookOpen className="w-4 h-4" /> User Portal
            </div>
            <h1 className="text-4xl font-display font-bold text-[#0a1628]">Research Dashboard</h1>
            <p className="text-muted-foreground mt-2">Manage your archival research and access approved restricted materials.</p>
          </div>
          <div className="flex gap-2 bg-muted/50 p-1.5 rounded-2xl border border-border/50 overflow-x-auto no-scrollbar max-w-full">
            <button 
              onClick={() => setTab("overview")}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${tab === "overview" ? "bg-[#960000] text-white shadow-lg shadow-[#960000]/20" : "text-muted-foreground hover:text-foreground hover:bg-white"}`}
            >
              Overview
            </button>
            <button 
              onClick={() => setTab("accessed")}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${tab === "accessed" ? "bg-[#960000] text-white shadow-lg shadow-[#960000]/20" : "text-muted-foreground hover:text-foreground hover:bg-white"}`}
            >
              Accessed Materials
              {approvedRequests?.total ? (approvedRequests.total > 0 && <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${tab === "accessed" ? "bg-white text-[#960000]" : "bg-[#960000] text-white"}`}>{approvedRequests?.total}</span>) : null}
            </button>
            <button 
              onClick={() => setTab("profile")}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${tab === "profile" ? "bg-[#960000] text-white shadow-lg shadow-[#960000]/20" : "text-muted-foreground hover:text-foreground hover:bg-white"}`}
            >
              My Profile
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
                  {(materialsData?.materials?.length ?? 0) > 0 ? (
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
        ) : tab === "accessed" ? (
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
                  const displayTitle = material?.title || req.materialTitle || "Untitled Material";
                  const StatusIcon = req.status === "approved" ? CheckCircle2 : req.status === "rejected" ? XCircle : Clock;
                  return (
                    <Link key={req.id} href={req.materialId ? `/materials/${req.materialId}` : "/collections"}> 
                      <Card className="h-full border-border/60 shadow-sm hover:shadow-lg transition-all hover:border-[#960000]/30 hover:-translate-y-1 bg-white cursor-pointer group overflow-hidden">
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex-1">
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
                                    <span className={req.status !== "rejected" ? "text-[#0a1628]" : ""}>Request</span>
                                    <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center ${req.status !== "rejected" ? "border-emerald-500 text-emerald-500" : "border-muted text-muted-foreground"}`}>
                                      <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-center gap-2">
                                    <span className={req.status === "approved" ? "text-emerald-600" : req.status === "rejected" ? "text-red-600" : "text-amber-600"}>
                                      Review
                                    </span>
                                    <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center ${req.status === "approved" ? "border-emerald-500 text-emerald-500" : req.status === "rejected" ? "border-red-500 text-red-500" : "border-amber-500 text-amber-500"}`}>
                                      {req.status === "approved" ? <CheckCircle2 className="w-4 h-4" /> : req.status === "rejected" ? <XCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-center gap-2">
                                    <span className={req.status === "approved" ? "text-emerald-600" : "text-muted-foreground"}>Access</span>
                                    <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center ${req.status === "approved" ? "border-emerald-500 text-emerald-500" : "border-muted text-muted-foreground"}`}>
                                      {req.status === "approved" ? <CheckCircle2 className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                                    </div>
                                  </div>
                                </div>
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
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
            <Card className="border-none shadow-2xl overflow-hidden rounded-3xl bg-white">
              <div className="h-32 bg-gradient-to-r from-[#960000] to-[#7a0000] relative">
                <div className="absolute -bottom-12 left-8 p-1 bg-white rounded-full shadow-lg">
                  <div className="w-24 h-24 rounded-full bg-[#960000]/10 flex items-center justify-center text-[#960000] font-black text-3xl border-4 border-white">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                </div>
              </div>
              <CardContent className="pt-16 pb-10 px-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b pb-8">
                  <div>
                    <h2 className="text-3xl font-display font-black text-[#0a1628]">{user?.name}</h2>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#960000]/10 text-[#960000] text-[10px] font-black uppercase tracking-widest border border-[#960000]/20">
                        <Shield className="w-3 h-3" /> {user?.role === 'student' ? (user?.userCategory || 'USER') : user?.role}
                      </span>
                      <span className="text-muted-foreground text-xs flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5" /> Member Since {user?.createdAt ? format(new Date(user.createdAt), 'MMMM yyyy') : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <Button variant="outline" className="rounded-xl font-bold border-border/50" onClick={() => setIsEditModalOpen(true)}>Edit Profile</Button>
                    <Button className="bg-[#0a1628] text-white rounded-xl font-bold px-6" onClick={() => toast({ title: "Coming Soon", description: "Account settings are currently under maintenance." })}>Account Settings</Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Contact Information</h3>
                      <div className="space-y-4">
                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-muted/30 border border-border/20 group hover:border-[#960000]/30 transition-colors">
                          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#960000] shadow-sm shrink-0">
                            <Mail className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">Primary Email</p>
                            <p className="text-sm font-bold text-[#0a1628]">{user?.email}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-muted/30 border border-border/20 group hover:border-[#960000]/30 transition-colors">
                          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                            <School className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">Institution / Affiliation</p>
                            <p className="text-sm font-bold text-[#0a1628]">{user?.institution || "Not Specified"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Research Profile</h3>
                      <div className="p-6 rounded-2xl bg-muted/30 border border-border/20 relative group hover:border-[#960000]/30 transition-colors min-h-[160px]">
                        <div className="absolute top-4 right-4 text-muted-foreground/20">
                          <Info className="w-10 h-10" />
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60 mb-3">Primary Research Purpose</p>
                        <p className="text-sm text-[#0a1628] font-semibold leading-relaxed italic">
                          "{user?.purpose || "No research purpose has been specified for this account. You can update this in your profile settings."}"
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-12 p-6 rounded-2xl bg-[#0a1628]/5 border border-[#0a1628]/10 flex flex-col md:flex-row items-center gap-6">
                  <div className="w-12 h-12 rounded-xl bg-[#0a1628] flex items-center justify-center text-white shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h4 className="font-bold text-[#0a1628]">Verified Research Account</h4>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">Your credentials have been verified by the HCDC Archival Administration team.</p>
                  </div>
                  <Button variant="ghost" className="text-[10px] font-bold uppercase tracking-widest text-[#960000] hover:bg-[#960000]/10">Privacy Charter</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </AdminLayout>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-[#960000] p-6 text-white">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <User className="w-5 h-5" /> Edit Profile
            </DialogTitle>
            <p className="text-white/70 text-xs mt-1">Update your personal information and research details.</p>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</label>
              <Input 
                value={editForm.name} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Your full name"
                className="rounded-xl border-border/50 focus:ring-[#960000]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Institution / Affiliation</label>
              <Input 
                value={editForm.institution} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm(prev => ({ ...prev, institution: e.target.value }))}
                placeholder="School, Company, or Organization"
                className="rounded-xl border-border/50 focus:ring-[#960000]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Research Purpose</label>
              <Textarea 
                value={editForm.purpose} 
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditForm(prev => ({ ...prev, purpose: e.target.value }))}
                placeholder="Why are you accessing the archives? (e.g. Thesis, Personal Interest)"
                className="rounded-xl border-border/50 focus:ring-[#960000] min-h-[100px] resize-none"
              />
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1 rounded-xl h-11 font-bold" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button className="flex-1 rounded-xl h-11 font-bold bg-[#960000] text-white" onClick={handleUpdateProfile} disabled={isUpdating}>
                {isUpdating ? "Updating..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
