import * as React from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ShieldCheck, Search, Users, LogIn, Sparkles, Database, Lock, Clock, AlertTriangle, XCircle, ShieldAlert, X } from "lucide-react";
import { useLogin } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

type ErrorModalData = {
  type: "pending" | "not_found" | "invalid" | "error";
  title: string;
  message: string;
  suggestion?: string;
};

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { mutate, isPending } = useLogin();
  const [activeDemo, setActiveDemo] = React.useState<string | null>(null);
  const [errorModal, setErrorModal] = React.useState<ErrorModalData | null>(null);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: z.infer<typeof schema>) => {
    mutate({ data }, {
      onSuccess: (res) => {
        localStorage.setItem("iarchive_token", res.token);
        toast({ title: "Welcome back!", description: `Signed in as ${res.user.name}` });
        if (res.user.role === 'admin') setLocation('/admin');
        else if (res.user.role === 'archivist') setLocation('/archivist');
        else if (res.user.role === 'student') setLocation('/student');
        else setLocation('/collections');
      },
      onError: (err) => {
        const message = (err as any)?.message || "Something went wrong. Please try again.";
        if (/pending|approval|not active|wait/i.test(message)) {
          setErrorModal({ type: "pending", title: "Account Pending Approval", message, suggestion: "Your registration was received. An administrator will review and activate your account shortly." });
        } else if (/not found|no account|register first/i.test(message)) {
          setErrorModal({ type: "not_found", title: "Account Not Found", message, suggestion: "Would you like to create a new account?" });
        } else if (/incorrect|invalid|wrong|credentials/i.test(message)) {
          setErrorModal({ type: "invalid", title: "Invalid Credentials", message, suggestion: "Please double-check your email and password." });
        } else {
          setErrorModal({ type: "error", title: "Login Failed", message });
        }
      }
    });
  };

  const demoUsers = [
    { label: "Admin", email: "admin@hcdc.edu.ph", role: "Full system control", icon: ShieldCheck, color: "bg-[#0a1628]" },
    { label: "Archivist", email: "archivist@hcdc.edu.ph", role: "Catalog & manage", icon: Database, color: "bg-[#4169E1]" },
    { label: "User", email: "student@hcdc.edu.ph", role: "Browse & request", icon: Users, color: "bg-[#960000]" },
  ];

  const fillAndSubmit = (email: string) => {
    setActiveDemo(email);
    form.setValue("email", email, { shouldDirty: true, shouldValidate: true });
    form.setValue("password", "admin123", { shouldDirty: true, shouldValidate: true });
    setTimeout(() => form.handleSubmit(onSubmit)(), 300);
  };

  const modalConfig = {
    pending: { icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", gradient: "from-amber-500 to-amber-600" },
    not_found: { icon: AlertTriangle, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", gradient: "from-blue-500 to-blue-600" },
    invalid: { icon: ShieldAlert, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", gradient: "from-red-500 to-red-600" },
    error: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", gradient: "from-red-500 to-red-600" },
  };

  return (
    <div className="min-h-screen flex bg-[#0a1628] relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#3a0000]/60 via-[#0a1628] to-[#0a1628]" />
        <div className="absolute -top-32 -right-32 h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(150,0,0,0.35),_transparent_55%)] blur-3xl animate-float-slow" />
        <div className="absolute -bottom-48 -left-48 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(65,105,225,0.2),_transparent_60%)] blur-3xl animate-float-slower" />
        <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay pointer-events-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22160%22%20height%3D%22160%22%3E%3Cfilter%20id%3D%22n%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.9%22%20numOctaves%3D%223%22%20stitchTiles%3D%22stitch%22/%3E%3C/filter%3E%3Crect%20width%3D%22160%22%20height%3D%22160%22%20filter%3D%22url(%23n)%22%20opacity%3D%220.55%22/%3E%3C/svg%3E')]" />
      </div>

      {/* Left: Branding panel */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 relative z-10">
        <div>
          <Link href="/" className="inline-flex items-center gap-3 text-white hover:opacity-80 transition-opacity">
            <img src={`${import.meta.env.BASE_URL}logos/iarchive%20white%20logo.png`} alt="iArchive" className="h-10 w-auto object-contain" />
          </Link>
        </div>
        <div className="max-w-lg">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-4 py-1.5 mb-7">
            <Sparkles className="w-3.5 h-3.5 text-[#ff4444]" />
            <span className="text-white/80 text-xs font-semibold tracking-widest uppercase">Secure Archival Access</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 leading-snug">Welcome to<br /><span className="font-serif italic text-white/90">iArchive</span></h1>
          <p className="text-white/50 text-lg leading-relaxed mb-10">Sign in to access HCDC's secure digital repository — preserving institutional memory since 1951.</p>
          <div className="space-y-3">
            {[
              { icon: Lock, title: "Role-Based Access", desc: "Separate dashboards for Admin, Archivist, and User accounts" },
              { icon: Search, title: "Full Archive Search", desc: "Search across ISAD(G) metadata, Dublin Core elements, and more" },
              { icon: ShieldCheck, title: "OAIS Compliant", desc: "ISO 14721:2012 certified preservation standards" },
            ].map((f, i) => (
              <div key={i} className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/8 backdrop-blur-sm">
                <f.icon className="w-6 h-6 text-[#ff4444] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-white font-semibold text-sm">{f.title}</h3>
                  <p className="text-white/45 text-sm mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-white/30 text-xs">&copy; {new Date().getFullYear()} Holy Cross of Davao College. All rights reserved.</p>
      </div>

      {/* Right: Login form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <Link href="/" className="absolute top-6 left-6 lg:hidden flex items-center gap-2">
          <img src={`${import.meta.env.BASE_URL}logos/iarchive%20white%20logo.png`} alt="iArchive" className="h-8 w-auto object-contain" />
        </Link>
        <div className="w-full max-w-md">
          {/* Quick-login cards */}
          <div className="mb-6">
            <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-3">Quick Sign In</p>
            <div className="grid grid-cols-3 gap-2">
              {demoUsers.map((u) => (
                <button key={u.email} type="button" onClick={() => fillAndSubmit(u.email)} disabled={isPending}
                  className={`group relative overflow-hidden rounded-xl border border-white/10 p-3 text-center transition-all duration-300 hover:border-white/25 hover:scale-[1.02] ${activeDemo === u.email ? 'ring-2 ring-white/30 bg-white/10' : 'bg-white/5'}`}>
                  <div className={`w-9 h-9 rounded-lg ${u.color} flex items-center justify-center mx-auto mb-2`}>
                    <u.icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-white text-xs font-bold">{u.label}</div>
                  <div className="text-white/35 text-[10px] mt-0.5">{u.role}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/30 text-xs font-medium">or sign in manually</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-7">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-1">Sign In</h2>
              <p className="text-white/40 text-sm">Enter your credentials to continue</p>
            </div>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label className="text-white/70 text-sm font-medium">Email</label>
                <input {...form.register("email")} placeholder="name@hcdc.edu.ph" autoFocus
                  className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-[#4169E1]/50 focus:ring-1 focus:ring-[#4169E1]/30 transition-all" />
                {form.formState.errors.email && <p className="text-sm text-red-400">{form.formState.errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-white/70 text-sm font-medium">Password</label>
                <input type="password" {...form.register("password")} placeholder="••••••••"
                  className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-[#4169E1]/50 focus:ring-1 focus:ring-[#4169E1]/30 transition-all" />
                {form.formState.errors.password && <p className="text-sm text-red-400">{form.formState.errors.password.message}</p>}
              </div>
              <button type="submit" disabled={isPending}
                className="w-full h-12 bg-[#960000] hover:bg-[#7a0000] text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 hover:shadow-lg hover:shadow-[#960000]/30">
                {isPending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><LogIn className="w-4 h-4" /> Sign In</>}
              </button>
            </form>
            <div className="mt-6 text-center text-sm text-white/40">
              Don't have an account?{" "}
              <Link href="/register" className="text-[#4169E1] font-semibold hover:underline">Sign Up</Link>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-white/8 bg-white/3 p-3.5 text-xs text-white/35">
            <p className="font-semibold text-white/50 mb-1.5">Demo Credentials <span className="text-white/25">(password: admin123)</span></p>
            <div className="flex gap-4">
              <span>admin@hcdc.edu.ph</span>
              <span>archivist@hcdc.edu.ph</span>
              <span>student@hcdc.edu.ph</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Premium Error Modal ─── */}
      {errorModal && (() => {
        const cfg = modalConfig[errorModal.type];
        const Icon = cfg.icon;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setErrorModal(null)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="relative w-full max-w-md bg-[#0f1a2e] border border-white/10 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden"
              onClick={(e) => e.stopPropagation()}>
              <div className={`h-1 w-full bg-gradient-to-r ${cfg.gradient}`} />
              <div className="p-6">
                <button onClick={() => setErrorModal(null)} className="absolute top-4 right-4 text-white/30 hover:text-white/60 transition-colors">
                  <X className="w-5 h-5" />
                </button>
                <div className={`w-14 h-14 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center mb-4`}>
                  <Icon className={`w-7 h-7 ${cfg.color}`} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{errorModal.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{errorModal.message}</p>
                {errorModal.suggestion && <p className="text-white/40 text-xs leading-relaxed mt-2 italic">{errorModal.suggestion}</p>}
                <div className="flex gap-3 mt-6">
                  {errorModal.type === "not_found" ? (
                    <>
                      <button onClick={() => setErrorModal(null)} className="flex-1 h-11 rounded-xl border border-white/10 text-white/70 text-sm font-medium hover:bg-white/5 transition-colors">Try Again</button>
                      <Link href="/register" className="flex-1 h-11 rounded-xl bg-[#4169E1] hover:bg-[#3558c0] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors">Register Now</Link>
                    </>
                  ) : errorModal.type === "pending" ? (
                    <button onClick={() => setErrorModal(null)} className="w-full h-11 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-sm font-semibold hover:bg-amber-500/30 transition-colors">Understood</button>
                  ) : (
                    <button onClick={() => setErrorModal(null)} className="w-full h-11 rounded-xl bg-white/10 border border-white/10 text-white text-sm font-semibold hover:bg-white/15 transition-colors">Try Again</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
