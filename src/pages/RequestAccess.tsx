import * as React from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FileText, CalendarDays, Lock, Send, Database, ArrowLeft, Info } from "lucide-react";
import { Button, Badge } from "@/components/ui-components";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useGetMe, useSubmitAccessRequest } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const requestSchema = z.object({
  purpose: z.string().min(10, "Please provide a more detailed research purpose (min 10 characters)."),
});

export default function RequestAccess() {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const params = new URLSearchParams(window.location.search);
  const materialId = params.get("materialId") ?? "";
  
  const { data: me, isLoading: isMeLoading } = useGetMe();
  const { mutate: submitRequest, isPending: isRequestPending } = useSubmitAccessRequest();

  // Fetch material details if we have an ID
  const { data: material, isLoading: isMatLoading } = useQuery({
    queryKey: ["/api/materials", materialId],
    enabled: !!materialId,
    queryFn: async () => {
      const resp = await fetch(`/api/materials/${materialId}`);
      if (!resp.ok) throw new Error("Material not found");
      return resp.json();
    }
  });

  const form = useForm<z.infer<typeof requestSchema>>({
    resolver: zodResolver(requestSchema),
  });

  const onSubmit = (data: z.infer<typeof requestSchema>) => {
    if (!me) {
      toast({ title: "Sign in required", description: "Please sign in before submitting a request.", variant: "destructive" });
      setLocation("/login");
      return;
    }

    submitRequest(
      { data: { materialId, purpose: data.purpose.trim(), userId: me.id, userName: me.name } as any },
      {
        onSuccess: () => {
          toast({ title: "Request Submitted", description: "Your access request is pending review by an archivist." });
          queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
          setLocation("/collections");
        },
        onError: (err: any) => {
          toast({ title: "Request Failed", description: err?.data?.error || "Error submitting request", variant: "destructive" });
        },
      },
    );
  };

  if (isMatLoading || isMeLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-muted/10"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  }

  if (!material) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-muted/10 p-4 text-center">
        <Database className="w-16 h-16 text-muted-foreground/20 mb-4" />
        <h2 className="text-2xl font-bold">Material not found</h2>
        <p className="text-muted-foreground mb-6">The material you are looking for does not exist or has been removed.</p>
        <Link href="/collections"><Button>Back to Collections</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/10 font-sans">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <Link href="/collections" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Collections
        </Link>
        <img src={`${import.meta.env.BASE_URL}logos/iarchive%20logo.png`} alt="iArchive" className="h-6 w-auto" />
      </div>

      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-muted-foreground/10 flex flex-col md:flex-row min-h-[600px]">
          
          {/* Left Container: Material Metadata */}
          <div className="w-full md:w-5/12 bg-[#050a14] p-10 flex flex-col text-white relative">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]" />
            
            <div className="relative z-10 space-y-8 flex-1">
              <div className="space-y-4">
                <Badge variant="outline" className="border-[#960000] text-[#ff4444] bg-[#960000]/10 px-3 py-1 font-bold tracking-tight uppercase text-[10px] flex items-center gap-1.5 w-fit">
                  <Lock className="w-3 h-3" /> Restricted Material
                </Badge>
                <div className="aspect-[3/4] w-full rounded-2xl overflow-hidden bg-white/5 border border-white/10 shadow-inner group relative">
                  {material.thumbnailUrl ? (
                    <img src={material.thumbnailUrl} alt="Cover" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white/20">
                      <FileText className="w-16 h-16 mb-2 opacity-50" />
                      <span className="text-sm font-medium">No Preview Available</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-2xl font-display font-bold leading-tight group-hover:text-[#4169E1] transition-colors">{material.title}</h3>
                  <p className="text-white/40 text-sm mt-1">{material.material_id || material.materialId}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-white/50 bg-white/5 p-3 rounded-xl border border-white/5">
                    <CalendarDays className="w-4 h-4 text-[#4169E1]" />
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-wider font-bold opacity-50">Date</span>
                      <span className="text-xs font-medium">{material.date ? format(new Date(material.date), "MMM d, yyyy") : "Unknown"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-white/50 bg-white/5 p-3 rounded-xl border border-white/5">
                    <Database className="w-4 h-4 text-[#4169E1]" />
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-wider font-bold opacity-50">Format</span>
                      <span className="text-xs font-medium">{material.format || "PDF Document"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 pt-8 border-t border-white/5">
               <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/5 border border-[#4169E1]/20">
                 <Info className="w-5 h-5 text-[#4169E1] shrink-0 mt-0.5" />
                 <p className="text-xs text-white/60 leading-relaxed">
                   Access to this material is subject to approval by the HCDC Archiving Department. Please provide a clear academic or research justification.
                 </p>
               </div>
            </div>
          </div>

          {/* Right Container: Access Form */}
          <div className="w-full md:w-7/12 p-10 lg:p-16 flex flex-col">
            <div className="mb-12">
              <h2 className="text-4xl font-display font-bold text-[#050a14] tracking-tight mb-3">Request Access</h2>
              <p className="text-muted-foreground">Submit your research intent to obtain viewing privileges for this restricted material.</p>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10 flex-1 flex flex-col">
              <div className="space-y-4">
                <label className="text-sm font-bold text-[#050a14] uppercase tracking-wider">Research Purpose & Justification</label>
                <Textarea
                  {...form.register("purpose")}
                  className="w-full flex-1 min-h-[250px] bg-muted/50 border-muted-foreground/10 rounded-2xl p-6 text-sm resize-none focus:ring-2 focus:ring-[#4169E1]/10 focus:border-[#4169E1] transition-all"
                  placeholder="Describe your research project and why you require access to this specific primary source..."
                />
                {form.formState.errors.purpose && <p className="text-xs text-red-500 font-medium">{form.formState.errors.purpose.message}</p>}
              </div>

              {!me && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 space-y-4">
                  <div className="flex items-center gap-3 text-red-600">
                    <Lock className="w-5 h-5 font-bold" />
                    <h4 className="font-bold">Authentication Required</h4>
                  </div>
                  <p className="text-sm text-red-600/70 leading-relaxed">You must be logged into an approved iArchive account to submit access requests for restricted materials.</p>
                  <Link href="/login"><Button variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50">Sign In to Continue</Button></Link>
                </div>
              )}

              <div className="pt-8 mt-auto">
                <Button 
                  type="submit" 
                  disabled={!me || isRequestPending}
                  className="w-full h-16 bg-[#050a14] hover:bg-[#0a1628] text-white font-bold rounded-2xl shadow-xl shadow-[#050a14]/20 transition-all text-xl flex items-center justify-center gap-3"
                >
                  {isRequestPending ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send className="w-5 h-5 " /> Submit Access Request</>}
                </Button>
                <p className="text-center text-xs text-muted-foreground mt-4 font-medium uppercase tracking-widest opacity-50">Authorized Personnel Review Required</p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
