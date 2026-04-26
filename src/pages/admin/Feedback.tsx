import * as React from "react";
import { AdminLayout } from "@/components/layout";
import { MessageSquare, CheckCircle, Clock, Trash2, Loader2 } from "lucide-react";
import { useGetFeedbacks, useMarkFeedbackRead, useDeleteFeedback } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminFeedback() {
  const { data: feedbacks, isLoading } = useGetFeedbacks();
  const { mutate: markRead } = useMarkFeedbackRead();
  const { mutate: deleteFeedback, isPending: isDeleting } = useDeleteFeedback();
  const { toast } = useToast();

  const handleMarkAsRead = (id: string) => {
    markRead({ id });
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Are you sure you want to delete this feedback?")) return;
    deleteFeedback({ id }, {
      onSuccess: () => {
        toast({ title: "Deleted", description: "Feedback has been deleted." });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to delete feedback.", variant: "destructive" });
      }
    });
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-[#0a1628] mb-2 tracking-tight">User Feedback</h1>
          <p className="text-muted-foreground text-sm flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> Review suggestions and reports from the community.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden min-h-[200px] relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !feedbacks || feedbacks.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
             No feedback received yet.
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {feedbacks.map((f: any) => (
              <div key={f.id} className={`p-6 transition-colors ${f.read === false || f.status === 'unread' ? 'bg-[#4169E1]/5' : ''}`}>
                 <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                            f.type === 'Bug Report' ? 'bg-red-100 text-red-600' : 
                            f.type === 'Compliment' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-[#4169E1]'
                        }`}>
                            {f.type}
                        </span>
                        <span className="text-sm font-semibold text-[#0a1628]">{f.name || 'Anonymous'}</span>
                        {f.email && <span className="text-xs text-muted-foreground">({f.email})</span>}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground font-semibold">
                       <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {f.date || new Date().toISOString().split('T')[0]}</span>
                       {(f.read === false || f.status === 'unread') && (
                         <button onClick={() => handleMarkAsRead(f.id)} className="flex items-center gap-1 text-[#4169E1] hover:text-[#3558c8] bg-white px-2 py-1 rounded shadow-sm border border-border/50 transition-colors">
                           <CheckCircle className="w-3 h-3" /> Mark as Read
                         </button>
                       )}
                       <button onClick={() => handleDelete(f.id)} disabled={isDeleting} className="flex items-center gap-1 text-red-500 hover:text-red-700 bg-white px-2 py-1 rounded shadow-sm border border-border/50 transition-colors disabled:opacity-50">
                         <Trash2 className="w-3 h-3" /> Delete
                       </button>
                    </div>
                 </div>
                 <div className="text-sm text-foreground leading-relaxed bg-slate-50 p-4 rounded-xl border border-border/50">
                    "{f.message}"
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
