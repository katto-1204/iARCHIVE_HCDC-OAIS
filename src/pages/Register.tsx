import * as React from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Lock, UserPlus, ArrowLeft, ChevronRight, CheckCircle2, X, AlertTriangle, MailWarning, PartyPopper, Eye, EyeOff } from "lucide-react";
import { Button, Input, Label, Badge } from "@/components/ui-components";
import { useRegister } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const registerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["student", "researcher", "alumni", "public", "archivist"]),
  institution: z.string().min(1, "Institution/Affiliation is required"),
  purpose: z.string().optional(),
});

type ModalData = {
  type: "success" | "duplicate" | "error";
  title: string;
  message: string;
  suggestion?: string;
};

export default function Register() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const { mutate: mutateRegister, isPending } = useRegister();
  const [modal, setModal] = React.useState<ModalData | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "student" },
  });

  const onSubmit = (data: z.infer<typeof registerSchema>) => {
    mutateRegister({ data }, {
      onSuccess: () => {
        setModal({
          type: "success",
          title: "Registration Submitted!",
          message: "Your account application has been received successfully.",
          suggestion: "An administrator will review your application and activate your account. You will be able to log in once approved."
        });
      },
      onError: (err: any) => {
        const message = err?.message || err?.data?.error || "Error registering";
        if (/already registered|email already|already in use/i.test(message)) {
          setModal({
            type: "duplicate",
            title: "Email Already Registered",
            message: "An account with this email address already exists in our system.",
            suggestion: "Please sign in with your existing account, or use a different email address."
          });
        } else {
          setModal({
            type: "error",
            title: "Registration Failed",
            message: message,
            suggestion: "Please check your information and try again. If the problem persists, contact the administrator."
          });
        }
      }
    });
  };

  const modalConfig = {
    success: { icon: PartyPopper, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", gradient: "from-emerald-500 to-emerald-600" },
    duplicate: { icon: MailWarning, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", gradient: "from-amber-500 to-amber-600" },
    error: { icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", gradient: "from-red-500 to-red-600" },
  };

  return (
    <div className="min-h-screen flex bg-white font-sans">
      {/* Sidebar Branding - Premium Deep Blue */}
      <div className="hidden lg:flex w-[400px] bg-[#050a14] p-12 flex-col justify-between relative overflow-hidden shrink-0">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_rgba(150,0,0,0.5),_transparent_70%)]" />
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]" />
        
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <img src={`${import.meta.env.BASE_URL}logos/iarchive%20white%20logo.png`} alt="iArchive" className="h-10 w-auto brightness-110" />
          </Link>
        </div>

        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <Badge variant="outline" className="border-white/20 text-white/60 px-3 py-1 font-bold tracking-tighter uppercase text-[10px]">Secure Archival Access</Badge>
            <h1 className="text-5xl font-display font-bold text-white leading-[1.1]">Preserving<br/>History<br/><span className="text-[#4169E1]">Together.</span></h1>
            <p className="text-white/50 text-lg leading-relaxed max-w-sm">Create an account to track your research requests and access restricted HCDC digital collections.</p>
          </div>

          <div className="space-y-4 pt-8 border-t border-white/5">
            {[
              { title: "Standardized Metadata", desc: "Dublin Core & ISAD(G) compliance" },
              { title: "Controlled Access", desc: "Direct communication with archivists" }
            ].map((feature, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                  <CheckCircle2 className="w-4 h-4 text-[#4169E1]" />
                </div>
                <div>
                  <h3 className="text-white text-sm font-bold">{feature.title}</h3>
                  <p className="text-white/40 text-xs mt-0.5">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-white/20 text-xs font-medium tracking-widest uppercase">&copy; {new Date().getFullYear()} Holy Cross of Davao College</p>
        </div>
      </div>

      {/* Main Content Form */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 py-8 sm:px-8 sm:py-12 md:p-12 lg:p-24 bg-muted/10 overflow-y-auto min-h-screen">
        <div className="lg:hidden flex justify-center w-full mb-8 shrink-0">
          <Link href="/" className="flex items-center">
            <img src={`${import.meta.env.BASE_URL}logos/iarchive%20icon.png`} alt="iArchive" className="h-10 w-auto object-contain drop-shadow" />
            <span className="ml-3 font-display font-bold text-2xl tracking-tight text-[#050a14]">iArchive</span>
          </Link>
        </div>
        <div className="w-full max-w-xl bg-white border border-border/50 rounded-3xl p-8 sm:p-12 shadow-2xl shadow-[#4169E1]/5 relative overflow-hidden animate-fade-in-up">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#4169E1] via-[#7c94e8] to-[#960000]" />
          <div className="space-y-3 mb-10">
            <h2 className="text-3xl sm:text-4xl font-black text-[#0a1628] tracking-tight">Request Account</h2>
            <p className="text-muted-foreground text-sm">Submit your application for archivist verification. Accounts are usually reviewed within 24 hours.</p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-bold text-[#050a14]">Full Name</Label>
                <Input {...form.register("name")} id="name" placeholder="John Doe" className="h-12 border-muted-foreground/20 focus:border-[#4169E1] focus:ring-[#4169E1]/10 bg-white" />
                {form.formState.errors.name && <p className="text-xs text-red-500 font-medium">{form.formState.errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-bold text-[#050a14]">Email Address</Label>
                <Input {...form.register("email")} id="email" type="email" placeholder="name@hcdc.edu.ph" className="h-12 border-muted-foreground/20 focus:border-[#4169E1] focus:ring-[#4169E1]/10 bg-white" />
                {form.formState.errors.email && <p className="text-xs text-red-500 font-medium">{form.formState.errors.email.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-bold text-[#050a14]">Password</Label>
              <div className="relative">
                <Input {...form.register("password")} id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" className="h-12 pl-11 pr-10 border-muted-foreground/20 focus:border-[#4169E1] focus:ring-[#4169E1]/10 bg-white" />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.formState.errors.password && <p className="text-xs text-red-500 font-medium">{form.formState.errors.password.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-bold text-[#050a14]">User Category</Label>
                <select {...form.register("role")} className="flex h-12 w-full rounded-xl border border-muted-foreground/20 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4169E1]/10 focus:border-[#4169E1] disabled:cursor-not-allowed disabled:opacity-50 appearance-none">
                  <option value="student">HCDC User</option>
                  <option value="archivist">Archivist (Internal)</option>
                  <option value="researcher">External Researcher</option>
                  <option value="alumni">HCDC Alumni</option>
                  <option value="public">General Public</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="institution" className="text-sm font-bold text-[#050a14]">Institution / Affiliation</Label>
                <Input {...form.register("institution")} id="institution" placeholder="e.g. HCDC" className="h-12 border-muted-foreground/20 focus:border-[#4169E1] focus:ring-[#4169E1]/10 bg-white" />
                {form.formState.errors.institution && <p className="text-xs text-red-500 font-medium">{form.formState.errors.institution.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purpose" className="text-sm font-bold text-[#050a14]">Research Field (Optional)</Label>
              <Input {...form.register("purpose")} id="purpose" placeholder="e.g. Local History, Physical Education" className="h-12 border-muted-foreground/20 focus:border-[#4169E1] focus:ring-[#4169E1]/10 bg-white" />
            </div>

            <div className="pt-4">
              <Button type="submit" disabled={isPending} className="w-full h-14 bg-[#4169E1] hover:bg-[#3154b5] text-white font-bold rounded-2xl shadow-lg shadow-[#4169E1]/20 transition-all text-lg flex items-center justify-center gap-2">
                {isPending ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><UserPlus className="w-5 h-5" /> Submit Application</>}
              </Button>
            </div>
          </form>

          <div className="text-center pt-8 border-t border-muted-foreground/10 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            Already have an approved account? 
            <Link href="/login" className="text-[#4169E1] font-bold hover:underline flex items-center">
              Login here <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* ─── Premium Registration Modal ─── */}
        {modal && (() => {
          const cfg = modalConfig[modal.type];
          const Icon = cfg.icon;
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => { if (modal.type !== "success") setModal(null); }}>
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
              <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}>
                <div className={`h-1.5 w-full bg-gradient-to-r ${cfg.gradient}`} />
                <div className="p-7">
                  <button onClick={() => { modal.type === "success" ? setLocation("/login") : setModal(null); }}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                  <div className={`w-16 h-16 rounded-2xl ${cfg.bg} border ${cfg.border} flex items-center justify-center mb-5`}>
                    <Icon className={`w-8 h-8 ${cfg.color}`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{modal.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{modal.message}</p>
                  {modal.suggestion && <p className="text-gray-400 text-xs leading-relaxed mt-3 bg-gray-50 rounded-lg p-3 border border-gray-100">{modal.suggestion}</p>}
                  <div className="flex gap-3 mt-6">
                    {modal.type === "success" ? (
                      <button onClick={() => setLocation("/login")}
                        className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-600/20">
                        <CheckCircle2 className="w-4 h-4" /> Go to Login
                      </button>
                    ) : modal.type === "duplicate" ? (
                      <>
                        <button onClick={() => setModal(null)} className="flex-1 h-11 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">Use Different Email</button>
                        <Link href="/login" className="flex-1 h-11 rounded-xl bg-[#4169E1] hover:bg-[#3558c0] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors">Sign In</Link>
                      </>
                    ) : (
                      <button onClick={() => setModal(null)} className="w-full h-11 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold transition-colors">Try Again</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
