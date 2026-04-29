import { Link } from "wouter";
import { AdminLayout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui-components";
import { 
  BookOpen, Search, Shield, Megaphone, ArrowRight, Clock, Star, 
  ArrowUpRight, FileText, CheckCircle2, XCircle, Heart, MessageCircle, 
  Send, Sparkles, LayoutGrid, Library, Layers, GraduationCap, History,
  X, User
} from "lucide-react";
import { 
  useGetAnnouncements, useGetMaterials, useGetAccessRequests, useGetMe,
  useLikeAnnouncement, useCommentAnnouncement
} from "@workspace/api-client-react";
import { format } from "date-fns";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function StudentDashboard() {
  const { data: user } = useGetMe();
  const { data: announcements } = useGetAnnouncements();
  const activeAnnouncements = (announcements ?? []).filter((a: any) => a.isActive);
  const { data: materialsData, isLoading: isMaterialsLoading } = useGetMaterials({ access: "public", limit: 6 });
  const { data: approvedRequests } = useGetAccessRequests({ status: "approved" });
  
  const { mutate: likeAnnouncement, isPending: isLiking } = useLikeAnnouncement();
  const { mutate: commentAnnouncement, isPending: isCommenting } = useCommentAnnouncement();
  
  const [selectedAnnouncement, setSelectedAnnouncement] = React.useState<any>(null);
  const [commentText, setCommentText] = React.useState("");

  const handleLike = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (isLiking) return;
    likeAnnouncement(id);
  };

  const handleComment = (id: string) => {
    if (!commentText.trim() || isCommenting) return;
    commentAnnouncement({ id, data: { content: commentText } });
    setCommentText("");
  };

  return (
    <AdminLayout>
      {/* ─── Hero Header Section ─── */}
      <div className="relative mb-10 p-10 rounded-[3rem] overflow-hidden bg-[#0a1628] text-white shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[#960000]/40 via-transparent to-black/60 pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 -mr-20 -mt-20 bg-[#960000]/10 blur-[100px] rounded-full" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 text-[10px] font-black mb-6 uppercase tracking-[0.3em]">
              <Sparkles className="w-3.5 h-3.5 text-red-500" /> Executive Portal
            </div>
            <h1 className="text-5xl font-black mb-4 tracking-tight leading-none">
              Welcome back, <span className="text-red-500">{user?.name.split(' ')[0]}</span>
            </h1>
            <p className="text-white/60 text-lg font-medium leading-relaxed">
              Your gateway to Holy Cross of Davao College's digital memory. Manage your research, 
              access restricted assets, and stay informed on institutional updates.
            </p>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 text-center min-w-[120px]">
              <div className="text-3xl font-black text-red-500 mb-1">{approvedRequests?.total || 0}</div>
              <div className="text-[10px] font-black text-white/40 uppercase tracking-widest">Approved</div>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 text-center min-w-[120px]">
              <div className="text-3xl font-black text-white mb-1">{materialsData?.total || 0}</div>
              <div className="text-[10px] font-black text-white/40 uppercase tracking-widest">Public</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ─── Left Column: Core Tools ─── */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Link href="/student/accessed">
              <Card className="group h-full bg-white border border-border/50 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer overflow-hidden">
                <CardContent className="p-8 flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-[#960000]/5 flex items-center justify-center text-[#960000] group-hover:scale-110 group-hover:bg-[#960000] group-hover:text-white transition-all duration-500 shadow-sm">
                    <Library className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-[#0a1628] mb-1">Accessed Library</h3>
                    <p className="text-sm text-muted-foreground font-medium">View your approved restricted materials.</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/collections">
              <Card className="group h-full bg-white border border-border/50 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer overflow-hidden">
                <CardContent className="p-8 flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-[#0a1628]/5 flex items-center justify-center text-[#0a1628] group-hover:scale-110 group-hover:bg-[#0a1628] group-hover:text-white transition-all duration-500 shadow-sm">
                    <Search className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-[#0a1628] mb-1">Advanced Search</h3>
                    <p className="text-sm text-muted-foreground font-medium">Find specific records across sub-fonds.</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Recently Added Section */}
          <div>
            <div className="flex items-center justify-between mb-6 px-4">
              <h2 className="text-2xl font-black text-[#0a1628] flex items-center gap-3 tracking-tight">
                <Layers className="w-6 h-6 text-red-500" /> Recently Published
              </h2>
              <Link href="/collections" className="text-xs font-black text-[#960000] hover:underline uppercase tracking-widest">
                Explore All →
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {isMaterialsLoading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="h-40 bg-white border border-border/50 rounded-3xl animate-pulse" />
                ))
              ) : materialsData?.materials?.slice(0, 4).map((mat: any) => (
                <Link key={mat.id} href={`/materials/${mat.id}`}>
                  <div className="group bg-white p-6 rounded-[2rem] border border-border/50 shadow-sm hover:shadow-xl transition-all duration-500 flex items-center gap-6 cursor-pointer hover:border-[#960000]/20">
                    <div className="w-20 h-24 rounded-xl bg-muted/20 flex-shrink-0 overflow-hidden border border-border/50">
                      {mat.thumbnailUrl || mat.pageImages?.[0] ? (
                        <img src={mat.thumbnailUrl || mat.pageImages?.[0]} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileText className="w-8 h-8 text-muted-foreground/20" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="text-[10px] font-black text-[#960000] uppercase tracking-widest mb-1">{mat.categoryName || 'Archives'}</div>
                      <h3 className="font-bold text-[#0a1628] line-clamp-2 leading-tight group-hover:text-[#960000] transition-colors">{mat.title}</h3>
                      <div className="mt-3 flex items-center gap-3 text-muted-foreground text-[10px] font-medium">
                        <span className="flex items-center gap-1"><History className="w-3 h-3" /> {format(new Date(mat.createdAt), "MMM d")}</span>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                        <span className="flex items-center gap-1 uppercase tracking-tighter"><Shield className="w-3 h-3" /> {mat.accessTier}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Right Column: Announcements & Engagement ─── */}
        <div className="lg:col-span-4 space-y-8">
          <Card className="border border-border/50 rounded-[2.5rem] shadow-sm bg-white overflow-hidden">
            <div className="p-6 border-b border-border/50 bg-[#0a1628] text-white">
              <h2 className="text-sm font-black flex items-center gap-2 uppercase tracking-[0.2em]">
                <Megaphone className="w-4 h-4 text-red-500" /> Notice Board
              </h2>
            </div>
            
            <div className="divide-y divide-border/50 max-h-[700px] overflow-y-auto custom-scrollbar">
              {activeAnnouncements.length > 0 ? (
                activeAnnouncements.map((ann: any) => {
                  const hasLiked = ann.likes?.includes(user?.userId);
                  return (
                    <div 
                      key={ann.id} 
                      className="p-8 hover:bg-muted/5 transition-colors cursor-pointer group"
                      onClick={() => setSelectedAnnouncement(ann)}
                    >
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                          <h3 className="text-lg font-black text-[#0a1628] leading-tight mb-2 group-hover:text-[#960000] transition-colors">{ann.title}</h3>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                             <Clock className="w-3 h-3" /> {format(new Date(ann.createdAt), "MMMM d, yyyy")}
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground leading-relaxed mb-6 line-clamp-3">{ann.content}</p>
                      
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "flex items-center gap-1.5 text-[10px] font-black px-3 py-1 rounded-full",
                          hasLiked ? "bg-red-50 text-red-600" : "bg-muted text-muted-foreground"
                        )}>
                          <Heart className={cn("w-3 h-3", hasLiked && "fill-current")} />
                          {ann.likes?.length || 0}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-black bg-muted text-muted-foreground px-3 py-1 rounded-full">
                          <MessageCircle className="w-3 h-3" />
                          {ann.comments?.length || 0}
                        </div>
                        <span className="ml-auto text-[9px] font-black text-[#960000] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Read More →</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Megaphone className="w-8 h-8 text-muted-foreground/20" />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">No recent updates.</p>
                </div>
              )}
            </div>
          </Card>
          
          {/* Quick Help Card */}
          <Card className="border-none bg-gradient-to-br from-[#960000] to-[#5a0000] p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 -mr-10 -mt-10 bg-white/10 rounded-full blur-2xl" />
            <h3 className="text-xl font-black mb-2 flex items-center gap-2">
              <GraduationCap className="w-6 h-6" /> Need Help?
            </h3>
            <p className="text-white/70 text-xs font-medium leading-relaxed mb-6">
              Our archivists are here to assist with your research. Submit feedback or contact the library office.
            </p>
            <Link href="/feedback">
              <button className="w-full bg-white text-[#960000] font-black py-3 rounded-xl hover:bg-white/90 transition-all text-xs uppercase tracking-[0.2em]">
                Contact Archival Team
              </button>
            </Link>
          </Card>
        </div>
      </div>

      {/* ─── Announcement Detail Modal ─── */}
      <Dialog open={!!selectedAnnouncement} onOpenChange={(open) => !open && setSelectedAnnouncement(null)}>
        <DialogContent className="max-w-2xl bg-white rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl">
          <DialogTitle className="sr-only">Announcement Details</DialogTitle>
          {selectedAnnouncement && (
            <div className="flex flex-col h-[80vh] max-h-[800px]">
              <div className="p-10 bg-[#0a1628] text-white relative">
                <div className="absolute top-8 right-8 cursor-pointer hover:rotate-90 transition-transform" onClick={() => setSelectedAnnouncement(null)}>
                   <X className="w-6 h-6 text-white/40 hover:text-white" />
                </div>
                <div className="inline-flex items-center gap-2 bg-red-600 rounded-full px-3 py-1 text-[9px] font-black mb-4 uppercase tracking-[0.2em]">
                  <Megaphone className="w-3 h-3" /> Official Update
                </div>
                <DialogHeader>
                  <DialogTitle className="text-3xl font-black text-white leading-tight pr-10">
                    {selectedAnnouncement.title}
                  </DialogTitle>
                </DialogHeader>
                <div className="flex items-center gap-3 mt-6 text-white/40 text-[10px] font-black uppercase tracking-widest">
                  <Clock className="w-3.5 h-3.5" /> {format(new Date(selectedAnnouncement.createdAt), "MMMM d, yyyy")}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                <div className="text-muted-foreground leading-relaxed text-lg font-medium whitespace-pre-line border-l-4 border-[#960000]/20 pl-8">
                  {selectedAnnouncement.content}
                </div>

                {/* Engagement Actions */}
                <div className="flex items-center gap-6 pt-6 border-t border-border/30">
                  <button 
                    onClick={(e) => handleLike(e, selectedAnnouncement.id)}
                    disabled={isLiking}
                    className={cn(
                      "flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-sm transition-all active:scale-95",
                      selectedAnnouncement.likes?.includes(user?.userId)
                        ? "bg-red-50 text-red-600 shadow-sm"
                        : "bg-muted text-muted-foreground hover:bg-muted/80",
                      isLiking && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <Heart className={cn("w-5 h-5", (selectedAnnouncement.likes?.includes(user?.userId) || isLiking) && "fill-current", isLiking && "animate-pulse")} />
                    {isLiking ? "Liking..." : `${selectedAnnouncement.likes?.length || 0} Likes`}
                  </button>
                  <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-muted text-muted-foreground font-black text-sm">
                    <MessageCircle className="w-5 h-5" />
                    {selectedAnnouncement.comments?.length || 0} Comments
                  </div>
                </div>

                {/* Comments List */}
                <div className="space-y-6">
                  <h4 className="text-xs font-black text-[#0a1628] uppercase tracking-[0.3em] flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-red-500" /> Discussion
                  </h4>
                  
                  <div className="space-y-4">
                    {selectedAnnouncement.comments?.length > 0 ? (
                      selectedAnnouncement.comments.map((c: any) => (
                        <div key={c.id} className="bg-muted/30 p-6 rounded-[2rem] border border-border/20 flex gap-4">
                           <div className="w-10 h-10 rounded-full bg-white border border-border/50 flex items-center justify-center shrink-0">
                             <User className="w-5 h-5 text-muted-foreground" />
                           </div>
                           <div className="flex-1">
                             <div className="flex items-center justify-between mb-2">
                               <span className="text-xs font-black text-[#0a1628] uppercase">{c.userName}</span>
                               <span className="text-[10px] text-muted-foreground font-medium">{format(new Date(c.createdAt), "MMM d, h:mm a")}</span>
                             </div>
                             <p className="text-sm text-muted-foreground leading-relaxed">{c.content}</p>
                           </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 bg-muted/20 rounded-[2rem] border border-dashed border-border/50">
                        <MessageCircle className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">No comments yet. Be the first!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Comment Input Sticky Footer */}
              <div className="p-8 bg-white border-t border-border/30">
                <div className="flex gap-3">
                  <input 
                    type="text" 
                    placeholder={isCommenting ? "Posting comment..." : "Write a public comment..."}
                    className="flex-1 bg-muted/50 border border-border/50 rounded-2xl px-6 py-4 text-sm outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500/20 transition-all disabled:opacity-50"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !isCommenting && handleComment(selectedAnnouncement.id)}
                    disabled={isCommenting}
                  />
                  <button 
                    onClick={() => handleComment(selectedAnnouncement.id)}
                    disabled={isCommenting || !commentText.trim()}
                    className="bg-[#0a1628] text-white px-8 rounded-2xl flex items-center justify-center shadow-xl shadow-black/10 hover:bg-[#960000] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCommenting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

function MessageSquare({ className }: { className?: string }) {
  return <MessageCircle className={className} />;
}
