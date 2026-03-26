import * as React from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FileText, CalendarDays, Lock, UserPlus, Send, Database, ArrowLeft } from "lucide-react";
import { Button, Input, Label } from "@/components/ui-components";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { useGetMe, useRegister, useSubmitAccessRequest } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const registerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["student", "researcher", "alumni", "public"]),
  institution: z.string().optional(),
  purpose: z.string().optional(),
});

const requestSchema = z.object({
  purpose: z.string().min(1, "Purpose is required"),
});

export default function Register() {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const params = new URLSearchParams(location.includes("?") ? location.split("?")[1] : "");
  const materialId = params.get("materialId") ?? "";
  const materialTitle = params.get("title") ?? "Selected Material";
  const materialDateRaw = params.get("date") ?? "";
  const cover = params.get("cover") ?? "";
  const isRequestMode = !!materialId;

  const materialDate = React.useMemo(() => {
    if (!materialDateRaw) return null;
    try {
      return format(new Date(materialDateRaw), "MMM d, yyyy");
    } catch {
      return materialDateRaw;
    }
  }, [materialDateRaw]);

  const { data: me } = useGetMe();
  const { mutate: mutateRegister, isPending: isRegisterPending } = useRegister();
  const { mutate: submitRequest, isPending: isRequestPending } = useSubmitAccessRequest();

  const schemaToUse = isRequestMode ? requestSchema : registerSchema;
  const form = useForm<any>({
    resolver: zodResolver(schemaToUse as any),
    defaultValues: { role: "researcher" },
  });

  const onSubmit = (data: any) => {
    if (isRequestMode) {
      if (!me) {
        toast({ title: "Sign in required", description: "Please sign in before submitting a request.", variant: "destructive" });
        setLocation("/login");
        return;
      }
      if (!data?.purpose?.trim()) return;
      submitRequest(
        { data: { materialId, purpose: data.purpose.trim() } },
        {
          onSuccess: () => {
            toast({ title: "Request Submitted", description: "Your access request is pending review by an archivist." });
            queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
            setLocation("/collections");
          },
          onError: (err) => {
            toast({ title: "Request Failed", description: (err as any)?.data?.error || "Error submitting request", variant: "destructive" });
          },
        },
      );
      return;
    }

    mutateRegister({ data }, {
      onSuccess: () => {
        toast({ title: "Registration Submitted", description: "Your account is pending approval by an archivist." });
        setLocation("/login");
      },
      onError: (err: any) => {
        toast({ title: "Registration Failed", description: err?.data?.error || "Error registering", variant: "destructive" });
      }
    });
  };

  return (
    <div className="min-h-screen flex bg-[#0a1628] relative overflow-hidden">
      {/* Animated background matching login */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#3a0000]/60 via-[#0a1628] to-[#0a1628]" />
        <div className="absolute -top-32 -right-32 h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(150,0,0,0.35),_transparent_55%)] blur-3xl animate-float-slow" />
        <div className="absolute -bottom-48 -left-48 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(65,105,225,0.2),_transparent_60%)] blur-3xl animate-float-slower" />
        <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay pointer-events-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22160%22%20height%3D%22160%22%3E%3Cfilter%20id%3D%22n%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.9%22%20numOctaves%3D%223%22%20stitchTiles%3D%22stitch%22/%3E%3C/filter%3E%3Crect%20width%3D%22160%22%20height%3D%22160%22%20filter%3D%22url(%23n)%22%20opacity%3D%220.55%22/%3E%3C/svg%3E')]" />
      </div>

      {isRequestMode ? (
        // --- REQUEST ACCESS UI ---
        <div className="w-full flex justify-center items-center p-6 relative z-10">
          <div className="lg:w-[900px] w-full bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col md:flex-row">
            
            {/* Left Col: Material details */}
            <div className="w-full md:w-5/12 bg-[#050a14]/60 p-8 flex flex-col border-r border-white/5">
              <Button variant="ghost" className="self-start text-white/50 hover:text-white hover:bg-white/5 -ml-4 mb-6" onClick={() => window.history.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <div className="inline-flex items-center gap-2 bg-[#960000]/20 text-[#ff8888] rounded-xl px-3 py-1.5 text-xs font-bold w-max mb-6">
                <Database className="w-4 h-4" /> Restricted Material
              </div>
              <h3 className="text-2xl font-bold text-white leading-snug mb-4">{materialTitle}</h3>
              <div className="flex items-center gap-2 text-sm text-white/50 mb-6">
                <CalendarDays className="w-4 h-4" /> <span>{materialDate ?? "Date unknown"}</span>
              </div>
              
              {cover ? (
                <div className="mt-auto h-48 w-full rounded-xl overflow-hidden shadow-inner border border-white/10">
                  <img src={cover} alt="Cover" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="mt-auto h-48 w-full rounded-xl border border-white/10 bg-white/5 flex flex-col items-center justify-center text-white/20">
                  <FileText className="w-10 h-10 mb-2" />
                  <span className="text-xs">No Cover</span>
                </div>
              )}
            </div>

            {/* Right Col: Request Form */}
            <div className="w-full md:w-7/12 p-8 lg:p-12 flex flex-col justify-center">
              <h2 className="text-3xl font-bold text-white mb-2">Request Access</h2>
              <p className="text-white/40 text-sm mb-8">Submit your academic or research justification to the catalog archivist.</p>

              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-white/70 text-sm font-medium">Research Purpose <span className="text-red-400">*</span></label>
                  <Textarea
                    {...form.register("purpose")}
                    className="w-full h-40 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 focus:border-[#4169E1]/50 focus:ring-1 focus:ring-[#4169E1]/30 transition-all resize-none"
                    placeholder="Briefly describe what you will research and why you need access to this specific material..."
                  />
                  {form.formState.errors.purpose && <p className="text-sm text-red-400">{String(form.formState.errors.purpose.message ?? "")}</p>}
                </div>

                {!me && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200 flex items-start gap-3">
                    <Lock className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold mb-1">Authentication Required</p>
                      <p className="text-red-200/70">You must be signed in to submit access requests.</p>
                      <Link href="/login" className="inline-block mt-3 text-red-300 font-medium hover:text-white underline underline-offset-4">Go to Login</Link>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!me || isRequestPending}
                  className="w-full h-12 bg-[#4169E1] hover:bg-[#3154b5] text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
                >
                  {isRequestPending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send className="w-4 h-4" /> Submit Request</>}
                </button>
              </form>
            </div>
          </div>
        </div>

      ) : (

        // --- ACCOUNT REGISTRATION UI ---
        <div className="w-full flex h-full p-4 lg:p-0 relative z-10 items-center justify-center">
          <div className="w-full max-w-[1000px] flex flex-col lg:flex-row bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
            
            {/* Left: Branding */}
            <div className="hidden lg:flex w-5/12 bg-[#050a14]/60 p-10 flex-col justify-between border-r border-white/5">
              <div>
                <Link href="/" className="inline-flex items-center gap-3 text-white hover:opacity-80 transition-opacity">
                  <img src={`${import.meta.env.BASE_URL}logos/iarchive%20white%20logo.png`} alt="iArchive" className="h-8 w-auto object-contain" />
                </Link>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-4 line-height-tight">Join the<br/>Digital Archive</h1>
                <p className="text-white/50 text-base leading-relaxed mb-6">Create an account to track your requests, access restricted materials, and preserve history.</p>
                <div className="space-y-4">
                  <div className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/8">
                    <Database className="w-5 h-5 text-[#4169E1] mt-0.5" />
                    <div><h3 className="text-white text-sm font-bold">Extensive Catalog</h3><p className="text-white/40 text-xs mt-1">Access thousands of academic records.</p></div>
                  </div>
                </div>
              </div>
              <p className="text-white/20 text-xs">© {new Date().getFullYear()} HCDC Archives.</p>
            </div>

            {/* Right: Registration Form */}
            <div className="w-full lg:w-7/12 p-8 lg:p-12 overflow-y-auto max-h-screen lg:max-h-[90vh] custom-scroll">
              <div className="mb-8">
                <Link href="/" className="lg:hidden flex items-center gap-3 mb-8">
                  <img src={`${import.meta.env.BASE_URL}logos/iarchive%20white%20logo.png`} alt="iArchive" className="h-8 w-auto object-contain" />
                </Link>
                <h2 className="text-3xl font-bold text-white mb-2">Request Account</h2>
                <p className="text-white/40 text-sm">Fill in your details for archivist verification</p>
              </div>

              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-white/70 text-sm font-medium">Full Name</label>
                    <input {...form.register("name")} placeholder="Juan Dela Cruz" className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-white text-sm placeholder:text-white/25 focus:border-[#4169E1]/50 focus:ring-1 focus:ring-[#4169E1]/30 transition-all" />
                    {form.formState.errors.name && <p className="text-sm text-red-400">{String(form.formState.errors.name.message ?? "")}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-white/70 text-sm font-medium">Email Address</label>
                    <input {...form.register("email")} placeholder="name@hcdc.edu.ph" className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-white text-sm placeholder:text-white/25 focus:border-[#4169E1]/50 focus:ring-1 focus:ring-[#4169E1]/30 transition-all" />
                    {form.formState.errors.email && <p className="text-sm text-red-400">{String(form.formState.errors.email.message ?? "")}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-white/70 text-sm font-medium">Password</label>
                  <input type="password" {...form.register("password")} placeholder="••••••••" className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-white text-sm placeholder:text-white/25 focus:border-[#4169E1]/50 focus:ring-1 focus:ring-[#4169E1]/30 transition-all" />
                  {form.formState.errors.password && <p className="text-sm text-red-400">{String(form.formState.errors.password.message ?? "")}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-white/70 text-sm font-medium">User Category</label>
                    <select {...form.register("role")} className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-white text-sm focus:border-[#4169E1]/50 focus:ring-1 focus:ring-[#4169E1]/30 transition-all appearance-none">
                      <option value="student" className="bg-[#0a1628]">HCDC Student</option>
                      <option value="researcher" className="bg-[#0a1628]">External Researcher</option>
                      <option value="alumni" className="bg-[#0a1628]">HCDC Alumni</option>
                      <option value="public" className="bg-[#0a1628]">General Public</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-white/70 text-sm font-medium">Institution / Affiliation</label>
                    <input {...form.register("institution")} placeholder="e.g. HCDC" className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-white text-sm placeholder:text-white/25 focus:border-[#4169E1]/50 focus:ring-1 focus:ring-[#4169E1]/30 transition-all" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-white/70 text-sm font-medium">Research Intent (Optional)</label>
                  <Textarea {...form.register("purpose")} placeholder="Briefly describe what collections you intend to research..." className="w-full h-24 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 focus:border-[#4169E1]/50 focus:ring-1 focus:ring-[#4169E1]/30 transition-all resize-none" />
                </div>

                <button type="submit" disabled={isRegisterPending} className="w-full h-12 bg-[#960000] hover:bg-[#7a0000] text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 mt-6">
                  {isRegisterPending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><UserPlus className="w-4 h-4" /> Submit Registration</>}
                </button>
              </form>

              <div className="mt-8 text-center text-sm text-white/40 pt-6 border-t border-white/5">
                Already have an account?{" "}
                <Link href="/login" className="text-[#4169E1] font-semibold hover:text-[#5a80f8] transition-colors">Sign In</Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
