import * as React from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ShieldCheck, Search, LogIn, Sparkles, Lock, Clock, AlertTriangle, XCircle, ShieldAlert, X, Ban, CheckCircle2, Scale, Eye, EyeOff, Database, FileText } from "lucide-react";
import { useLogin } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

type ErrorModalData = {
  type: "pending" | "not_found" | "invalid" | "rejected" | "error";
  title: string;
  message: string;
  suggestion?: string;
};

const termsContent = [
  { title: "Acceptance of Terms", icon: CheckCircle2, content: "By accessing or using the iArchive platform (the \"System\") of Holy Cross of Davao College (HCDC), you acknowledge that you have read, understood, and agree to be bound by these Terms of Use and all applicable laws and regulations in the Philippines, including the Data Privacy Act of 2012." },
  { title: "Authorized Access", icon: Lock, content: "Access to specific archival materials is granted based on user roles and institutional affiliation. Restricted and confidential materials require explicit approval from the HCDC Archiving Department. Users are prohibited from sharing their credentials or attempting to bypass security measures to access unauthorized content." },
  { title: "Intellectual Property & Usage", icon: Scale, content: "Materials in the iArchive are protected by copyright and other intellectual property rights. Unless otherwise specified (e.g., Public Domain or Creative Commons), digital objects are provided for personal research, teaching, and private study only. Commercial use or redistribution without written consent from HCDC or the original rights holder is strictly prohibited." },
  { title: "Data Privacy & Ethical Use", icon: Eye, content: "iArchive collects and processes personal information in accordance with the HCDC Privacy Policy. Users must handle all data obtained through the System ethically and legally, particularly when archival records contain sensitive personal information or represent cultural heritage." },
  { title: "Preservation & Integrity", icon: Database, content: "The archival integrity of digital objects is maintained through industry-standard fixity checks (SHA-256). Users shall not alter, deface, or misrepresent the material or metadata found within the System. Any identified discrepancies should be reported to the System Administrator." },
];

const privacyContent = [
  { title: "Information We Collect", content: "iArchive collects personal data necessary for account creation and system access, including your name, email address, institutional affiliation, and role. Usage data such as login activity, access requests, and browsing history within the archive may also be recorded for audit and security purposes." },
  { title: "How We Use Your Data", content: "Your personal information is used to authenticate access, manage user roles, process access requests for restricted materials, and maintain audit trails as required by archival standards (OAIS ISO 14721). We do not sell or share your personal data with third parties." },
  { title: "Data Protection", content: "All personal data is stored securely using industry-standard encryption. Access to user data is restricted to authorized administrators. We comply with the Philippine Data Privacy Act of 2012 (Republic Act No. 10173) and implement appropriate technical and organizational security measures." },
  { title: "Your Rights", content: "You have the right to access, correct, or request deletion of your personal data. To exercise these rights, please contact the HCDC Archival Administration team. You may also file a complaint with the National Privacy Commission if you believe your data privacy rights have been violated." },
];

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { mutate, isPending } = useLogin();
  const [errorModal, setErrorModal] = React.useState<ErrorModalData | null>(null);
  const [termsAccepted, setTermsAccepted] = React.useState(false);
  const [termsModalOpen, setTermsModalOpen] = React.useState<"terms" | "privacy" | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);

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
        if (/rejected/i.test(message)) {
          setErrorModal({ type: "rejected", title: "Account Rejected", message, suggestion: "If you believe this was a mistake, please contact the HCDC Archival Administration team." });
        } else if (/pending|approval|not active|wait/i.test(message)) {
          setErrorModal({ type: "pending", title: "Account Pending Approval", message, suggestion: "Your registration was received. An administrator will review and activate your account shortly." });
        } else if (/not found|no account|register first/i.test(message)) {
          setErrorModal({ type: "not_found", title: "Account Not Found", message, suggestion: "Would you like to create a new account?" });
        } else if (/incorrect|invalid|wrong|credentials|password/i.test(message)) {
          setErrorModal({ type: "invalid", title: "Invalid Credentials", message: "Invalid credentials!", suggestion: "Please double-check your email and password." });
        } else {
          setErrorModal({ type: "error", title: "Login Failed", message });
        }
      }
    });
  };


  const modalConfig = {
    pending: { icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", gradient: "from-amber-500 to-amber-600" },
    not_found: { icon: AlertTriangle, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", gradient: "from-blue-500 to-blue-600" },
    invalid: { icon: ShieldAlert, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", gradient: "from-red-500 to-red-600" },
    rejected: { icon: Ban, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20", gradient: "from-red-600 to-red-800" },
    error: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", gradient: "from-red-500 to-red-600" },
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0a1628] relative overflow-hidden">
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
              { icon: ShieldCheck, title: "OAIS Aligned", desc: "Built on the ISO 14721:2012 preservation framework" },
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
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-12 sm:p-12 relative z-10">
        <div className="lg:hidden flex items-center justify-center shrink-0 mb-10 w-full">
          <Link href="/" className="flex items-center gap-3">
            <img src={`${import.meta.env.BASE_URL}logos/iarchive%20white%20logo.png`} alt="iArchive" className="h-9 w-auto object-contain" />
          </Link>
        </div>
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Form */}
          <div className="bg-[#0b1220]/80 backdrop-blur-2xl rounded-3xl border border-white/10 p-7 sm:p-10 shadow-2xl shadow-black/60 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#4169E1] via-[#7c94e8] to-[#960000]" />
            <div className="mb-8">
              <h2 className="text-3xl font-black text-white mb-2">Sign In</h2>
              <p className="text-white/50 text-sm">Enter your credentials to continue</p>
            </div>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label className="text-white/70 text-sm font-medium">Email</label>
                <input {...form.register("email")} placeholder="name@hcdc.edu.ph" autoFocus
                  className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-[#4169E1]/50 focus:ring-1 focus:ring-[#4169E1]/30 transition-all" />
                {form.formState.errors.email && <p className="text-sm text-red-400">{form.formState.errors.email.message}</p>}
              </div>
              <div className="space-y-2 relative">
                <label className="text-white/70 text-sm font-medium">Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} {...form.register("password")} placeholder="••••••••"
                    className="w-full h-11 bg-white/5 border border-white/10 rounded-xl pl-4 pr-10 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-[#4169E1]/50 focus:ring-1 focus:ring-[#4169E1]/30 transition-all" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.formState.errors.password && <p className="text-sm text-red-400">{form.formState.errors.password.message}</p>}
              </div>
              {/* Terms of Use & Privacy Policy Checkbox */}
              <div className="flex items-start gap-3 pt-1">
                <input
                  type="checkbox"
                  id="terms-checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 accent-[#4169E1] cursor-pointer shrink-0"
                />
                <label htmlFor="terms-checkbox" className="text-white/60 text-sm leading-relaxed cursor-pointer select-none">
                  I agree to the{" "}
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setTermsModalOpen("terms"); }}
                    className="text-[#4169E1] font-semibold underline underline-offset-2 hover:text-[#7c94e8] transition-colors"
                  >
                    Terms of Use
                  </button>{" "}
                  and{" "}
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setTermsModalOpen("privacy"); }}
                    className="text-[#4169E1] font-semibold underline underline-offset-2 hover:text-[#7c94e8] transition-colors"
                  >
                    Privacy Policy
                  </button>
                </label>
              </div>
              <button type="submit" disabled={isPending || !termsAccepted}
                className="w-full h-12 bg-[#960000] hover:bg-[#7a0000] text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-[#960000]/30">
                {isPending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><LogIn className="w-4 h-4" /> Sign In</>}
              </button>
            </form>
            <div className="mt-6 text-center text-sm text-white/40">
              Don't have an account?{" "}
              <Link href="/register" className="text-[#4169E1] font-semibold hover:underline">Sign Up</Link>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Terms / Privacy Policy Modal ─── */}
      {termsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setTermsModalOpen(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-2xl max-h-[85vh] bg-[#0f1a2e] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-white/10 bg-gradient-to-r from-[#0f1a2e] to-[#131f35] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#4169E1]/10 border border-[#4169E1]/20 flex items-center justify-center">
                  {termsModalOpen === "terms" ? <ShieldCheck className="w-5 h-5 text-[#4169E1]" /> : <Eye className="w-5 h-5 text-[#4169E1]" />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{termsModalOpen === "terms" ? "Terms of Use" : "Privacy Policy"}</h3>
                  <p className="text-xs text-white/40">Holy Cross of Davao College — iArchive</p>
                </div>
              </div>
              <button onClick={() => setTermsModalOpen(null)} className="text-white/30 hover:text-white/70 transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 custom-scrollbar">
              {termsModalOpen === "terms" ? (
                <>
                  <p className="text-white/50 text-sm leading-relaxed">
                    By using the iArchive platform, you agree to the following terms and conditions governing your access to and use of the digital archival system of Holy Cross of Davao College.
                  </p>
                  {termsContent.map((section, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/8 rounded-xl p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-[#4169E1]/10 flex items-center justify-center shrink-0">
                          <section.icon className="w-4 h-4 text-[#4169E1]" />
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-[#4169E1] uppercase tracking-widest">Article {idx + 1}</span>
                          <h4 className="text-sm font-bold text-white">{section.title}</h4>
                        </div>
                      </div>
                      <p className="text-white/55 text-sm leading-relaxed pl-11">{section.content}</p>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <p className="text-white/50 text-sm leading-relaxed">
                    This Privacy Policy describes how the iArchive platform collects, uses, and protects your personal information in compliance with the Data Privacy Act of 2012.
                  </p>
                  {privacyContent.map((section, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/8 rounded-xl p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-[#4169E1]/10 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-[#4169E1]" />
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-[#4169E1] uppercase tracking-widest">Section {idx + 1}</span>
                          <h4 className="text-sm font-bold text-white">{section.title}</h4>
                        </div>
                      </div>
                      <p className="text-white/55 text-sm leading-relaxed pl-11">{section.content}</p>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Modal Footer — Tabs + Accept */}
            <div className="px-6 py-4 border-t border-white/10 bg-[#0c1525] flex items-center justify-between gap-3 shrink-0">
              <div className="flex gap-2">
                <button
                  onClick={() => setTermsModalOpen("terms")}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${termsModalOpen === "terms" ? "bg-[#4169E1]/20 text-[#4169E1] border border-[#4169E1]/30" : "text-white/40 hover:text-white/60 border border-white/10"}`}
                >
                  Terms of Use
                </button>
                <button
                  onClick={() => setTermsModalOpen("privacy")}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${termsModalOpen === "privacy" ? "bg-[#4169E1]/20 text-[#4169E1] border border-[#4169E1]/30" : "text-white/40 hover:text-white/60 border border-white/10"}`}
                >
                  Privacy Policy
                </button>
              </div>
              <button
                onClick={() => { setTermsAccepted(true); setTermsModalOpen(null); }}
                className="bg-[#4169E1] hover:bg-[#3558c0] text-white text-sm font-bold px-6 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-[#4169E1]/20"
              >
                <CheckCircle2 className="w-4 h-4" /> I Have Agreed
              </button>
            </div>
          </div>
        </div>
      )}

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
                  ) : errorModal.type === "rejected" ? (
                    <button onClick={() => setErrorModal(null)} className="w-full h-11 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm font-semibold hover:bg-red-500/30 transition-colors">I Understand</button>
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
