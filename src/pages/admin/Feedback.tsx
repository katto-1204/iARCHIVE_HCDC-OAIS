import * as React from "react";
import { AdminLayout } from "@/components/layout";
import { MessageSquare, CheckCircle, Clock } from "lucide-react";

export default function AdminFeedback() {
  const [feedbacks, setFeedbacks] = React.useState([
    { id: 1, type: "Suggestion", message: "Make the search bar bigger.", name: "Jane Doe", email: "jane@test.com", date: "2026-04-20", status: "unread" },
    { id: 2, type: "Bug Report", message: "The login page flashes sometimes on mobile.", name: "Anonymous", email: "", date: "2026-04-22", status: "read" },
  ]);

  const markAsRead = (id: number) => {
    setFeedbacks(feedbacks.map(f => f.id === id ? { ...f, status: "read" } : f));
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

      <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        {feedbacks.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
             No feedback received yet.
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {feedbacks.map((f) => (
              <div key={f.id} className={`p-6 transition-colors ${f.status === 'unread' ? 'bg-[#4169E1]/5' : ''}`}>
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
                       <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {f.date}</span>
                       {f.status === 'unread' && (
                         <button onClick={() => markAsRead(f.id)} className="flex items-center gap-1 text-[#4169E1] hover:text-[#3558c8] bg-white px-2 py-1 rounded shadow-sm border border-border/50 transition-colors">
                           <CheckCircle className="w-3 h-3" /> Mark as Read
                         </button>
                       )}
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
