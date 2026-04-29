import * as React from "react";
import { AdminLayout } from "@/components/layout";
import { 
  MessageSquare, CheckCircle, Clock, Trash2, Loader2, 
  Search, Filter, Mail, User, ShieldAlert, Sparkles, 
  Lightbulb, Bug, Heart, ArrowUpRight, Inbox, X
} from "lucide-react";
import { 
  useGetFeedbacks, 
  useMarkFeedbackRead, 
  useDeleteFeedback,
  useResolveFeedback 
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function AdminFeedback() {
  const { data: feedbacks, isLoading } = useGetFeedbacks();
  const { mutate: markRead } = useMarkFeedbackRead();
  const { mutate: resolveFeedback } = useResolveFeedback();
  const { mutate: deleteFeedback, isPending: isDeleting } = useDeleteFeedback();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = React.useState("");
  const [activeFilter, setActiveFilter] = React.useState<string | null>(null);
  const [selectedFeedback, setSelectedFeedback] = React.useState<any>(null);

  const handleMarkAsRead = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    markRead({ id }, {
       onSuccess: () => {
         toast({ title: "Updated", description: "Feedback marked as read." });
       }
    });
  };

  const handleResolve = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    resolveFeedback({ id }, {
      onSuccess: () => {
        toast({ title: "Resolved", description: "Feedback marked as resolved." });
        if (selectedFeedback?.id === id) setSelectedFeedback(null);
      }
    });
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this feedback?")) return;
    deleteFeedback({ id }, {
      onSuccess: () => {
        toast({ title: "Deleted", description: "Feedback has been removed." });
        if (selectedFeedback?.id === id) setSelectedFeedback(null);
      }
    });
  };

  const filteredFeedbacks = (feedbacks || []).filter((f: any) => {
    const matchesSearch = f.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.email || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!activeFilter) return matchesSearch;
    
    const type = (f.type || "").toLowerCase();
    if (activeFilter === "bug") return matchesSearch && (type === "bug" || type === "bug report");
    if (activeFilter === "suggestion") return matchesSearch && type === "suggestion";
    if (activeFilter === "compliment") return matchesSearch && type === "compliment";
    
    return matchesSearch;
  });

  const stats = {
    total: feedbacks?.length || 0,
    unread: feedbacks?.filter((f: any) => (f.read === false || f.status === 'unread') && f.status !== 'resolved').length || 0,
    bugs: feedbacks?.filter((f: any) => {
      const type = (f.type || "").toLowerCase();
      return type === 'bug' || type === 'bug report';
    }).length || 0,
    suggestions: feedbacks?.filter((f: any) => {
      const type = (f.type || "").toLowerCase();
      return type === 'suggestion';
    }).length || 0,
    compliments: feedbacks?.filter((f: any) => {
      const type = (f.type || "").toLowerCase();
      return type === 'compliment';
    }).length || 0,
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="relative mb-12 p-12 rounded-[3.5rem] overflow-hidden bg-[#0a1628] text-white shadow-2xl border border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-[#960000]/30 via-transparent to-black/60 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#4169E1]/10 blur-[120px] rounded-full -mr-32 -mt-32" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-full px-5 py-2 text-[10px] font-black mb-8 uppercase tracking-[0.4em]">
              <Inbox className="w-4 h-4 text-red-500" /> Intelligence Inbox
            </div>
            <h1 className="text-6xl font-black mb-6 tracking-tight leading-[1.1]">
              USER<span className="text-red-600">Feedbacks</span>
            </h1>
            <p className="text-white/50 text-xl font-medium leading-relaxed max-w-2xl">
              Analyzing community perspectives and system reports. 
              Your bridge to continuous archival modernization.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:w-96 shrink-0">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[2rem] p-6 text-center">
              <div className="text-4xl font-black text-red-500 mb-1">{stats.unread}</div>
              <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Unread Reports</div>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[2rem] p-6 text-center">
              <div className="text-4xl font-black text-white mb-1">{stats.total}</div>
              <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Total Captured</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-red-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Search feedback content or users..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-border/50 rounded-2xl py-3 pl-12 pr-4 text-sm outline-none focus:ring-4 focus:ring-red-500/5 focus:border-red-500/20 transition-all shadow-sm"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
          <button 
            onClick={() => setActiveFilter(null)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl border transition-all shadow-sm whitespace-nowrap",
              activeFilter === null ? "bg-[#0a1628] border-[#0a1628] text-white" : "bg-white border-border/50 text-[#0a1628]"
            )}
          >
            <Filter className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black uppercase tracking-widest">All Channels</span>
          </button>
          <button 
            onClick={() => setActiveFilter("bug")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl border transition-all shadow-sm whitespace-nowrap",
              activeFilter === "bug" ? "bg-red-600 border-red-600 text-white" : "bg-red-50 border-red-100 text-red-700"
            )}
          >
            <Bug className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Bug Reports ({stats.bugs})</span>
          </button>
          <button 
            onClick={() => setActiveFilter("suggestion")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl border transition-all shadow-sm whitespace-nowrap",
              activeFilter === "suggestion" ? "bg-blue-600 border-blue-600 text-white" : "bg-blue-50 border-blue-100 text-blue-700"
            )}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Suggestions ({stats.suggestions})</span>
          </button>
          <button 
            onClick={() => setActiveFilter("compliment")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl border transition-all shadow-sm whitespace-nowrap",
              activeFilter === "compliment" ? "bg-emerald-600 border-emerald-600 text-white" : "bg-emerald-50 border-emerald-100 text-emerald-700"
            )}
          >
            <Heart className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Compliments ({stats.compliments})</span>
          </button>
        </div>
      </div>

      {/* Feedback Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] border border-dashed border-border/60">
          <Loader2 className="w-12 h-12 animate-spin text-red-600 mb-4" />
          <p className="text-sm font-black text-[#0a1628] uppercase tracking-widest">Synchronizing Intelligence...</p>
        </div>
      ) : filteredFeedbacks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] border border-dashed border-border/60 text-center">
          <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mb-6">
            <Inbox className="w-10 h-10 text-muted-foreground/30" />
          </div>
          <h3 className="text-xl font-black text-[#0a1628] mb-2 tracking-tight">No Insights Found</h3>
          <p className="text-sm text-muted-foreground font-medium max-w-xs mx-auto">Your feedback repository is currently quiet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredFeedbacks.map((f: any) => {
            const isUnread = (f.read === false || f.status === 'unread') && f.status !== 'resolved';
            const isResolved = f.status === 'resolved';
            const type = (f.type || 'suggestion').toLowerCase();
            
            const typeConfigs: Record<string, any> = {
              bug: { icon: Bug, color: "text-red-600", bg: "bg-red-50", border: "border-red-100", label: "Bug Report" },
              'bug report': { icon: Bug, color: "text-red-600", bg: "bg-red-50", border: "border-red-100", label: "Bug Report" },
              compliment: { icon: Heart, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", label: "Compliment" },
              suggestion: { icon: Lightbulb, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100", label: "Suggestion" }
            };
            
            const typeConfig = typeConfigs[type] || { icon: MessageSquare, color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-100", label: f.type };

            return (
              <div 
                key={f.id} 
                onClick={() => setSelectedFeedback(f)}
                className={cn(
                  "group relative bg-white rounded-[2.5rem] p-8 border transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 cursor-pointer",
                  isUnread ? "border-red-600/30 shadow-lg shadow-red-600/5" : (isResolved ? "opacity-60 border-emerald-500/20" : "border-border/50 shadow-sm")
                )}
              >
                {isUnread && (
                  <div className="absolute -top-3 -right-3 bg-red-600 text-white text-[9px] font-black px-3 py-1 rounded-full shadow-xl z-10 animate-pulse uppercase tracking-widest">
                    New Discovery
                  </div>
                )}
                {isResolved && (
                  <div className="absolute -top-3 -right-3 bg-emerald-600 text-white text-[9px] font-black px-3 py-1 rounded-full shadow-xl z-10 uppercase tracking-widest">
                    Resolved
                  </div>
                )}

                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 shadow-sm", typeConfig.bg, typeConfig.color)}>
                      <typeConfig.icon className="w-6 h-6" />
                    </div>
                    <div>
                       <div className={cn("text-[9px] font-black uppercase tracking-[0.2em] mb-1", typeConfig.color)}>
                         {typeConfig.label}
                       </div>
                       <h3 className="text-base font-black text-[#0a1628] leading-tight">
                         {f.name || 'Anonymous User'}
                       </h3>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">
                      <Clock className="w-3.5 h-3.5" /> 
                      {f.createdAt ? (() => {
                        const d = new Date(f.createdAt);
                        return isNaN(d.getTime()) ? (f.date || 'Jan 1, 2026') : format(d, "MMM d, yyyy");
                      })() : (f.date || 'Jan 1, 2026')}
                    </div>
                  </div>
                </div>

                <div className="bg-muted/30 rounded-[1.5rem] p-6 border border-border/20 mb-8 relative group-hover:bg-muted/50 transition-colors min-h-[100px]">
                   <p className="text-sm text-[#0a1628] leading-relaxed font-medium italic line-clamp-3">
                     "{f.message}"
                   </p>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-border/30">
                  <div className="flex items-center gap-4">
                    {f.email && (
                      <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground hover:text-red-600 transition-colors">
                        <Mail className="w-3.5 h-3.5" /> {f.email}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isUnread && (
                      <button 
                        onClick={(e) => handleMarkAsRead(f.id, e)}
                        className="bg-white hover:bg-red-600 hover:text-white border border-border/50 hover:border-red-600 text-red-600 p-2.5 rounded-xl transition-all shadow-sm active:scale-95"
                        title="Mark as Read"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    {!isResolved && (
                      <button 
                        onClick={(e) => handleResolve(f.id, e)}
                        className="bg-white hover:bg-emerald-600 hover:text-white border border-border/50 hover:border-emerald-600 text-emerald-600 p-2.5 rounded-xl transition-all shadow-sm active:scale-95"
                        title="Mark as Resolved"
                      >
                        <ShieldAlert className="w-4 h-4" />
                      </button>
                    )}
                    <button 
                      onClick={(e) => handleDelete(f.id, e)}
                      disabled={isDeleting}
                      className="bg-white hover:bg-slate-900 hover:text-white border border-border/50 hover:border-slate-900 text-slate-400 p-2.5 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
                      title="Delete Entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      <Dialog open={!!selectedFeedback} onOpenChange={() => setSelectedFeedback(null)}>
        <DialogContent className="sm:max-w-xl rounded-[3rem] p-10 bg-white border-none shadow-2xl">
          {selectedFeedback && (
            <>
              <DialogHeader className="mb-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center",
                    selectedFeedback.type?.toLowerCase()?.includes('bug') ? "bg-red-50 text-red-600" : 
                    selectedFeedback.type?.toLowerCase() === 'compliment' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                  )}>
                    {selectedFeedback.type?.toLowerCase()?.includes('bug') ? <Bug /> : 
                     selectedFeedback.type?.toLowerCase() === 'compliment' ? <Heart /> : <Lightbulb />}
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">
                      {selectedFeedback.type || 'General Feedback'}
                    </div>
                    <DialogTitle className="text-2xl font-black text-[#0a1628]">
                      {selectedFeedback.name || 'Anonymous User'}
                    </DialogTitle>
                  </div>
                </div>
                <DialogDescription className="text-muted-foreground text-sm flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" /> 
                  Submitted on {selectedFeedback.createdAt ? (() => {
                    const d = new Date(selectedFeedback.createdAt);
                    return isNaN(d.getTime()) ? 'January 1, 2026' : format(d, "MMMM d, yyyy 'at' h:mm a");
                  })() : 'January 1, 2026'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-8">
                <div className="bg-muted/30 rounded-[2rem] p-8 border border-border/20">
                  <p className="text-lg text-[#0a1628] leading-relaxed italic font-medium">
                    "{selectedFeedback.message}"
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Contact Email</div>
                    <div className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <Mail className="w-4 h-4" /> {selectedFeedback.email || 'N/A'}
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Status</div>
                    <div className="text-sm font-bold text-slate-700 flex items-center gap-2 capitalize">
                      <ShieldAlert className="w-4 h-4" /> {selectedFeedback.status || (selectedFeedback.read ? 'Read' : 'Unread')}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  {selectedFeedback.status !== 'resolved' && (
                    <button 
                      onClick={() => handleResolve(selectedFeedback.id)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-3"
                    >
                      <CheckCircle className="w-5 h-5" /> Mark as Done
                    </button>
                  )}
                  <button 
                    onClick={() => handleDelete(selectedFeedback.id)}
                    className="flex-1 bg-slate-900 hover:bg-black text-white font-black py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-3"
                  >
                    <Trash2 className="w-5 h-5" /> Delete Report
                  </button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
