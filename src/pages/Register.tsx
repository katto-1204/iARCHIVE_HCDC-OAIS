import * as React from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FileText, Library, Lock, CalendarDays } from "lucide-react";
import { Button, Card, Input, Label } from "@/components/ui-components";
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

  const { data: me } = useGetMe({ query: { retry: false } });
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
            toast({ title: "Request Failed", description: err.error?.error || "Error submitting request", variant: "destructive" });
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
        toast({ title: "Registration Failed", description: err.error?.error || "Error registering", variant: "destructive" });
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-muted/30 relative">
      <div className="absolute inset-0 bg-primary/5 pointer-events-none" style={{ backgroundImage: `url(${import.meta.env.BASE_URL}images/pattern.png)` }} />
      
      <Link href="/" className="relative z-10 inline-flex items-center gap-3 text-primary mb-8 hover:opacity-80 transition-opacity">
        <Library className="w-8 h-8 text-accent" />
        <span className="font-display font-bold text-2xl">iArchive</span>
      </Link>

      <Card className="w-full max-w-3xl p-8 shadow-2xl border-none relative z-10">
        {isRequestMode ? (
          <div className="grid grid-cols-1 md:grid-cols-[340px_1fr] gap-8">
            <div className="rounded-2xl border border-border/60 bg-white overflow-hidden flex flex-col min-h-[520px]">
              <div className="p-5 pb-0 flex items-center justify-between">
                <div className="inline-flex items-center gap-2 bg-[#0a1628] text-white rounded-xl px-3 py-1 text-xs font-bold">
                  <FileText className="w-4 h-4" /> Material
                </div>
              </div>

              <div className="h-56 bg-muted flex items-center justify-center overflow-hidden relative">
                {cover ? (
                  <img src={cover} alt="material cover" className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0">
                    <img
                      src={`${import.meta.env.BASE_URL}images/hcdchero.png`}
                      alt="material cover placeholder"
                      className="w-full h-full object-cover opacity-90"
                    />
                    <div className="absolute inset-0 bg-[#0a1628]/70" />
                    <div className="relative z-10 text-white/70 flex flex-col items-center justify-center px-6">
                      <FileText className="w-12 h-12" />
                      <p className="mt-2 text-xs">Cover not available</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-auto p-5 bg-[#f7f8fc] border-t border-border/60">
                <h3 className="text-lg font-bold text-[#0a1628] line-clamp-2">{materialTitle}</h3>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <CalendarDays className="w-4 h-4 text-muted-foreground/70" />
                  <span className="font-medium">{materialDate ?? "—"}</span>
                </div>
                <p className="mt-3 text-xs text-muted-foreground/70 leading-relaxed">
                  Submit your research purpose. An archivist will review your request.
                </p>
              </div>
            </div>

            <div>
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-primary mb-2">Request Access</h2>
                <p className="text-muted-foreground text-sm">For restricted archival materials.</p>
              </div>

              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <Label>Purpose</Label>
                  <Textarea
                    {...form.register("purpose")}
                    className="w-full"
                    placeholder="Briefly describe what you will research and why you need access."
                  />
                  {form.formState.errors.purpose && (
                    <p className="text-xs text-destructive">{form.formState.errors.purpose.message}</p>
                  )}
                </div>

                {!me && (
                  <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                    <div className="flex items-center gap-2 mb-1">
                      <Lock className="w-4 h-4" /> Sign in required
                    </div>
                    You must be logged in to submit requests.
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 text-base mt-2"
                  variant="accent"
                  isLoading={isRequestPending}
                  disabled={!me}
                >
                  Submit Request
                </Button>
              </form>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-primary mb-2">Request Account</h2>
              <p className="text-muted-foreground text-sm">Access restricted materials for academic research.</p>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input {...form.register("name")} placeholder="Juan Dela Cruz" />
                  {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input {...form.register("email")} placeholder="name@hcdc.edu.ph" />
                  {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" {...form.register("password")} placeholder="••••••••" />
                {form.formState.errors.password && <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>User Category</Label>
                <select {...form.register("role")} className="flex h-11 w-full rounded-xl border-2 border-border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-primary/10 transition-all">
                  <option value="student">HCDC Student</option>
                  <option value="researcher">External Researcher</option>
                  <option value="alumni">HCDC Alumni</option>
                  <option value="public">General Public</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Institution / Affiliation</Label>
                <Input {...form.register("institution")} placeholder="e.g. Holy Cross of Davao College" />
              </div>

              <div className="space-y-2">
                <Label>Research Purpose</Label>
                <Textarea
                  {...form.register("purpose")}
                  placeholder="Briefly describe what collections you intend to research and why."
                  className="w-full resize-none"
                />
              </div>

              <Button type="submit" className="w-full h-12 text-base mt-4" variant="accent" isLoading={isRegisterPending}>
                Submit Registration
              </Button>
            </form>

            <div className="mt-8 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-semibold hover:underline">
                Sign In
              </Link>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
