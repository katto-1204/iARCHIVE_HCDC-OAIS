import * as React from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Library, ShieldCheck, Search, Users } from "lucide-react";
import { Button, Card, Input, Label } from "@/components/ui-components";
import { useLogin } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { mutate, isPending } = useLogin();
  
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: z.infer<typeof schema>) => {
    mutate({ data }, {
      onSuccess: (res) => {
        localStorage.setItem("iarchive_token", res.token);
        toast({ title: "Welcome back!", description: "Successfully logged in." });
        if (res.user.role === 'admin') {
          setLocation('/admin');
        } else if (res.user.role === 'archivist') {
          setLocation('/archivist');
        } else if (res.user.role === 'student') {
          setLocation('/student');
        } else {
          setLocation('/collections');
        }
      },
      onError: (err) => {
        toast({ title: "Login Failed", description: err.error?.error || "Invalid credentials", variant: "destructive" });
      }
    });
  };

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Left side info panel */}
      <div className="hidden lg:flex flex-1 bg-primary relative flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: `url(${import.meta.env.BASE_URL}images/pattern.png)` }} />
        
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3 text-white hover:opacity-80 transition-opacity">
            <Library className="w-8 h-8 text-accent" />
            <span className="font-display font-bold text-2xl">iArchive</span>
          </Link>
        </div>

        <div className="relative z-10 max-w-lg mt-20">
          <h1 className="text-4xl font-display font-bold text-white mb-6 leading-snug">Secure Access to Institutional Heritage</h1>
          <div className="space-y-6">
            <div className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <ShieldCheck className="w-8 h-8 text-accent shrink-0" />
              <div>
                <h3 className="text-white font-semibold">Administrators & Archivists</h3>
                <p className="text-white/60 text-sm mt-1">Manage ingest workflows, metadata cataloging, and physical preservation records.</p>
              </div>
            </div>
            <div className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <Search className="w-8 h-8 text-accent shrink-0" />
              <div>
                <h3 className="text-white font-semibold">Researchers & Faculty</h3>
                <p className="text-white/60 text-sm mt-1">Request access to restricted collections for academic and institutional research.</p>
              </div>
            </div>
            <div className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <Users className="w-8 h-8 text-accent shrink-0" />
              <div>
                <h3 className="text-white font-semibold">Public Users & Alumni</h3>
                <p className="text-white/60 text-sm mt-1">Browse public historical photographs, yearbooks, and non-confidential records.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="relative z-10 mt-auto pt-12">
          <p className="text-white/50 text-sm">© {new Date().getFullYear()} Holy Cross of Davao College. All rights reserved.</p>
        </div>
      </div>

      {/* Right side form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative">
        <Link href="/" className="absolute top-6 left-6 lg:hidden flex items-center gap-2 text-primary font-bold">
          <Library className="w-6 h-6 text-accent" /> iArchive
        </Link>
        
        <Card className="w-full max-w-md p-8 shadow-2xl border-none">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-primary mb-2">Welcome Back</h2>
            <p className="text-muted-foreground">Sign in to your iArchive account</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-5">
            {[
              { label: "Admin", email: "admin@hcdc.edu.ph" },
              { label: "Archivist", email: "archivist@hcdc.edu.ph" },
              { label: "Student", email: "student@hcdc.edu.ph" },
            ].map((u) => (
              <button
                key={u.email}
                type="button"
                onClick={() => {
                  form.setValue("email", u.email, { shouldDirty: true });
                  form.setValue("password", "admin123", { shouldDirty: true });
                }}
                className="h-10 rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/50 text-sm font-semibold text-foreground transition-colors"
              >
                Fill {u.label}
              </button>
            ))}
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input {...form.register("email")} placeholder="name@hcdc.edu.ph" autoFocus />
              {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Password</Label>
              </div>
              <Input type="password" {...form.register("password")} placeholder="••••••••" />
              {form.formState.errors.password && <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>}
            </div>

            <Button type="submit" className="w-full h-12 text-base mt-2" isLoading={isPending}>
              Sign In
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/register" className="text-accent font-semibold hover:underline">
              Request Access
            </Link>
          </div>
          <div className="mt-6 rounded-xl border border-border/60 bg-muted/40 p-4 text-xs">
            <p className="font-semibold text-foreground mb-2">Demo Credentials (password: admin123)</p>
            <p>Admin: admin@hcdc.edu.ph</p>
            <p>Archivist: archivist@hcdc.edu.ph</p>
            <p>Student: student@hcdc.edu.ph</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
