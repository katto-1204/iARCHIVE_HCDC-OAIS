import * as React from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FileText, Lock, UserPlus, Database, ArrowLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { Button, Input, Label, Badge, Modal } from "@/components/ui-components";
import { Textarea } from "@/components/ui/textarea";
import { useRegister } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const registerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["student", "researcher", "alumni", "public"]),
  institution: z.string().min(1, "Institution/Affiliation is required"),
  purpose: z.string().optional(),
});

export default function Register() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const { mutate: mutateRegister, isPending } = useRegister();
  const [errorModal, setErrorModal] = React.useState<{ title: string; message: string } | null>(null);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "student" },
  });

  const onSubmit = (data: z.infer<typeof registerSchema>) => {
    mutateRegister({ data }, {
      onSuccess: () => {
        toast({ title: "Registration Submitted", description: "Your account is pending approval by an archivist." });
        setLocation("/login");
      },
      onError: (err: any) => {
        const message = err?.data?.error || err?.message || "Error registering";
        if (/already registered|email already|already in use/i.test(message)) {
          setErrorModal({ title: "Email Already Registered", message: "That email already exists. Please log in or use another email." });
          return;
        }
        toast({ title: "Registration Failed", description: message, variant: "destructive" });
      }
    });
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
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/10 group-hover:border-white/20 transition-colors">
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
          <p className="text-white/20 text-xs font-medium tracking-widest uppercase">© {new Date().getFullYear()} Holy Cross of Davao College</p>
        </div>
      </div>

      {/* Main Content Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 lg:p-24 bg-muted/10 overflow-y-auto">
        <div className="w-full max-w-xl space-y-10">
          <div className="space-y-3">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground -ml-4" onClick={() => window.history.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to iArchive
            </Button>
            <h2 className="text-4xl font-display font-bold text-[#050a14] tracking-tight">Request Account</h2>
            <p className="text-muted-foreground">Submit your application for archivist verification. Accounts are usually reviewed within 24 hours.</p>
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
                <Input {...form.register("password")} id="password" type="password" placeholder="••••••••" className="h-12 pl-11 border-muted-foreground/20 focus:border-[#4169E1] focus:ring-[#4169E1]/10 bg-white" />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
              {form.formState.errors.password && <p className="text-xs text-red-500 font-medium">{form.formState.errors.password.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-bold text-[#050a14]">User Category</Label>
                <select {...form.register("role")} className="flex h-12 w-full rounded-xl border border-muted-foreground/20 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4169E1]/10 focus:border-[#4169E1] disabled:cursor-not-allowed disabled:opacity-50 appearance-none">
                  <option value="student">HCDC User</option>
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
        <Modal
          isOpen={!!errorModal}
          onClose={() => setErrorModal(null)}
          title={errorModal?.title || "Registration Error"}
        >
          <p className="text-sm text-muted-foreground">{errorModal?.message}</p>
          <div className="mt-4 flex justify-end">
            <Button variant="accent" onClick={() => setErrorModal(null)}>Okay</Button>
          </div>
        </Modal>
      </div>
    </div>
  );
}
