import * as React from "react";
import { AdminLayout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui-components";
import { 
  Library, Search, FileText, CheckCircle2, ArrowRight, Clock, Star, 
  ArrowUpRight, Trash2, ShieldCheck, GraduationCap, Info, ExternalLink
} from "lucide-react";
import { useGetAccessRequests, useDeleteAccessRequest } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function AccessedMaterials() {
  const { data: approvedRequests, isLoading } = useGetAccessRequests({ status: "approved" });
  const { mutate: deleteRequest } = useDeleteAccessRequest();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredRequests = (approvedRequests?.requests || []).filter((req: any) => 
    req.materialTitle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to remove this material from your accessed library?")) {
      deleteRequest(id, {
        onSuccess: () => {
          toast({ title: "Material Removed", description: "The item has been removed from your accessed library." });
        }
      });
    }
  };

  return (
    <AdminLayout>
      <div className="mb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#960000]/10 text-[#960000] border border-[#960000]/20 rounded-full px-5 py-2 text-[10px] font-black mb-6 uppercase tracking-[0.3em]">
              <Library className="w-4 h-4" /> Institutional Repository
            </div>
            <h1 className="text-5xl font-black text-[#0a1628] tracking-tight mb-3">Accessed Materials</h1>
            <p className="text-muted-foreground text-lg font-medium">Your authorized collection of restricted institutional assets.</p>
          </div>
          
          <div className="relative w-full md:w-96 group">
            <div className="absolute inset-0 bg-[#960000]/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-[#960000]" />
            <input 
              type="text"
              placeholder="Search your library..."
              className="relative w-full pl-14 pr-6 py-4 rounded-3xl border border-border/50 bg-white/50 backdrop-blur-sm focus:ring-4 focus:ring-[#960000]/10 focus:border-[#960000]/30 outline-none transition-all font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-[400px] bg-white border border-border/50 rounded-[3rem] animate-pulse" />
          ))}
        </div>
      ) : filteredRequests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
          {filteredRequests.map((req: any) => (
            <Card key={req.id} className="group relative bg-white border border-border/50 rounded-[3rem] shadow-sm hover:shadow-2xl hover:border-[#960000]/20 transition-all duration-500 overflow-hidden flex flex-col">
              {/* Image Section */}
              <div className="h-56 relative overflow-hidden bg-muted/20">
                {req.materialCover ? (
                  <img src={req.materialCover} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted/50 to-muted/20">
                    <FileText className="w-16 h-16 text-[#960000]/10" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                   <Link href={`/materials/${req.materialId}`} className="w-full">
                     <button className="w-full bg-white text-[#0a1628] font-black py-3 rounded-2xl flex items-center justify-center gap-2 text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                       View Digital Record <ExternalLink className="w-4 h-4" />
                     </button>
                   </Link>
                </div>
                <div className="absolute top-6 right-6 flex gap-2">
                   <button 
                    onClick={() => handleDelete(req.id)}
                    className="p-3 bg-white/90 backdrop-blur-md rounded-2xl text-destructive hover:bg-destructive hover:text-white transition-all shadow-sm"
                    title="Remove from accessed library"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                </div>
                <div className="absolute top-6 left-6 bg-[#960000] text-white rounded-full px-4 py-1.5 text-[10px] font-black shadow-lg flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5" /> SECURE ACCESS
                </div>
              </div>

              {/* Content Section */}
              <div className="p-8 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-[#960000]" />
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Archival Record</span>
                </div>
                
                <h3 className="text-2xl font-black text-[#0a1628] mb-6 line-clamp-2 leading-tight group-hover:text-[#960000] transition-colors">
                  {req.materialTitle}
                </h3>

                {/* Progressive Status Card Design (All Green as it's Approved) */}
                <div className="mt-auto pt-6 border-t border-border/30">
                  <div className="grid grid-cols-3 items-center gap-4 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-8">
                    <div className="flex flex-col items-center gap-3">
                      <span>Request</span>
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500 border-2 border-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-all duration-500 scale-110">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                    </div>
                    
                    <div className="h-0.5 bg-emerald-500 relative top-1" />
                    
                    <div className="flex flex-col items-center gap-3">
                      <span>Access</span>
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500 border-2 border-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-all duration-500 scale-110">
                        <GraduationCap className="w-6 h-6" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground font-bold">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {req.createdAt ? format(new Date(req.createdAt), "MMM d, yyyy") : "N/A"}
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" /> VERIFIED
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="py-32 text-center bg-white rounded-[4rem] border-2 border-dashed border-border/50">
          <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-8">
            <Library className="w-12 h-12 text-muted-foreground/20" />
          </div>
          <h3 className="text-3xl font-black text-[#0a1628] mb-4">Your library is empty</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mb-12 text-lg font-medium leading-relaxed">
            Approved restricted materials will appear here automatically for your research.
          </p>
          <Link href="/collections">
            <button className="bg-[#0a1628] text-white font-black py-5 px-12 rounded-[2rem] hover:bg-[#960000] transition-all shadow-2xl shadow-black/10 hover:shadow-[#960000]/30 active:scale-95 text-sm uppercase tracking-widest">
              Explore Collections
            </button>
          </Link>
        </div>
      )}
    </AdminLayout>
  );
}
