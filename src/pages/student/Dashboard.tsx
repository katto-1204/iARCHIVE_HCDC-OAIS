import { Link } from "wouter";
import { AdminLayout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui-components";
import { 
  BookOpen, Search, Shield, Megaphone, ArrowRight, Clock, Star, 
  ArrowUpRight, FileText, CheckCircle2, XCircle, Heart, MessageCircle, 
  Send, Sparkles, LayoutGrid, Library, Layers, GraduationCap, History
} from "lucide-react";
import { 
  useGetAnnouncements, useGetMaterials, useGetAccessRequests, useGetMe,
  useLikeAnnouncement, useCommentAnnouncement
} from "@workspace/api-client-react";
import { format } from "date-fns";
import * as React from "react";
import { getMaterialById } from "@/data/storage";
import { cn } from "@/lib/utils";

export default function StudentDashboard() {
  const { data: user } = useGetMe();
  const { data: announcements } = useGetAnnouncements();
  const activeAnnouncements = (announcements ?? []).filter((a: any) => a.isActive);
  const { data: materialsData, isLoading: isMaterialsLoading } = useGetMaterials({ access: "public", limit: 6 });
  const { data: approvedRequests } = useGetAccessRequests({ status: "approved" });
  
  const { mutate: likeAnnouncement } = useLikeAnnouncement();
  const { mutate: commentAnnouncement } = useCommentAnnouncement();
  
  const [commentingId, setCommentingId] = React.useState<string | null>(null);
  const [commentText, setCommentText] = React.useState("");

  const handleLike = (id: string) => {
    likeAnnouncement(id);
  };

  const handleComment = (id: string) => {
    if (!commentText.trim()) return;
    commentAnnouncement({ id, data: { content: commentText } });
    setCommentText("");
    setCommentingId(null);
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
                    <div key={ann.id} className="p-8 hover:bg-muted/5 transition-colors">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                          <h3 className="text-lg font-black text-[#0a1628] leading-tight mb-2">{ann.title}</h3>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                             <Clock className="w-3 h-3" /> {format(new Date(ann.createdAt), "MMMM d, yyyy")}
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground leading-relaxed mb-6 whitespace-pre-line">{ann.content}</p>
                      
                      {/* Social Actions */}
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => handleLike(ann.id)}
                            className={cn(
                              "flex items-center gap-2 text-xs font-black transition-all px-4 py-2 rounded-full",
                              hasLiked 
                                ? "bg-red-50 text-red-600 shadow-sm" 
                                : "text-muted-foreground hover:bg-muted/50"
                            )}
                          >
                            <Heart className={cn("w-4 h-4", hasLiked && "fill-current")} />
                            {ann.likes?.length || 0}
                          </button>
                          
                          <button 
                            onClick={() => setCommentingId(commentingId === ann.id ? null : ann.id)}
                            className={cn(
                              "flex items-center gap-2 text-xs font-black transition-all px-4 py-2 rounded-full",
                              commentingId === ann.id 
                                ? "bg-blue-50 text-blue-600 shadow-sm" 
                                : "text-muted-foreground hover:bg-muted/50"
                            )}
                          >
                            <MessageCircle className="w-4 h-4" />
                            {ann.comments?.length || 0}
                          </button>
                        </div>

                        {/* Comments Display */}
                        {ann.comments?.length > 0 && (
                          <div className="space-y-3 pt-4 border-t border-border/30">
                            {ann.comments.slice(-2).map((c: any) => (
                              <div key={c.id} className="bg-muted/30 p-4 rounded-2xl">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[10px] font-black text-[#0a1628] uppercase">{c.userName}</span>
                                  <span className="text-[9px] text-muted-foreground/60">{format(new Date(c.createdAt), "MMM d")}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">{c.content}</p>
                              </div>
                            ))}
                            {ann.comments.length > 2 && (
                              <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest pl-2">View {ann.comments.length - 2} more comments</button>
                            )}
                          </div>
                        )}

                        {/* Comment Input */}
                        {commentingId === ann.id && (
                          <div className="flex gap-2 animate-in slide-in-from-top-2 duration-300">
                            <input 
                              type="text" 
                              placeholder="Write a comment..." 
                              className="flex-1 bg-muted/50 border border-border/50 rounded-xl px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleComment(ann.id)}
                            />
                            <button 
                              onClick={() => handleComment(ann.id)}
                              className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          </div>
                        )}
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
    </AdminLayout>
  );
}
