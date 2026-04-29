import * as React from "react";
import { AdminLayout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui-components";
import { Library, Search, FileText, CheckCircle2, ArrowRight, Clock, Star, ArrowUpRight } from "lucide-react";
import { useGetAccessRequests, useGetMaterials } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Link } from "wouter";

export default function AccessedMaterials() {
  const { data: approvedRequests, isLoading } = useGetAccessRequests({ status: "approved" });
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredRequests = (approvedRequests?.requests || []).filter((req: any) => 
    req.materialTitle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#960000]/10 text-[#960000] border border-[#960000]/20 rounded-full px-4 py-1.5 text-[10px] font-black mb-4 uppercase tracking-[0.2em]">
              <Library className="w-3.5 h-3.5" /> Institutional Repository
            </div>
            <h1 className="text-4xl font-black text-[#0a1628] tracking-tight">Accessed Materials</h1>
            <p className="text-muted-foreground mt-2 text-lg">Your personal library of approved restricted archival materials.</p>
          </div>
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Search your library..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border/50 focus:ring-2 focus:ring-[#960000]/20 focus:border-[#960000]/30 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-white border border-border/50 rounded-[2rem] animate-pulse" />
          ))}
        </div>
      ) : filteredRequests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredRequests.map((req: any) => (
            <Link key={req.id} href={`/materials/${req.materialId}`}>
              <Card className="group h-full bg-white border border-border/50 rounded-[2rem] shadow-sm hover:shadow-2xl hover:border-[#960000]/20 hover:-translate-y-2 transition-all duration-500 overflow-hidden cursor-pointer">
                <CardContent className="p-0 flex flex-col h-full">
                  <div className="h-48 relative overflow-hidden bg-muted/20">
                    {req.materialCover ? (
                      <img src={req.materialCover} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="w-12 h-12 text-[#960000]/20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                      <span className="text-white text-xs font-bold flex items-center gap-2">
                        View Details <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md rounded-full px-3 py-1 text-[10px] font-black text-[#960000] shadow-sm flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3" /> APPROVED
                    </div>
                  </div>
                  
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#960000]" />
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Archival Record</span>
                    </div>
                    <h3 className="text-xl font-bold text-[#0a1628] mb-3 line-clamp-2 leading-tight group-hover:text-[#960000] transition-colors">
                      {req.materialTitle}
                    </h3>
                    <div className="mt-auto pt-4 border-t border-border/30 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        {format(new Date(req.createdAt), "MMM d, yyyy")}
                      </div>
                      <ArrowUpRight className="w-5 h-5 text-muted-foreground/30 group-hover:text-[#960000] group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-border/50">
          <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-8">
            <Library className="w-10 h-10 text-muted-foreground/20" />
          </div>
          <h3 className="text-2xl font-black text-[#0a1628] mb-3">Your library is empty</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mb-10 text-lg leading-relaxed">
            Approved restricted materials will appear here automatically.
          </p>
          <Link href="/collections">
            <button className="bg-[#0a1628] text-white font-black py-4 px-10 rounded-2xl hover:bg-[#960000] transition-all shadow-xl shadow-black/10 hover:shadow-[#960000]/20 active:scale-95">
              Explore Collections
            </button>
          </Link>
        </div>
      )}
    </AdminLayout>
  );
}
