import * as React from "react";
import { format } from "date-fns";
import { AdminLayout } from "@/components/layout";
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from "@/components/ui-components";
import { 
  Plus, Megaphone, Trash2, X, Save, Eye, EyeOff, Loader2, Heart, 
  MessageCircle, BarChart3, Users, MessageSquare, Clock, User
} from "lucide-react";
import { 
  useGetAnnouncements, useCreateAnnouncement, useDeleteAnnouncement, useGetUsers 
} from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function AdminAnnouncements() {
  const { data: announcements, isLoading, refetch } = useGetAnnouncements();
  const { data: usersData } = useGetUsers();
  const { mutate: create, isPending: isCreating } = useCreateAnnouncement();
  const { mutate: remove, isPending: isDeleting } = useDeleteAnnouncement();
  const { toast } = useToast();

  const [isAdding, setIsAdding] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);

  // Engagement View State
  const [engagementDetail, setEngagementDetail] = React.useState<any>(null);
  
  // Deletion State
  const [deleteDialog, setDeleteDialog] = React.useState<{id: string, title: string} | null>(null);

  const usersMap = React.useMemo(() => {
    const map: Record<string, any> = {};
    (usersData?.users || []).forEach((u: any) => {
      map[u.id] = u;
    });
    return map;
  }, [usersData]);

  const handleCreate = () => {
    if (!title.trim() || !content.trim()) return;
    create(
      { data: { title: title.trim(), content: content.trim(), isActive } },
      {
        onSuccess: () => {
          toast({ title: "Announcement Posted", description: `"${title}" is now live.` });
          setTitle(""); setContent(""); setIsActive(true);
          setIsAdding(false);
          refetch();
        },
        onError: () => toast({ title: "Error", description: "Failed to post announcement.", variant: "destructive" })
      }
    );
  };

  const handleDelete = (id: string, announcementTitle: string) => {
    setDeleteDialog({ id, title: announcementTitle });
  };

  const confirmDelete = () => {
    if (deleteDialog) {
      remove(
        { id: deleteDialog.id },
        {
          onSuccess: () => {
            toast({ title: "Deleted", description: "Announcement removed." });
            setDeleteDialog(null);
            refetch();
          },
          onError: () => toast({ title: "Error", description: "Failed to delete.", variant: "destructive" })
        }
      );
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-6">
        <div>
           <div className="inline-flex items-center gap-2 bg-[#0a1628]/5 text-[#0a1628] border border-[#0a1628]/10 rounded-full px-4 py-1.5 text-[10px] font-black mb-4 uppercase tracking-[0.2em]">
            <Megaphone className="w-3.5 h-3.5" /> Communication Hub
          </div>
          <h1 className="text-4xl font-black text-[#0a1628] tracking-tight">Announcements</h1>
          <p className="text-muted-foreground mt-1 text-lg font-medium">Manage institutional bulletins and monitor student engagement.</p>
        </div>
        <Button onClick={() => setIsAdding(true)} className="bg-[#0a1628] hover:bg-[#960000] text-white font-black py-6 px-8 rounded-2xl shadow-xl shadow-black/10 transition-all gap-2 active:scale-95">
          <Plus className="w-5 h-5" /> Post Announcement
        </Button>
      </div>

      {isAdding && (
        <Card className="mb-10 border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="bg-[#0a1628] text-white p-8">
            <CardTitle className="text-xl font-black flex items-center gap-3">
              <Megaphone className="w-6 h-6 text-red-500" />
              New Institutional Update
            </CardTitle>
          </CardHeader>
          <CardContent className="p-10 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block">Bulletin Title</label>
                  <Input
                    placeholder="Enter a compelling title..."
                    className="h-14 rounded-2xl border-border/50 focus:ring-4 focus:ring-red-500/10 focus:border-red-500/20 text-lg font-bold"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-6 p-6 bg-muted/20 rounded-2xl border border-border/50">
                   <div className="flex-1">
                      <h4 className="text-sm font-black text-[#0a1628]">Publication Status</h4>
                      <p className="text-xs text-muted-foreground">Drafts won't be visible to students.</p>
                   </div>
                   <button
                      type="button"
                      onClick={() => setIsActive(!isActive)}
                      className={cn(
                        "w-16 h-8 rounded-full transition-all relative shadow-inner",
                        isActive ? 'bg-emerald-500' : 'bg-muted-foreground/30'
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all",
                        isActive ? 'left-9' : 'left-1'
                      )} />
                    </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block">Announcement Content</label>
                <textarea
                  className="w-full rounded-2xl border border-border/50 bg-muted/10 px-6 py-4 text-base focus:border-red-500/20 focus:ring-4 focus:ring-red-500/10 outline-none resize-none min-h-[180px] font-medium"
                  placeholder="What would you like to share with the HCDC community?"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex gap-4 pt-4">
              <Button 
                onClick={handleCreate} 
                disabled={!title.trim() || !content.trim() || isCreating} 
                className="bg-[#0a1628] hover:bg-[#960000] text-white font-black py-6 px-10 rounded-2xl shadow-lg gap-2"
              >
                {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Publish Announcement
              </Button>
              <Button variant="ghost" onClick={() => { setIsAdding(false); setTitle(""); setContent(""); }} disabled={isCreating} className="font-black text-muted-foreground py-6 px-8 rounded-2xl hover:bg-muted">
                Discard Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {isLoading ? (
          [...Array(6)].map((_, i) => <div key={i} className="h-64 bg-white rounded-[2.5rem] animate-pulse border border-border/50" />)
        ) : (announcements?.length ?? 0) === 0 ? (
          <div className="col-span-full py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-border/50">
            <Megaphone className="w-16 h-16 text-muted-foreground/20 mx-auto mb-6" />
            <h3 className="text-2xl font-black text-[#0a1628] mb-2">No active announcements</h3>
            <p className="text-muted-foreground font-medium mb-8">Your communication history is currently empty.</p>
            <Button onClick={() => setIsAdding(true)}>Create Bulletin</Button>
          </div>
        ) : (
          announcements?.map(ann => (
            <Card key={ann.id} className={cn(
              "group relative flex flex-col border border-border/50 shadow-sm hover:shadow-2xl hover:border-[#0a1628]/20 transition-all duration-500 rounded-[2.5rem] overflow-hidden bg-white",
              !ann.isActive && 'opacity-60 grayscale-[0.5]'
            )}>
              <CardContent className="p-8 flex flex-col h-full">
                <div className="flex items-center justify-between mb-6">
                  {ann.isActive ? (
                    <span className="inline-flex items-center gap-1.5 text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-widest">
                      <Eye className="w-3 h-3" /> Published
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[9px] font-black text-muted-foreground bg-muted border border-border/50 px-3 py-1 rounded-full uppercase tracking-widest">
                      <EyeOff className="w-3 h-3" /> Draft
                    </span>
                  )}
                  <button
                    className="p-2 rounded-xl text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-all opacity-0 group-hover:opacity-100"
                    onClick={() => handleDelete(ann.id, ann.title)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-xl font-black text-[#0a1628] mb-3 leading-tight group-hover:text-red-600 transition-colors">{ann.title}</h3>
                <p className="text-sm text-muted-foreground font-medium leading-relaxed mb-8 line-clamp-3">{ann.content}</p>
                
                <div className="mt-auto space-y-4">
                  {/* Engagement Quick Stats */}
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setEngagementDetail(ann)}
                      className="flex items-center gap-1.5 text-[10px] font-black text-[#0a1628] bg-[#0a1628]/5 hover:bg-[#0a1628]/10 transition-colors px-3 py-1.5 rounded-full uppercase tracking-widest"
                    >
                      <Heart className="w-3.5 h-3.5 text-red-500" /> {ann.likes?.length || 0}
                    </button>
                    <button 
                      onClick={() => setEngagementDetail(ann)}
                      className="flex items-center gap-1.5 text-[10px] font-black text-[#0a1628] bg-[#0a1628]/5 hover:bg-[#0a1628]/10 transition-colors px-3 py-1.5 rounded-full uppercase tracking-widest"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-blue-500" /> {ann.comments?.length || 0}
                    </button>
                    <button 
                      onClick={() => setEngagementDetail(ann)}
                      className="ml-auto p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground"
                    >
                       <BarChart3 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="pt-4 border-t border-border/30 flex items-center justify-between text-[10px] text-muted-foreground/60 font-black uppercase tracking-[0.1em]">
                    <div className="flex items-center gap-2">
                       <Clock className="w-3 h-3" /> {format(new Date(ann.createdAt), "MMM d, yyyy")}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* ─── Engagement Detailed View Modal ─── */}
      <Dialog open={!!engagementDetail} onOpenChange={(open) => !open && setEngagementDetail(null)}>
        <DialogContent className="max-w-3xl bg-white rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl">
          {engagementDetail && (
            <div className="flex flex-col h-[85vh] max-h-[850px]">
              <div className="p-10 bg-[#0a1628] text-white">
                <div className="flex items-center justify-between mb-4">
                   <div className="inline-flex items-center gap-2 bg-red-600 rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em]">
                    <BarChart3 className="w-4 h-4" /> Engagement Analytics
                  </div>
                  <button onClick={() => setEngagementDetail(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                     <X className="w-6 h-6" />
                  </button>
                </div>
                <DialogTitle className="text-3xl font-black leading-tight mb-2">
                  {engagementDetail.title}
                </DialogTitle>
                <p className="text-white/40 text-sm font-medium">Posted on {format(new Date(engagementDetail.createdAt), "MMMM d, yyyy at h:mm a")}</p>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-2 divide-x divide-border/50 h-full">
                  
                  {/* Likes Section */}
                  <div className="p-10 space-y-8">
                    <div className="flex items-center justify-between">
                       <h4 className="text-xs font-black text-[#0a1628] uppercase tracking-[0.3em] flex items-center gap-2">
                        <Heart className="w-4 h-4 text-red-500 fill-current" /> Likes ({engagementDetail.likes?.length || 0})
                      </h4>
                    </div>
                    
                    <div className="space-y-4">
                      {engagementDetail.likes?.length > 0 ? (
                        engagementDetail.likes.map((uid: string) => {
                          const user = usersMap[uid];
                          return (
                            <div key={uid} className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-border/30">
                               <div className="w-10 h-10 rounded-full bg-white border border-border/50 flex items-center justify-center text-[#0a1628]">
                                  <User className="w-5 h-5" />
                               </div>
                               <div>
                                  <div className="text-sm font-black text-[#0a1628]">{user?.name || "Unknown User"}</div>
                                  <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{user?.role || "Student"}</div>
                               </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="py-20 text-center">
                           <Heart className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                           <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">No reactions yet</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Comments Section */}
                  <div className="p-10 space-y-8 bg-muted/10">
                    <h4 className="text-xs font-black text-[#0a1628] uppercase tracking-[0.3em] flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-500" /> Comments ({engagementDetail.comments?.length || 0})
                    </h4>
                    
                    <div className="space-y-6">
                      {engagementDetail.comments?.length > 0 ? (
                        engagementDetail.comments.map((c: any) => (
                          <div key={c.id} className="relative pl-6 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-1 before:bg-blue-500/20 before:rounded-full">
                             <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-black text-[#0a1628] uppercase tracking-wider">{c.userName}</span>
                                <span className="text-[10px] text-muted-foreground font-medium">{format(new Date(c.createdAt), "MMM d, h:mm a")}</span>
                             </div>
                             <p className="text-sm text-muted-foreground leading-relaxed font-medium bg-white p-4 rounded-2xl border border-border/50 shadow-sm">{c.content}</p>
                          </div>
                        ))
                      ) : (
                        <div className="py-20 text-center">
                           <MessageCircle className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                           <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">No comments recorded</p>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteDialog} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the announcement "{deleteDialog?.title}"?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteDialog(null)} disabled={isDeleting}>Cancel</Button>
            <Button 
              className="bg-red-600 text-white hover:bg-red-700 gap-2" 
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
